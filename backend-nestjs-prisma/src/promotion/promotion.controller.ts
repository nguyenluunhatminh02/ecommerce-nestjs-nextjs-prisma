import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { Public } from '../common/decorators/auth/public.decorator';

@Controller('promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Public()
  @Get()
  getActive() {
    return this.promotionService.getActive();
  }

  @Get('all')
  getAll() {
    return this.promotionService.getAll();
  }

  @Public()
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.promotionService.getById(+id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.promotionService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.promotionService.update(+id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.promotionService.delete(+id);
  }
}
