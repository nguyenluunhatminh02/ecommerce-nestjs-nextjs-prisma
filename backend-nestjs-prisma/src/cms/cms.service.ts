import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug } from '../common/utils/slug.util';

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  async getPages() {
    return this.prisma.cms_pages.findMany({ where: { published: true }, orderBy: { sort_order: 'asc' } });
  }

  async getBySlug(slug: string) {
    const page = await this.prisma.cms_pages.findUnique({ where: { slug } });
    if (!page || !page.published) throw new NotFoundException();
    return page;
  }

  async create(dto: any) {
    return this.prisma.cms_pages.create({
      data: { title: dto.title, slug: generateSlug(dto.title), content: dto.content, published: dto.published ?? true, meta_title: dto.metaTitle, meta_description: dto.metaDescription, sort_order: dto.sortOrder || 0 },
    });
  }

  async update(id: number, dto: any) {
    const data: any = {};
    if (dto.title) { data.title = dto.title; data.slug = generateSlug(dto.title); }
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.published !== undefined) data.published = dto.published;
    if (dto.metaTitle !== undefined) data.meta_title = dto.metaTitle;
    if (dto.metaDescription !== undefined) data.meta_description = dto.metaDescription;
    return this.prisma.cms_pages.update({ where: { id }, data });
  }

  async delete(id: number) {
    return this.prisma.cms_pages.delete({ where: { id } });
  }
}
