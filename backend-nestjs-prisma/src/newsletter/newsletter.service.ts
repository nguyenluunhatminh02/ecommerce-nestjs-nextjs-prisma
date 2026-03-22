import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsletterService {
  constructor(private prisma: PrismaService) {}

  async subscribe(email: string) {
    const existing = await this.prisma.newsletters.findUnique({ where: { email } });
    if (existing) {
      if (existing.active) throw new ConflictException('Already subscribed');
      return this.prisma.newsletters.update({ where: { email }, data: { active: true } });
    }
    return this.prisma.newsletters.create({ data: { email } });
  }

  async unsubscribe(email: string) {
    return this.prisma.newsletters.updateMany({ where: { email }, data: { active: false } });
  }

  async getAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.newsletters.findMany({ where: { active: true }, skip, take: limit, orderBy: { subscribed_at: 'desc' } }),
      this.prisma.newsletters.count({ where: { active: true } }),
    ]);
    return { items, total, page, limit };
  }
}
