import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug } from '../common/utils/slug.util';

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) {}

  async getAll(search?: string, page = 0, size = 20) {
    const skip = page * size;
    const where: any = { deleted: false, active: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const [items, total] = await Promise.all([
      this.prisma.shops.findMany({ where, skip, take: size, orderBy: { created_at: 'desc' }, include: { users: { select: { id: true, first_name: true, last_name: true } } } }),
      this.prisma.shops.count({ where }),
    ]);
    const totalPages = Math.ceil(total / size);
    return { content: items, page, size, totalElements: total, totalPages, first: page === 0, last: page >= totalPages - 1 };
  }

  async getBySlug(slug: string) {
    const shop = await this.prisma.shops.findUnique({ where: { slug }, include: { users: { select: { id: true, first_name: true, last_name: true, avatar_url: true } } } });
    if (!shop || shop.deleted) throw new NotFoundException('Shop not found');
    return shop;
  }

  async getById(id: string) {
    const shop = await this.prisma.shops.findUnique({ where: { id } });
    if (!shop || shop.deleted) throw new NotFoundException('Shop not found');
    return shop;
  }

  async getMyShop(userId: string) {
    return this.prisma.shops.findFirst({ where: { user_id: userId, deleted: false } });
  }

  async getTopShops(limit = 10) {
    return this.prisma.shops.findMany({
      where: { deleted: false, active: true },
      orderBy: [{ rating: 'desc' }, { follower_count: 'desc' }],
      take: limit,
      include: { users: { select: { id: true, first_name: true, last_name: true } } },
    });
  }

  async create(userId: string, dto: any) {
    return this.prisma.shops.create({
      data: {
        name: dto.name,
        slug: generateSlug(dto.name),
        description: dto.description,
        logo_url: dto.logoUrl,
        banner_url: dto.bannerUrl,
        user_id: userId,
      },
    });
  }

  async update(userId: string, id: string, dto: any) {
    const shop = await this.getById(id);
    if (shop.user_id !== userId) throw new ForbiddenException();
    const data: any = {};
    if (dto.name) { data.name = dto.name; data.slug = generateSlug(dto.name); }
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.logoUrl !== undefined) data.logo_url = dto.logoUrl;
    if (dto.bannerUrl !== undefined) data.banner_url = dto.bannerUrl;
    return this.prisma.shops.update({ where: { id }, data });
  }

  async follow(userId: string, shopId: string) {
    await this.getById(shopId);
    await this.prisma.shop_followers.upsert({
      where: { user_id_shop_id: { user_id: userId, shop_id: shopId } },
      create: { shop_id: shopId, user_id: userId },
      update: {},
    });
    await this.prisma.shops.update({ where: { id: shopId }, data: { follower_count: { increment: 1 } } });
    return { message: 'Followed' };
  }

  async unfollow(userId: string, shopId: string) {
    await this.prisma.shop_followers.delete({
      where: { user_id_shop_id: { user_id: userId, shop_id: shopId } },
    });
    await this.prisma.shops.update({ where: { id: shopId }, data: { follower_count: { decrement: 1 } } });
    return { message: 'Unfollowed' };
  }

  async delete(userId: string, id: string) {
    const shop = await this.getById(id);
    if (shop.user_id !== userId) throw new ForbiddenException();
    return this.prisma.shops.update({ where: { id }, data: { deleted: true } });
  }
}
