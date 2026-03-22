import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug } from '../common/utils/slug.util';

@Injectable()
export class BrandService {
  constructor(private prisma: PrismaService) {}

  async getAll(search?: string) {
    const where: any = { deleted: false, active: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    return this.prisma.brands.findMany({ where, orderBy: { name: 'asc' } });
  }

  async search(keyword: string, page = 0, size = 10) {
    const where: any = { deleted: false, active: true };
    if (keyword) where.name = { contains: keyword, mode: 'insensitive' };
    const skip = page * size;
    const [items, total] = await Promise.all([
      this.prisma.brands.findMany({ where, skip, take: size, orderBy: { name: 'asc' } }),
      this.prisma.brands.count({ where }),
    ]);
    const totalPages = Math.ceil(total / size);
    return { content: items, page, size, totalElements: total, totalPages, first: page === 0, last: page >= totalPages - 1 };
  }

  async getById(id: string) {
    const brand = await this.prisma.brands.findUnique({ where: { id } });
    if (!brand || brand.deleted) throw new NotFoundException('Brand not found');
    return brand;
  }

  async getBySlug(slug: string) {
    const brand = await this.prisma.brands.findUnique({ where: { slug } });
    if (!brand || brand.deleted) throw new NotFoundException('Brand not found');
    return brand;
  }

  async create(dto: any) {
    return this.prisma.brands.create({
      data: {
        name: dto.name,
        slug: generateSlug(dto.name),
        description: dto.description,
        logo_url: dto.logoUrl,
        website: dto.website,
      },
    });
  }

  async update(id: string, dto: any) {
    await this.getById(id);
    const data: any = {};
    if (dto.name) { data.name = dto.name; data.slug = generateSlug(dto.name); }
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.logoUrl !== undefined) data.logo_url = dto.logoUrl;
    if (dto.website !== undefined) data.website = dto.website;
    if (dto.active !== undefined) data.active = dto.active;
    return this.prisma.brands.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.getById(id);
    return this.prisma.brands.update({ where: { id }, data: { deleted: true } });
  }
}
