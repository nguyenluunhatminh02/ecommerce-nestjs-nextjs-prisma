import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

  async getActive() {
    const now = new Date();
    return this.prisma.promotions.findMany({
      where: { active: true, start_date: { lte: now }, end_date: { gt: now } },
      orderBy: { created_at: 'desc' },
    });
  }

  async getAll() {
    return this.prisma.promotions.findMany({ orderBy: { created_at: 'desc' } });
  }

  async getById(id: number) {
    const promo = await this.prisma.promotions.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException();
    return promo;
  }

  async create(dto: any) {
    return this.prisma.promotions.create({
      data: {
        name: dto.name, description: dto.description,
        discount_type: dto.discountType, discount_value: dto.discountValue,
        minimum_order_amount: dto.minimumOrderAmount, maximum_discount: dto.maximumDiscount,
        start_date: new Date(dto.startDate), end_date: new Date(dto.endDate),
        category_id: dto.categoryId, product_id: dto.productId,
      },
    });
  }

  async update(id: number, dto: any) {
    return this.prisma.promotions.update({ where: { id }, data: dto });
  }

  async delete(id: number) {
    return this.prisma.promotions.delete({ where: { id } });
  }
}
