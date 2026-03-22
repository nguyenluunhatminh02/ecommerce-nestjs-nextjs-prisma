import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  async getAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.coupons.findMany({ where: { deleted: false }, skip, take: limit, orderBy: { created_at: 'desc' } }),
      this.prisma.coupons.count({ where: { deleted: false } }),
    ]);
    return { items, total, page, limit };
  }

  async getActive(page = 0, size = 10) {
    const now = new Date();
    const skip = page * size;
    const where = { deleted: false, active: true, start_date: { lte: now }, end_date: { gt: now } };
    const [items, total] = await Promise.all([
      this.prisma.coupons.findMany({ where, skip, take: size, orderBy: { created_at: 'desc' } }),
      this.prisma.coupons.count({ where }),
    ]);
    const totalPages = Math.ceil(total / size);
    return { content: items, page, size, totalElements: total, totalPages, first: page === 0, last: page >= totalPages - 1 };
  }

  async getByCode(code: string) {
    const coupon = await this.prisma.coupons.findFirst({ where: { code, deleted: false } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async validate(code: string, subtotal: number) {
    const coupon = await this.getByCode(code);
    if (!coupon.active) return { valid: false, message: 'Coupon is inactive' };
    if (coupon.end_date && coupon.end_date < new Date()) return { valid: false, message: 'Coupon expired' };
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) return { valid: false, message: 'Usage limit reached' };
    if (coupon.minimum_order_amount && subtotal < Number(coupon.minimum_order_amount)) return { valid: false, message: `Minimum order: ${coupon.minimum_order_amount}` };

    let discount = coupon.discount_type === 'PERCENTAGE'
      ? subtotal * Number(coupon.discount_value) / 100
      : Number(coupon.discount_value);
    if (coupon.maximum_discount && discount > Number(coupon.maximum_discount)) discount = Number(coupon.maximum_discount);
    return { valid: true, discount, coupon };
  }

  async create(dto: any) {
    return this.prisma.coupons.create({
      data: {
        code: dto.code.toUpperCase(),
        description: dto.description,
        discount_type: dto.discountType,
        discount_value: dto.discountValue,
        minimum_order_amount: dto.minOrderAmount,
        maximum_discount: dto.maxDiscount,
        usage_limit: dto.usageLimit,
        start_date: dto.startsAt ? new Date(dto.startsAt) : new Date(),
        end_date: dto.expiresAt ? new Date(dto.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async update(id: number, dto: any) {
    return this.prisma.coupons.update({ where: { id }, data: dto });
  }

  async delete(id: number) {
    return this.prisma.coupons.update({ where: { id }, data: { deleted: true } });
  }

  async toggle(id: number) {
    const coupon = await this.prisma.coupons.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return this.prisma.coupons.update({ where: { id }, data: { active: !coupon.active } });
  }
}
