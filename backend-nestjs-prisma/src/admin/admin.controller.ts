import { Controller, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiResponse } from '../common/utils/api-response.util';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getUsers(@Query() query: any) {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }

  @Patch('users/:id/toggle-status')
  toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }

  @Get('orders')
  getOrders(@Query() query: any) {
    return this.adminService.getOrders(query);
  }

  @Get('orders/stats')
  async getOrderStats() {
    const data = await this.adminService.getOrderStats();
    return ApiResponse.success(data, 'Order stats');
  }

  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() dto: { status: string; note?: string }) {
    return this.adminService.updateOrderStatus(id, dto.status, dto.note);
  }

  @Get('returns')
  getReturns(@Query() query: any) {
    return this.adminService.getReturns(query);
  }

  @Patch('returns/:id')
  handleReturn(@Param('id') id: string, @Body() dto: { status: string; refundAmount?: number }) {
    return this.adminService.handleReturn(+id, dto);
  }

  @Get('tickets')
  getTickets(@Query() query: any) {
    return this.adminService.getTickets(query);
  }

  @Get('products')
  async getProducts(@Query() query: any) {
    const data = await this.adminService.getProducts(query);
    return ApiResponse.success(data, 'Admin products');
  }

  @Get('categories')
  async getCategories(@Query() query: any) {
    const data = await this.adminService.getCategories(query);
    return ApiResponse.success(data, 'Admin categories');
  }
}
