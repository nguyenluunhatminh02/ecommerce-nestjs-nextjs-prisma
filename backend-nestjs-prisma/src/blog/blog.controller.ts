import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { BlogService } from './blog.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Public()
  @Get('categories')
  getCategories() {
    return this.blogService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: any) {
    return this.blogService.createCategory(dto);
  }

  @Public()
  @Get('posts')
  getPosts(@Query() query: any) {
    return this.blogService.getPosts(query);
  }

  @Public()
  @Get('posts/slug/:slug')
  getPostBySlugPath(@Param('slug') slug: string) {
    return this.blogService.getPostBySlug(slug);
  }

  @Public()
  @Get('posts/featured')
  getFeaturedPosts(@Query('size') size?: string) {
    return this.blogService.getPosts({ featured: true, limit: +(size || 5) });
  }

  @Public()
  @Get('posts/search')
  searchPosts(@Query('keyword') keyword: string, @Query('page') page?: string, @Query('size') size?: string) {
    return this.blogService.getPosts({ search: keyword, page: +(page || 1), limit: +(size || 10) });
  }

  @Public()
  @Get('posts/category/:categoryId')
  getPostsByCategory(@Param('categoryId') categoryId: string, @Query('page') page?: string, @Query('size') size?: string) {
    return this.blogService.getPosts({ categoryId, page: +(page || 1), limit: +(size || 10) });
  }

  @Public()
  @Get('posts/:slug')
  getPostBySlug(@Param('slug') slug: string) {
    return this.blogService.getPostBySlug(slug);
  }

  @Post('posts')
  createPost(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.blogService.createPost(userId, dto);
  }

  @Put('posts/:id')
  updatePost(@Param('id') id: string, @Body() dto: any) {
    return this.blogService.updatePost(id, dto);
  }

  @Delete('posts/:id')
  deletePost(@Param('id') id: string) {
    return this.blogService.deletePost(id);
  }

  @Post('posts/:id/comments')
  addComment(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('content') content: string) {
    return this.blogService.addComment(userId, id, content);
  }

  @Delete('comments/:id')
  deleteComment(@Param('id') id: string) {
    return this.blogService.deleteComment(+id);
  }
}
