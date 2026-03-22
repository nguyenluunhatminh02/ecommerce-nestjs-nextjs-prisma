import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { BrandService } from './brand.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Public()
  @Get()
  getAll(@Query('search') search?: string) {
    return this.brandService.getAll(search);
  }

  @Public()
  @Get('search')
  search(@Query('keyword') keyword: string, @Query('page') page?: string, @Query('size') size?: string) {
    return this.brandService.search(keyword, +(page || 0), +(size || 10));
  }

  @Public()
  @Get(':id')
  getById(@Param('id') id: string) {
    // Try UUID first, then slug
    return id.includes('-') ? this.brandService.getById(id) : this.brandService.getBySlug(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.brandService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.brandService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.brandService.delete(id);
  }
}
