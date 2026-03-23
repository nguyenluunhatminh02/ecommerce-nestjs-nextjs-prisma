import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { Public } from '../common/decorators/auth/public.decorator';

@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get()
  getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.couponService.getAll(Math.max(1, +(page || 1)), Math.max(1, +(limit || 20)));
  }

  @Public()
  @Get('active')
  getActive(@Query('page') page?: string, @Query('size') size?: string) {
    return this.couponService.getActive(+(page || 0), +(size || 10));
  }

  @Public()
  @Post('validate')
  validate(@Body() dto: { code: string; subtotal: number }, @Query('code') qCode?: string, @Query('orderTotal') qTotal?: string) {
    const code = dto?.code || qCode || '';
    const subtotal = dto?.subtotal || +(qTotal || 0);
    return this.couponService.validate(code, subtotal);
  }

  @Post()
  create(@Body() dto: any) {
    return this.couponService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.couponService.update(+id, dto);
  }

  @Put(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.couponService.toggle(+id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.couponService.delete(+id);
  }
}
