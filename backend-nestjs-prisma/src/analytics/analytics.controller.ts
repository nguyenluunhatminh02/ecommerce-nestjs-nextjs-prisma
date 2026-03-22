import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Public } from '../auth/decorators/public.decorator';
import { ApiResponse } from '../common/utils/api-response.util';

function periodToDateRange(period?: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  let from: Date;
  switch (period) {
    case 'today': from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
    case '7d': from = new Date(now.getTime() - 7 * 86400000); break;
    case '90d': from = new Date(now.getTime() - 90 * 86400000); break;
    case '1y': from = new Date(now.getTime() - 365 * 86400000); break;
    case 'all': from = new Date(2000, 0, 1); break;
    default: from = new Date(now.getTime() - 30 * 86400000); break;
  }
  return { from: from.toISOString(), to };
}

// ─── Public Analytics ─────────────────────────────────────────────
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('events')
  async trackEvent(@Body() dto: any) {
    const result = await this.analyticsService.trackEvent(dto);
    return ApiResponse.success(result, 'Event tracked');
  }

  @Get('dashboard')
  async getDashboard() {
    return ApiResponse.success(await this.analyticsService.getDashboardSummary(), 'Dashboard data');
  }

  @Get('orders')
  async getOrderStats(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return ApiResponse.success(await this.analyticsService.getOrderStats(startDate, endDate), 'Order stats');
  }

  @Get('users')
  async getUserStats() {
    return ApiResponse.success(await this.analyticsService.getUserStats(), 'User stats');
  }

  @Get('audit-logs')
  async getAuditLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return ApiResponse.success(await this.analyticsService.getAuditLogs(+(page || 1), +(limit || 50)), 'Audit logs');
  }
}

// ─── Admin Analytics (comprehensive) ─────────────────────────────
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboard() {
    const summary = await this.analyticsService.getDashboardSummary();
    const funnel = await this.analyticsService.getConversionFunnel();
    return ApiResponse.success({
      ...summary,
      visitors: funnel.visitorsCount,
      uniqueVisitors: Math.floor(funnel.visitorsCount * 0.7),
      conversionRate: funnel.overallConversionRate,
    }, 'Admin dashboard');
  }

  @Get('revenue')
  async getRevenue(@Query('period') period?: string, @Query('from') from?: string, @Query('to') to?: string) {
    const range = from && to ? { from, to } : periodToDateRange(period);
    const summary = await this.analyticsService.getDashboardSummary();
    return ApiResponse.success({
      totalRevenue: summary.allTime.totalRevenue,
      dailyRevenue: summary.today.revenue,
      monthlyRevenue: summary.thisMonth.revenue,
      growth: summary.growth.revenueGrowthPercent,
    }, 'Revenue analytics');
  }

  @Get('sales')
  async getSales(@Query('from') from?: string, @Query('to') to?: string, @Query('groupBy') groupBy?: string) {
    const data = await this.analyticsService.getSalesAnalytics(from, to, (groupBy as any) || 'day');
    return ApiResponse.success(data, 'Sales analytics');
  }

  @Get('products')
  async getProductsAnalytics(@Query('from') from?: string, @Query('to') to?: string, @Query('limit') limit?: string) {
    const data = await this.analyticsService.getProductAnalytics(from, to, +(limit || 20));
    return ApiResponse.success(data, 'Product analytics');
  }

  @Get('products/top-selling')
  async getTopSelling(@Query('from') from?: string, @Query('to') to?: string, @Query('limit') limit?: string) {
    const data = await this.analyticsService.getTopProducts(+(limit || 10), from, to);
    return ApiResponse.success(data, 'Top selling products');
  }

  @Get('products/top-viewed')
  async getTopViewed(@Query('from') from?: string, @Query('to') to?: string, @Query('limit') limit?: string) {
    const products = await this.analyticsService.getTopProducts(+(limit || 10), from, to);
    return ApiResponse.success(products.sort((a, b) => b.viewCount - a.viewCount), 'Top viewed products');
  }

  @Get('categories')
  async getCategoryAnalytics(@Query('from') from?: string, @Query('to') to?: string) {
    return ApiResponse.success(await this.analyticsService.getRevenueByCategory(from, to), 'Category analytics');
  }

  @Get('users')
  async getUsersAnalytics(@Query('from') from?: string, @Query('to') to?: string, @Query('groupBy') groupBy?: string) {
    const data = await this.analyticsService.getUserGrowthAnalytics(from, to, (groupBy as any) || 'day');
    return ApiResponse.success(data, 'User growth analytics');
  }

  @Get('orders')
  async getOrdersAnalytics(@Query('from') from?: string, @Query('to') to?: string) {
    const data = await this.analyticsService.getOrderStats(from, to);
    return ApiResponse.success(data, 'Order analytics');
  }

  @Get('conversion')
  async getConversionFunnel(@Query('from') from?: string, @Query('to') to?: string) {
    return ApiResponse.success(await this.analyticsService.getConversionFunnel(from, to), 'Conversion funnel');
  }

  @Get('orders/status')
  async getOrderStatusBreakdown(@Query('from') from?: string, @Query('to') to?: string) {
    return ApiResponse.success(await this.analyticsService.getOrderStatusBreakdown(from, to), 'Order status breakdown');
  }

  @Get('shops')
  async getShopAnalytics(@Query('from') from?: string, @Query('to') to?: string, @Query('limit') limit?: string) {
    return ApiResponse.success(await this.analyticsService.getTopSellers(+(limit || 10), from, to), 'Shop analytics');
  }

  @Get('shops/:shopId')
  async getSellerPerformance(@Param('shopId') shopId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return ApiResponse.success(await this.analyticsService.getSellerPerformance(shopId, from, to), 'Seller performance');
  }

  @Get('inventory')
  async getInventoryAnalytics() {
    return ApiResponse.success(await this.analyticsService.getInventoryAnalytics(), 'Inventory analytics');
  }

  @Get('reviews')
  async getReviewAnalytics(@Query('from') from?: string, @Query('to') to?: string) {
    return ApiResponse.success(await this.analyticsService.getReviewAnalytics(from, to), 'Review analytics');
  }

  @Get('daily')
  async getDailyAnalytics(@Query('from') from?: string, @Query('to') to?: string) {
    return ApiResponse.success(await this.analyticsService.getDailyAnalytics(from, to), 'Daily analytics');
  }

  @Get('real-time')
  async getRealTimeStats() {
    const summary = await this.analyticsService.getDashboardSummary();
    return ApiResponse.success({
      activeUsers: Math.floor(summary.today.visitors * 0.05),
      ordersInProgress: summary.today.orders,
      todayRevenue: summary.today.revenue,
    }, 'Real-time stats');
  }
}
