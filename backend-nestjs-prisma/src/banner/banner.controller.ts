import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { BannerService } from './banner.service';
import { Public } from '../common/decorators/auth/public.decorator';

@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Public()
  @Get()
  getActive() {
    return this.bannerService.getActive();
  }

  @Public()
  @Get('active')
  getActiveExplicit() {
    return this.bannerService.getActive();
  }

  @Get('all')
  getAll() {
    return this.bannerService.getAll();
  }

  @Post()
  create(@Body() dto: any) {
    return this.bannerService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.bannerService.update(+id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.bannerService.delete(+id);
  }
}
