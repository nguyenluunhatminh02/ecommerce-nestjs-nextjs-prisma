import { Controller, Get, Post, Patch, Body, Param, Query, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CurrentUser } from '../common/decorators/auth/current-user.decorator';
import { CreateOrderDto, UpdateOrderStatusDto, OrderFilterDto } from './dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user orders (alias)' })
  getMyOrdersAlias(@CurrentUser('id') userId: string, @Query() filter: OrderFilterDto) {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.max(1, filter.limit ?? filter.size ?? 10);
    return this.orderService.getMyOrders(userId, page, limit);
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'Get all orders (admin)' })
  getAllOrders(@Query() filter: OrderFilterDto) {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.max(1, filter.limit ?? filter.size ?? 20);
    return this.orderService.getAllOrders({ page, limit, status: filter.status });
  }

  @Get('shop/:shopId')
  @ApiOperation({ summary: 'Get orders for a specific shop' })
  getShopOrders(@Param('shopId') shopId: string, @Query() filter: OrderFilterDto) {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.max(1, filter.limit ?? filter.size ?? 20);
    return this.orderService.getShopOrders(shopId, { page, limit, status: filter.status });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto.status, dto.note);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user orders' })
  getMyOrders(@CurrentUser('id') userId: string, @Query() filter: OrderFilterDto) {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.max(1, filter.limit ?? filter.size ?? 10);
    return this.orderService.getMyOrders(userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  getById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.orderService.getById(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create order from cart' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.orderService.create(userId, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.orderService.cancelOrder(userId, id);
  }
}
