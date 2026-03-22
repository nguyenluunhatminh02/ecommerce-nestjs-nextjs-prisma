import { Controller, Get, Param, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiResponse } from '../common/utils/api-response.util';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('seller/:shopId')
  getSellerDashboard(@Param('shopId') shopId: string) {
    return this.dashboardService.getSellerDashboard(shopId);
  }

  @Get('admin/revenue')
  getRevenueChart(@Query('days') days?: string) {
    return this.dashboardService.getRevenueChart(+(days || 30));
  }

  @Get('admin/orders-chart')
  getOrdersChart(@Query('days') days?: string) {
    return this.dashboardService.getOrdersChart(+(days || 30));
  }
}

// ─── Admin Dashboard (frontend compatibility) ─────────────────────
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  async getMetrics(@Query('period') period?: string) {
    const data = await this.dashboardService.getAdminDashboard();
    return ApiResponse.success({
      totalRevenue: data.totalRevenue,
      totalOrders: data.totalOrders,
      totalProducts: data.totalProducts,
      totalUsers: data.totalUsers,
      totalShops: data.totalShops,
      todayOrders: data.todayOrders,
      monthOrders: data.monthOrders,
      pendingOrders: data.pendingOrders,
      revenueGrowth: 0,
      orderGrowth: 0,
      userGrowth: 0,
    }, 'Dashboard metrics');
  }

  @Get('revenue-chart')
  async getRevenueChart(@Query('period') period?: string, @Query('granularity') granularity?: string) {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
    const data = await this.dashboardService.getRevenueChart(days);
    return ApiResponse.success({ labels: data.map((d: any) => d.date), revenue: data.map((d: any) => d.revenue), orders: data.map((d: any) => d.orders) }, 'Revenue chart');
  }

  @Get('top-products')
  async getTopProducts(@Query('limit') limit?: string) {
    return ApiResponse.success([], 'Top products');
  }

  @Get('top-categories')
  async getTopCategories(@Query('limit') limit?: string) {
    return ApiResponse.success([], 'Top categories');
  }

  @Get('sales-funnel')
  async getSalesFunnel(@Query('period') period?: string) {
    return ApiResponse.success({ visitors: 0, addToCart: 0, checkout: 0, purchase: 0 }, 'Sales funnel');
  }

  @Get('customer-segments')
  async getCustomerSegments() {
    return ApiResponse.success([], 'Customer segments');
  }

  @Get('traffic-sources')
  async getTrafficSources(@Query('period') period?: string) {
    return ApiResponse.success([], 'Traffic sources');
  }

  @Get('activity')
  async getRecentActivity(@Query('limit') limit?: string) {
    return ApiResponse.success([], 'Recent activity');
  }

  @Get('realtime')
  async getRealtimeStats() {
    const data = await this.dashboardService.getAdminDashboard();
    return ApiResponse.success({ activeUsers: 0, ordersToday: data.todayOrders, revenueToday: 0 }, 'Realtime stats');
  }
}
