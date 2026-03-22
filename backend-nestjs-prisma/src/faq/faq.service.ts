import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FaqService {
  constructor(private prisma: PrismaService) {}

  async getAll(category?: string) {
    const where: any = { active: true };
    if (category) where.category = category;
    return this.prisma.faqs.findMany({ where, orderBy: { sort_order: 'asc' } });
  }

  async create(dto: any) {
    return this.prisma.faqs.create({
      data: { question: dto.question, answer: dto.answer, category: dto.category, sort_order: dto.sortOrder || 0 },
    });
  }

  async update(id: number, dto: any) {
    return this.prisma.faqs.update({ where: { id }, data: dto });
  }

  async delete(id: number) {
    return this.prisma.faqs.update({ where: { id }, data: { active: false } });
  }
}
