import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getUsers(query: any) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (+page - 1) * +limit;
    const where: any = {};
    if (search) where.OR = [{ first_name: { contains: search, mode: 'insensitive' } }, { last_name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];
    const [items, total] = await Promise.all([
      this.prisma.users.findMany({ where, skip, take: +limit, orderBy: { created_at: 'desc' }, select: { id: true, first_name: true, last_name: true, email: true, is_active: true, created_at: true, avatar_url: true } }),
      this.prisma.users.count({ where }),
    ]);
    return { items, total, page: +page, limit: +limit };
  }

  async toggleUserStatus(userId: string) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    return this.prisma.users.update({ where: { id: userId }, data: { is_active: !user.is_active } });
  }

  async getOrders(query: any) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (+page - 1) * +limit;
    const where: any = {};
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      this.prisma.orders.findMany({
        where, skip, take: +limit, orderBy: { created_at: 'desc' },
        include: { users: { select: { id: true, first_name: true, last_name: true, email: true } }, items: { include: { products: { select: { id: true, name: true } } } } },
      }),
      this.prisma.orders.count({ where }),
    ]);
    return { items, total, page: +page, limit: +limit };
  }

  async updateOrderStatus(orderId: string, status: string, note?: string) {
    return this.prisma.orders.update({
      where: { id: orderId },
      data: { status, status_history: { create: { status, note: note || `Status updated to ${status}` } } },
    });
  }

  async getReturns(query: any) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (+page - 1) * +limit;
    const where: any = {};
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      this.prisma.return_requests.findMany({
        where, skip, take: +limit, orderBy: { created_at: 'desc' },
        include: { users: { select: { id: true, first_name: true, last_name: true } }, orders: true },
      }),
      this.prisma.return_requests.count({ where }),
    ]);
    return { items, total, page: +page, limit: +limit };
  }

  async handleReturn(id: number, dto: { status: string; refundAmount?: number }) {
    const data: any = { status: dto.status };
    if (dto.refundAmount) data.refund_amount = dto.refundAmount;
    return this.prisma.return_requests.update({ where: { id }, data });
  }

  async getTickets(query: any) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (+page - 1) * +limit;
    const where: any = {};
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      this.prisma.support_tickets.findMany({
        where, skip, take: +limit, orderBy: { created_at: 'desc' },
        include: { users: { select: { id: true, first_name: true, last_name: true, email: true } } },
      }),
      this.prisma.support_tickets.count({ where }),
    ]);
    return { items, total, page: +page, limit: +limit };
  }

  async getProducts(query: any) {
    const { search, page = 1, limit = 20, status, category } = query;
    const p = Math.max(1, +page);
    const l = Math.max(1, +limit);
    const skip = (p - 1) * l;
    const where: any = { deleted: false };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;
    if (category) where.category_id = category;
    const [items, total] = await Promise.all([
      this.prisma.products.findMany({ where, skip, take: l, orderBy: { created_at: 'desc' }, include: { categories: { select: { id: true, name: true } }, shops: { select: { id: true, name: true } } } }),
      this.prisma.products.count({ where }),
    ]);
    return { items, total, page: p, limit: l };
  }

  async getCategories(query: any) {
    const { page = 1, limit = 50 } = query;
    const p = Math.max(1, +page);
    const l = Math.max(1, +limit);
    const skip = (p - 1) * l;
    const [items, total] = await Promise.all([
      this.prisma.categories.findMany({ skip, take: l, orderBy: { name: 'asc' } }),
      this.prisma.categories.count(),
    ]);
    return { items, total, page: p, limit: l };
  }

  async getOrderStats() {
    const [total, pending, processing, shipped, delivered, cancelled, revenue] = await Promise.all([
      this.prisma.orders.count(),
      this.prisma.orders.count({ where: { status: 'PENDING' } }),
      this.prisma.orders.count({ where: { status: 'PROCESSING' } }),
      this.prisma.orders.count({ where: { status: 'SHIPPED' } }),
      this.prisma.orders.count({ where: { status: 'DELIVERED' } }),
      this.prisma.orders.count({ where: { status: 'CANCELLED' } }),
      this.prisma.orders.aggregate({ _sum: { total_amount: true } }),
    ]);
    return { total, pending, processing, shipped, delivered, cancelled, totalRevenue: Number(revenue._sum.total_amount || 0) };
  }
}
