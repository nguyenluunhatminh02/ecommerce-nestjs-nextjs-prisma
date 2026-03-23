import { Controller, Get, Post, Put, Delete, Param, Body, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { Public } from '../common/decorators/auth/public.decorator';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Public()
  @Get()
  getAll() {
    return this.categoryService.getAll();
  }

  @Public()
  @Get('root')
  getRootCategories() {
    return this.categoryService.getRootCategories();
  }

  @Public()
  @Get('featured')
  getFeatured() {
    return this.categoryService.getFeatured();
  }

  @Public()
  @Get('slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.categoryService.getBySlug(slug);
  }

  @Public()
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.categoryService.getById(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.categoryService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }

  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.categoryService.toggleStatus(id);
  }
}
