import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug } from '../common/utils/slug.util';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  // Categories
  async getCategories() {
    return this.prisma.blog_categories.findMany({ orderBy: { name: 'asc' } });
  }

  async createCategory(dto: any) {
    return this.prisma.blog_categories.create({ data: { name: dto.name, slug: generateSlug(dto.name), description: dto.description } });
  }

  // Posts
  private mapPost(post: any) {
    const { users, blog_categories, ...rest } = post;
    return {
      ...rest,
      authorName: users ? `${users.first_name || ''} ${users.last_name || ''}`.trim() : '',
      category: blog_categories || null,
    };
  }

  async getPosts(query: any) {
    const { categoryId, search, page = 0, size, limit } = query;
    const safeSize = Math.max(1, +(size || limit) || 10);
    const safePage = Math.max(0, +(page) || 0);
    const skip = safePage * safeSize;
    const where: any = { published: true };
    if (categoryId) where.category_id = +categoryId;
    if (search) where.title = { contains: search, mode: 'insensitive' };
    const [items, total] = await Promise.all([
      this.prisma.blog_posts.findMany({
        where, skip, take: safeSize, orderBy: { published_at: 'desc' },
        include: { users: { select: { id: true, first_name: true, last_name: true, avatar_url: true } }, blog_categories: true },
      }),
      this.prisma.blog_posts.count({ where }),
    ]);
    const totalPages = Math.ceil(total / safeSize);
    return { content: items.map(p => this.mapPost(p)), page: safePage, size: safeSize, totalElements: total, totalPages, first: safePage === 0, last: safePage >= totalPages - 1 };
  }

  async getPostBySlug(slug: string) {
    const post = await this.prisma.blog_posts.findUnique({
      where: { slug },
      include: { users: { select: { id: true, first_name: true, last_name: true, avatar_url: true } }, blog_categories: true, comments: { where: { approved: true }, include: { users: { select: { id: true, first_name: true, last_name: true, avatar_url: true } } }, orderBy: { created_at: 'desc' } } },
    });
    if (!post) throw new NotFoundException();
    await this.prisma.blog_posts.update({ where: { id: post.id }, data: { view_count: { increment: 1 } } });
    return this.mapPost(post);
  }

  async createPost(userId: string, dto: any) {
    return this.prisma.blog_posts.create({
      data: {
        title: dto.title, slug: generateSlug(dto.title), content: dto.content, excerpt: dto.excerpt,
        featured_image: dto.featuredImage, category_id: dto.categoryId ? +dto.categoryId : null, author_id: userId,
        published: dto.published ?? false, published_at: dto.published ? new Date() : null,
        meta_title: dto.metaTitle, meta_description: dto.metaDescription,
      },
    });
  }

  async updatePost(id: string, dto: any) {
    const data: any = {};
    if (dto.title) { data.title = dto.title; data.slug = generateSlug(dto.title); }
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.excerpt !== undefined) data.excerpt = dto.excerpt;
    if (dto.featuredImage !== undefined) data.featured_image = dto.featuredImage;
    if (dto.categoryId !== undefined) data.category_id = dto.categoryId ? +dto.categoryId : null;
    if (dto.published !== undefined) {
      data.published = dto.published;
      if (dto.published) data.published_at = new Date();
    }
    return this.prisma.blog_posts.update({ where: { id }, data });
  }

  async deletePost(id: string) {
    return this.prisma.blog_posts.delete({ where: { id } });
  }

  async addComment(userId: string, postId: string, content: string) {
    return this.prisma.blog_comments.create({ data: { post_id: postId, user_id: userId, content, approved: true } });
  }

  async deleteComment(id: number) {
    return this.prisma.blog_comments.delete({ where: { id } });
  }
}
