import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductQuestionService {
  constructor(private prisma: PrismaService) {}

  async getByProduct(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = { product_id: productId };
    const [items, total] = await Promise.all([
      this.prisma.product_questions.findMany({
        where, skip, take: limit, orderBy: { created_at: 'desc' },
        include: { users: { select: { id: true, first_name: true, last_name: true, avatar_url: true } } },
      }),
      this.prisma.product_questions.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async ask(userId: string, productId: string, question: string) {
    return this.prisma.product_questions.create({
      data: { product_id: productId, user_id: userId, question },
    });
  }

  async answer(id: number, answer: string, answeredById: string) {
    return this.prisma.product_questions.update({
      where: { id },
      data: { answer, answered_by: answeredById },
    });
  }
}
