import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Public()
  @Get('methods')
  getMethods() {
    return this.shippingService.getMethods();
  }

  @Public()
  @Get('methods/active')
  getActiveMethods() {
    return this.shippingService.getMethods();
  }

  @Public()
  @Get('methods/calculate')
  calculateCost(@Query('methodId') methodId: string, @Query('orderTotal') orderTotal: string, @Query('weight') weight?: string) {
    return this.shippingService.calculateCost(+methodId, +orderTotal, weight ? +weight : undefined);
  }

  @Get('methods/all')
  getAllMethods() {
    return this.shippingService.getAllMethods();
  }

  @Post('methods')
  createMethod(@Body() dto: any) {
    return this.shippingService.createMethod(dto);
  }

  @Put('methods/:id')
  updateMethod(@Param('id') id: string, @Body() dto: any) {
    return this.shippingService.updateMethod(+id, dto);
  }

  @Delete('methods/:id')
  deleteMethod(@Param('id') id: string) {
    return this.shippingService.deleteMethod(+id);
  }

  @Get('shipments/order/:orderId')
  getByOrder(@Param('orderId') orderId: string) {
    return this.shippingService.getByOrder(orderId);
  }

  @Get('shipments/:id')
  getShipment(@Param('id') id: string) {
    return this.shippingService.getShipment(id);
  }

  @Post('shipments')
  createShipment(@Body() dto: any) {
    return this.shippingService.createShipment(dto);
  }

  @Patch('shipments/:id')
  updateShipment(@Param('id') id: string, @Body() dto: any) {
    return this.shippingService.updateShipment(id, dto);
  }
}
