import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug } from '../common/utils/slug.util';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  private async withProductCount(cat: any) {
    const directCount = cat._count?.products ?? 0;
    // For parent categories, also count products in child categories
    let childCount = 0;
    if (cat.children && cat.children.length > 0) {
      const childIds = cat.children.map((c: any) => c.id);
      childCount = await this.prisma.products.count({ where: { category_id: { in: childIds }, deleted: false, status: 'ACTIVE' } });
    }
    return { ...cat, productCount: directCount + childCount };
  }

  async getAll() {
    const cats = await this.prisma.categories.findMany({
      where: { deleted: false, active: true },
      include: { children: { where: { deleted: false, active: true }, include: { _count: { select: { products: true } } } }, _count: { select: { products: true } } },
      orderBy: { sort_order: 'asc' },
    });
    return Promise.all(cats.map(c => this.withProductCount(c)));
  }

  async getRootCategories() {
    const cats = await this.prisma.categories.findMany({
      where: { parent_id: null, deleted: false, active: true },
      include: { children: { where: { deleted: false, active: true }, include: { _count: { select: { products: true } } } }, _count: { select: { products: true } } },
      orderBy: { sort_order: 'asc' },
    });
    return Promise.all(cats.map(c => this.withProductCount(c)));
  }

  async getFeatured() {
    const cats = await this.prisma.categories.findMany({
      where: { featured: true, deleted: false, active: true },
      include: { children: { where: { deleted: false, active: true }, include: { _count: { select: { products: true } } } }, _count: { select: { products: true } } },
      orderBy: { sort_order: 'asc' },
    });
    return Promise.all(cats.map(c => this.withProductCount(c)));
  }

  async getBySlug(slug: string) {
    const cat = await this.prisma.categories.findUnique({
      where: { slug },
      include: {
        children: { where: { deleted: false, active: true }, include: { _count: { select: { products: true } } } },
        parent: true,
        _count: { select: { products: true } },
      },
    });
    if (!cat || cat.deleted) throw new NotFoundException('Category not found');
    return this.withProductCount(cat);
  }

  async getById(id: string) {
    const cat = await this.prisma.categories.findUnique({
      where: { id },
      include: { children: { where: { deleted: false }, include: { _count: { select: { products: true } } } }, parent: true, _count: { select: { products: true } } },
    });
    if (!cat || cat.deleted) throw new NotFoundException('Category not found');
    return this.withProductCount(cat);
  }

  async create(dto: any) {
    const slug = generateSlug(dto.name);
    return this.prisma.categories.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        image_url: dto.imageUrl,
        icon: dto.icon,
        parent_id: dto.parentId,
        sort_order: dto.sortOrder || 0,
        featured: dto.featured || false,
      },
    });
  }

  async update(id: string, dto: any) {
    await this.getById(id);
    const data: any = {};
    if (dto.name) { data.name = dto.name; data.slug = generateSlug(dto.name); }
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.imageUrl !== undefined) data.image_url = dto.imageUrl;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.parentId !== undefined) data.parent_id = dto.parentId;
    if (dto.sortOrder !== undefined) data.sort_order = dto.sortOrder;
    if (dto.featured !== undefined) data.featured = dto.featured;
    if (dto.active !== undefined) data.active = dto.active;
    return this.prisma.categories.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.getById(id);
    return this.prisma.categories.update({ where: { id }, data: { deleted: true } });
  }

  async toggleStatus(id: string) {
    const cat = await this.getById(id);
    return this.prisma.categories.update({ where: { id }, data: { active: !cat.active } });
  }
}
