import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getMyTickets(userId: string, page = 0, size = 10) {
    const skip = page * size;
    const [items, total] = await Promise.all([
      this.prisma.support_tickets.findMany({
        where: { user_id: userId }, skip, take: size, orderBy: { created_at: 'desc' },
        include: { messages: { orderBy: { created_at: 'asc' }, include: { users: { select: { id: true, first_name: true, last_name: true } } } } },
      }),
      this.prisma.support_tickets.count({ where: { user_id: userId } }),
    ]);
    const totalPages = Math.ceil(total / size);
    return { content: items, page, size, totalElements: total, totalPages, first: page === 0, last: page >= totalPages - 1 };
  }

  async getById(userId: string, id: string) {
    const ticket = await this.prisma.support_tickets.findFirst({
      where: { id, user_id: userId },
      include: { messages: { orderBy: { created_at: 'asc' }, include: { users: { select: { id: true, first_name: true, last_name: true, avatar_url: true } } } } },
    });
    if (!ticket) throw new NotFoundException();
    return ticket;
  }

  async create(userId: string, dto: any) {
    const ticketNumber = `TKT-${Date.now()}`;
    return this.prisma.support_tickets.create({
      data: {
        ticket_number: ticketNumber, user_id: userId, subject: dto.subject,
        description: dto.description || dto.message,
        category: dto.category, priority: dto.priority || 'MEDIUM', status: 'OPEN',
        messages: { create: { user_id: userId, message: dto.message, is_staff: false } },
      },
      include: { messages: true },
    });
  }

  async reply(userId: string, ticketId: string, message: string, isStaff = false) {
    return this.prisma.ticket_messages.create({
      data: { ticket_id: ticketId, user_id: userId, message, is_staff: isStaff },
      include: { users: { select: { id: true, first_name: true, last_name: true } } },
    });
  }

  async close(userId: string, id: string) {
    await this.getById(userId, id);
    return this.prisma.support_tickets.update({ where: { id }, data: { status: 'CLOSED' } });
  }

  // Admin
  async getAllTickets(query: any) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (+page - 1) * +limit;
    const where: any = {};
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      this.prisma.support_tickets.findMany({
        where, skip, take: +limit, orderBy: { created_at: 'desc' },
        include: { users: { select: { id: true, first_name: true, last_name: true, email: true } }, messages: { take: 1, orderBy: { created_at: 'desc' } } },
      }),
      this.prisma.support_tickets.count({ where }),
    ]);
    return { items, total, page: +page, limit: +limit };
  }

  async assignTicket(id: string, assignedTo: string) {
    return this.prisma.support_tickets.update({ where: { id }, data: { assigned_to: assignedTo, status: 'IN_PROGRESS' } });
  }

  async updateTicketStatus(id: string, status: string) {
    return this.prisma.support_tickets.update({ where: { id }, data: { status } });
  }
}
