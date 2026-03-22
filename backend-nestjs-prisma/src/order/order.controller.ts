import { Controller, Get, Post, Patch, Body, Param, Query, RawBodyRequest, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('my-orders')
  getMyOrdersAlias(@CurrentUser('id') userId: string, @Query('page') page?: string, @Query('limit') limit?: string, @Query('size') size?: string) {
    const normalizedPage = Math.max(1, +(page || 1));
    const normalizedLimit = Math.max(1, +(limit || size || 10));
    return this.orderService.getMyOrders(userId, normalizedPage, normalizedLimit);
  }

  @Get('admin/all')
  getAllOrders(@Query('page') page?: string, @Query('limit') limit?: string, @Query('size') size?: string, @Query('status') status?: string) {
    const normalizedPage = Math.max(1, +(page || 1));
    const normalizedLimit = Math.max(1, +(limit || size || 20));
    return this.orderService.getAllOrders({ page: normalizedPage, limit: normalizedLimit, status });
  }

  @Get('shop/:shopId')
  getShopOrders(@Param('shopId') shopId: string, @Query('page') page?: string, @Query('limit') limit?: string, @Query('size') size?: string, @Query('status') status?: string) {
    const normalizedPage = Math.max(1, +(page || 1));
    const normalizedLimit = Math.max(1, +(limit || size || 20));
    return this.orderService.getShopOrders(shopId, { page: normalizedPage, limit: normalizedLimit, status });
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string; note?: string }) {
    return this.orderService.updateStatus(id, body.status, body.note);
  }

  @Get()
  getMyOrders(@CurrentUser('id') userId: string, @Query('page') page?: string, @Query('limit') limit?: string, @Query('size') size?: string) {
    const normalizedPage = Math.max(1, +(page || 1));
    const normalizedLimit = Math.max(1, +(limit || size || 10));
    return this.orderService.getMyOrders(userId, normalizedPage, normalizedLimit);
  }

  @Get(':id')
  getById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.orderService.getById(userId, id);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.orderService.create(userId, dto);
  }

  @Patch(':id/cancel')
  cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.orderService.cancelOrder(userId, id);
  }
}
