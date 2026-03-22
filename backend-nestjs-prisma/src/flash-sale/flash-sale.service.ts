import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FlashSaleService {
  constructor(private prisma: PrismaService) {}

  async getActive() {
    const now = new Date();
    return this.prisma.flash_sales.findMany({
      where: { active: true, start_time: { lte: now }, end_time: { gt: now } },
      include: { items: { include: { products: { include: { images: { take: 1 } } } } } },
    });
  }

  async getUpcoming() {
    const now = new Date();
    return this.prisma.flash_sales.findMany({
      where: { active: true, start_time: { gt: now } },
      include: { items: { include: { products: { include: { images: { take: 1 } } } } } },
      orderBy: { start_time: 'asc' },
    });
  }

  async getById(id: number) {
    const sale = await this.prisma.flash_sales.findUnique({
      where: { id },
      include: { items: { include: { products: { include: { images: { take: 1 } } } } } },
    });
    if (!sale) throw new NotFoundException();
    return sale;
  }

  async create(dto: any) {
    return this.prisma.flash_sales.create({
      data: {
        name: dto.name, slug: dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-'),
        description: dto.description,
        start_time: new Date(dto.startsAt), end_time: new Date(dto.endsAt),
        items: {
          create: dto.items?.map((item: any) => ({
            product_id: item.productId, sale_price: item.flashPrice,
            quantity_limit: item.quantity || 0,
          })) || [],
        },
      },
      include: { items: true },
    });
  }

  async update(id: number, dto: any) {
    return this.prisma.flash_sales.update({ where: { id }, data: dto });
  }

  async delete(id: number) {
    await this.prisma.flash_sale_items.deleteMany({ where: { flash_sale_id: id } });
    return this.prisma.flash_sales.delete({ where: { id } });
  }
}
