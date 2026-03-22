import { Controller, Get, Post, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/utils/api-response.util';

@Controller('recently-viewed')
@UseGuards(JwtAuthGuard)
export class RecentlyViewedController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getRecentlyViewed(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    const data = await this.productService.getRecentlyViewed(userId, +(limit || 20));
    return ApiResponse.success(data, 'Recently viewed');
  }

  @Post(':productId')
  async addView(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    await this.productService.recordView(userId, productId);
    return ApiResponse.success(null, 'View recorded');
  }

  @Delete()
  async clearAll(@CurrentUser('id') userId: string) {
    return ApiResponse.success(null, 'Cleared');
  }

  @Delete(':productId')
  async removeView(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return ApiResponse.success(null, 'Removed');
  }
}
