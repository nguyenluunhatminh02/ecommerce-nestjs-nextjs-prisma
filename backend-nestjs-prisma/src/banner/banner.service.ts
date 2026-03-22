import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BannerService {
  constructor(private prisma: PrismaService) {}

  async getActive() {
    return this.prisma.banners.findMany({
      where: { active: true, deleted: false, OR: [{ start_date: null }, { start_date: { lte: new Date() } }], AND: [{ OR: [{ end_date: null }, { end_date: { gte: new Date() } }] }] },
      orderBy: { sort_order: 'asc' },
    });
  }

  async getAll() {
    return this.prisma.banners.findMany({ where: { deleted: false }, orderBy: { sort_order: 'asc' } });
  }

  async create(dto: any) {
    return this.prisma.banners.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        image_url: dto.imageUrl,
        link: dto.linkUrl,
        position: dto.position || 'HOME_HERO',
        sort_order: dto.sortOrder || 0,
        start_date: dto.startsAt ? new Date(dto.startsAt) : null,
        end_date: dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });
  }

  async update(id: number, dto: any) {
    return this.prisma.banners.update({ where: { id }, data: dto });
  }

  async delete(id: number) {
    return this.prisma.banners.update({ where: { id }, data: { deleted: true } });
  }
}
