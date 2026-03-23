import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { Public } from '../common/decorators/auth/public.decorator';

@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Public()
  @Get()
  getAll() {
    return this.collectionService.getAll();
  }

  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.collectionService.getBySlug(slug);
  }

  @Post()
  create(@Body() dto: any) {
    return this.collectionService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.collectionService.update(+id, dto);
  }

  @Post(':id/products')
  addProducts(@Param('id') id: string, @Body('productIds') productIds: string[]) {
    return this.collectionService.addProducts(+id, productIds);
  }

  @Delete(':id/products/:productId')
  removeProduct(@Param('id') id: string, @Param('productId') productId: string) {
    return this.collectionService.removeProduct(+id, productId);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.collectionService.delete(+id);
  }
}
