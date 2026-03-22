import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug } from '../common/utils/slug.util';

@Injectable()
export class CollectionService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.collections.findMany({
      where: { active: true },
      orderBy: { sort_order: 'asc' },
    });
  }

  async getBySlug(slug: string) {
    const col = await this.prisma.collections.findUnique({
      where: { slug },
      include: { collection_products: { include: { products: { include: { images: { take: 1 }, brands: true } } } } },
    });
    if (!col) throw new NotFoundException();
    return col;
  }

  async create(dto: any) {
    const col = await this.prisma.collections.create({
      data: {
        name: dto.name, slug: generateSlug(dto.name), description: dto.description,
        image_url: dto.imageUrl, sort_order: dto.sortOrder || 0,
      },
    });
    if (dto.productIds?.length) {
      await this.prisma.collection_products.createMany({
        data: dto.productIds.map((pid: string, i: number) => ({
          collection_id: col.id, product_id: pid,
        })),
      });
    }
    return col;
  }

  async update(id: number, dto: any) {
    const data: any = {};
    if (dto.name) { data.name = dto.name; data.slug = generateSlug(dto.name); }
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.imageUrl !== undefined) data.image_url = dto.imageUrl;
    if (dto.active !== undefined) data.active = dto.active;
    return this.prisma.collections.update({ where: { id }, data });
  }

  async addProducts(id: number, productIds: string[]) {
    const existing = await this.prisma.collection_products.findMany({
      where: { collection_id: id },
      select: { product_id: true },
    });
    const existingIds = new Set(existing.map((e) => e.product_id));
    const newIds = productIds.filter((pid) => !existingIds.has(pid));
    if (newIds.length) {
      await this.prisma.collection_products.createMany({
        data: newIds.map((pid) => ({ collection_id: id, product_id: pid })),
      });
    }
    return { added: newIds.length };
  }

  async removeProduct(id: number, productId: string) {
    await this.prisma.collection_products.delete({ where: { collection_id_product_id: { collection_id: id, product_id: productId } } });
    return { message: 'Product removed from collection' };
  }

  async delete(id: number) {
    await this.prisma.collection_products.deleteMany({ where: { collection_id: id } });
    return this.prisma.collections.delete({ where: { id } });
  }
}
