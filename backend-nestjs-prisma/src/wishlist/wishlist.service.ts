import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getAll(userId: string, page = 0, size = 20) {
    const skip = page * size;
    const where = { user_id: userId };
    const [items, total] = await Promise.all([
      this.prisma.wishlists.findMany({
        where,
        include: { products: { include: { images: { take: 1 } } } },
        orderBy: { created_at: 'desc' },
        skip, take: size,
      }),
      this.prisma.wishlists.count({ where }),
    ]);
    const totalPages = Math.ceil(total / size);
    const content = items.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.products?.name ?? null,
      product_slug: item.products?.slug ?? null,
      product_image: item.products?.images?.[0]?.image_url ?? null,
      price: item.products ? Number(item.products.price) : 0,
      compare_at_price: item.products?.compare_at_price ? Number(item.products.compare_at_price) : null,
      average_rating: item.products?.average_rating ?? null,
      total_reviews: item.products?.review_count ?? null,
      status: item.products?.status ?? null,
      added_at: item.created_at,
    }));
    return { content, page, size, totalElements: total, totalPages, first: page === 0, last: page >= totalPages - 1 };
  }

  async toggle(userId: string, productId: string) {
    const existing = await this.prisma.wishlists.findUnique({
      where: { user_id_product_id: { user_id: userId, product_id: productId } },
    });
    if (existing) {
      await this.prisma.wishlists.delete({ where: { id: existing.id } });
      return { added: false };
    }
    await this.prisma.wishlists.create({ data: { user_id: userId, product_id: productId } });
    return { added: true };
  }

  async check(userId: string, productId: string) {
    const item = await this.prisma.wishlists.findUnique({
      where: { user_id_product_id: { user_id: userId, product_id: productId } },
    });
    return { inWishlist: !!item };
  }

  async remove(userId: string, productId: string) {
    await this.prisma.wishlists.deleteMany({ where: { user_id: userId, product_id: productId } });
    return { message: 'Removed from wishlist' };
  }

  async count(userId: string) {
    return this.prisma.wishlists.count({ where: { user_id: userId } });
  }

  async clearAll(userId: string) {
    await this.prisma.wishlists.deleteMany({ where: { user_id: userId } });
    return { message: 'Wishlist cleared' };
  }
}
