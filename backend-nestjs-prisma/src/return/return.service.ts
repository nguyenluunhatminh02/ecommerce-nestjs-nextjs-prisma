import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReturnService {
  constructor(private prisma: PrismaService) {}

  async getMyReturns(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.return_requests.findMany({
        where: { user_id: userId }, skip, take: limit, orderBy: { created_at: 'desc' },
        include: { orders: { select: { id: true, order_number: true } } },
      }),
      this.prisma.return_requests.count({ where: { user_id: userId } }),
    ]);
    return { items, total, page, limit };
  }

  async create(userId: string, dto: any) {
    const returnNumber = `RET-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    return this.prisma.return_requests.create({
      data: {
        return_number: returnNumber,
        user_id: userId, order_id: dto.orderId,
        reason: dto.reason,
        status: 'PENDING',
      },
    });
  }

  async getById(userId: string, id: number) {
    const ret = await this.prisma.return_requests.findFirst({
      where: { id, user_id: userId },
      include: { orders: true },
    });
    if (!ret) throw new NotFoundException();
    return ret;
  }

  // Admin
  async getAllReturns(query: any) {
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

  async updateStatus(id: number, status: string, adminNote?: string, refundAmount?: number) {
    const data: any = { status };
    if (adminNote) data.admin_note = adminNote;
    if (refundAmount) data.refund_amount = refundAmount;
    return this.prisma.return_requests.update({ where: { id }, data });
  }
}
