import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async getPending(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { deleted: false, approved: false };
    const [items, total] = await Promise.all([
      this.prisma.reviews.findMany({
        where, skip, take: limit, orderBy: { created_at: 'desc' },
        include: { users: { select: { id: true, first_name: true, last_name: true, avatar_url: true } }, products: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.reviews.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getByProduct(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = { product_id: productId, deleted: false };
    const [items, total] = await Promise.all([
      this.prisma.reviews.findMany({
        where, skip, take: limit, orderBy: { created_at: 'desc' },
        include: { users: { select: { id: true, first_name: true, last_name: true, avatar_url: true } }, replies: { include: { users: { select: { id: true, first_name: true, last_name: true } } } } },
      }),
      this.prisma.reviews.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
      content: items,
      page: page - 1,
      size: limit,
      totalElements: total,
      totalPages,
      first: page === 1,
      last: page >= totalPages,
    };
  }

  async create(userId: string, dto: any) {
    const existing = await this.prisma.reviews.findFirst({
      where: { user_id: userId, product_id: dto.productId, deleted: false },
    });
    if (existing) throw new BadRequestException('You have already reviewed this product');

    const review = await this.prisma.reviews.create({
      data: { user_id: userId, product_id: dto.productId, rating: dto.rating, comment: dto.comment },
    });
    // Update product average rating
    const agg = await this.prisma.reviews.aggregate({
      where: { product_id: dto.productId, deleted: false },
      _avg: { rating: true }, _count: true,
    });
    await this.prisma.products.update({
      where: { id: dto.productId },
      data: { average_rating: agg._avg.rating || 0, review_count: agg._count },
    });
    return review;
  }

  async update(userId: string, id: string, dto: any) {
    const review = await this.prisma.reviews.findFirst({ where: { id, user_id: userId, deleted: false } });
    if (!review) throw new NotFoundException();
    return this.prisma.reviews.update({
      where: { id },
      data: { rating: dto.rating, comment: dto.comment },
    });
  }

  async delete(userId: string, id: string) {
    const review = await this.prisma.reviews.findFirst({ where: { id, user_id: userId } });
    if (!review) throw new NotFoundException();
    return this.prisma.reviews.update({ where: { id }, data: { deleted: true } });
  }

  async reply(userId: string, reviewId: string, replyText: string) {
    return this.prisma.review_replies.create({
      data: { review_id: reviewId, user_id: userId, reply: replyText },
    });
  }

  async helpful(userId: string, reviewId: string) {
    await this.prisma.reviews.update({ where: { id: reviewId }, data: { helpful_count: { increment: 1 } } });
    return { message: 'Marked as helpful' };
  }

  async getRatingDistribution(productId: string) {
    const reviews = await this.prisma.reviews.groupBy({
      by: ['rating'],
      where: { product_id: productId, deleted: false },
      _count: true,
    });
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      distribution[r.rating] = r._count;
    }
    return distribution;
  }
}
