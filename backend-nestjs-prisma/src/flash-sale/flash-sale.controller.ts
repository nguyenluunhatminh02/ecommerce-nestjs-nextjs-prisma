import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { FlashSaleService } from './flash-sale.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('flash-sales')
export class FlashSaleController {
  constructor(private readonly flashSaleService: FlashSaleService) {}

  @Public()
  @Get()
  getAll() {
    return this.flashSaleService.getActive();
  }

  @Public()
  @Get('active')
  getActive() {
    return this.flashSaleService.getActive();
  }

  @Public()
  @Get('upcoming')
  getUpcoming() {
    return this.flashSaleService.getUpcoming();
  }

  @Public()
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.flashSaleService.getById(+id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.flashSaleService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.flashSaleService.update(+id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.flashSaleService.delete(+id);
  }
}
