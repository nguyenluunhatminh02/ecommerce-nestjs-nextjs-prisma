import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { MLRecommendationFacade } from './ml-recommendation-facade.service';
import { ApiResponse } from '../common/utils/api-response.util';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly recommendationService: MLRecommendationFacade,
  ) {}

  @Public()
  @Get('filter')
  async filter(
    @Query('page') page?: number, @Query('size') size?: number,
    @Query('search') search?: string, @Query('keyword') keyword?: string,
    @Query('categoryId') categoryId?: string, @Query('category') categorySlug?: string,
    @Query('brandId') brandId?: string, @Query('shopId') shopId?: string,
    @Query('minPrice') minPrice?: number, @Query('maxPrice') maxPrice?: number,
    @Query('minRating') minRating?: number, @Query('status') status?: string,
    @Query('featured') featured?: boolean, @Query('isFeatured') isFeatured?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string, @Query('sortDirection') sortDirection?: string,
    @Query('inStock') inStock?: boolean, @Query('onSale') onSale?: boolean,
  ) {
    const result = await this.productService.filter({
      page, size, search: search || keyword, categoryId, categorySlug, brandId, shopId,
      minPrice, maxPrice, minRating, status, featured: featured ?? isFeatured, sortBy, sortDir: sortDir || sortDirection, inStock, onSale,
    });
    return ApiResponse.success(result);
  }

  @Public()
  @Get('featured')
  async getFeatured(@Query('page') page = 0, @Query('size') size = 20) {
    return ApiResponse.success(await this.productService.getFeatured(page, size));
  }

  @Public()
  @Get('new-arrivals')
  async getNewArrivals(@Query('page') page = 0, @Query('size') size = 20) {
    return ApiResponse.success(await this.productService.getNewArrivals(page, size));
  }

  @Public()
  @Get('best-sellers')
  async getBestSellers(@Query('page') page = 0, @Query('size') size = 20) {
    return ApiResponse.success(await this.productService.getBestSellers(page, size));
  }

  @Public()
  @Get('deals')
  async getDeals(@Query('page') page = 0, @Query('size') size = 20) {
    return ApiResponse.success(await this.productService.getDeals(page, size));
  }

  @Public()
  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return ApiResponse.success(await this.productService.findBySlug(slug));
  }

  @Public()
  @Get('shop/:shopId')
  async getShopProducts(@Param('shopId') shopId: string, @Query('page') page = 0, @Query('size') size = 20) {
    return ApiResponse.success(await this.productService.getShopProducts(shopId, page, size));
  }

  @Public()
  @Get(':id/related')
  async getRelated(@Param('id') id: string, @Query('size') size = 10) {
    return ApiResponse.success(await this.productService.getRelated(id, size));
  }

  @Public()
  @Get(':id')
  async getById(@Param('id') id: string) {
    return ApiResponse.success(await this.productService.findById(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: any, @CurrentUser('id') userId: string) {
    return ApiResponse.success(await this.productService.create(body, userId), 'Product created');
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() body: any, @CurrentUser('id') userId: string) {
    return ApiResponse.success(await this.productService.update(id, body, userId), 'Product updated');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.productService.delete(id, userId);
    return ApiResponse.success(null, 'Product deleted');
  }

  @Put(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publish(@Param('id') id: string) {
    await this.productService.publish(id);
    return ApiResponse.success(null, 'Product published');
  }

  // ─── Recently Viewed ───────────────────────────────────────────────────

  @Get('recently-viewed')
  getRecentlyViewedAlias(@CurrentUser('id') userId: string, @Query('limit') limit?: string) {
    return this.productService.getRecentlyViewed(userId, +(limit || 20));
  }

  @Get('recently-viewed/me')
  @UseGuards(JwtAuthGuard)
  async getRecentlyViewed(@CurrentUser('id') userId: string, @Query('limit') limit = 20) {
    return ApiResponse.success(await this.productService.getRecentlyViewed(userId, limit));
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  async recordView(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.productService.recordView(userId, id);
    return ApiResponse.success(null, 'View recorded');
  }

  // ─── ML Recommendation Endpoints ──────────────────────────────────────────

  @Get('recommendations/personalized')
  @UseGuards(JwtAuthGuard)
  async getPersonalizedRecommendations(@CurrentUser('id') userId: string, @Query('limit') limit = 20) {
    const result = await this.recommendationService.getPersonalizedRecommendations(userId, limit);
    const enrichedProducts = await this.productService.findByIds(result.products.map(p => p.productId));
    return ApiResponse.success({ ...result, enrichedProducts });
  }

  @Public()
  @Get('recommendations/similar/:productId')
  async getSimilarProducts(@Param('productId') productId: string, @Query('limit') limit = 10) {
    const result = await this.recommendationService.getSimilarProducts(productId, limit);
    const enrichedProducts = await this.productService.findByIds(result.products.map(p => p.productId));
    return ApiResponse.success({ ...result, enrichedProducts });
  }

  @Public()
  @Get('recommendations/trending')
  async getTrendingProducts(@Query('limit') limit = 20, @Query('categoryId') categoryId?: string) {
    const result = await this.recommendationService.getTrendingProducts(limit, categoryId);
    const enrichedProducts = await this.productService.findByIds(result.products.map(p => p.productId));
    return ApiResponse.success({ ...result, enrichedProducts });
  }

  @Public()
  @Get('recommendations/popular')
  async getPopularProducts(@Query('limit') limit = 20) {
    const result = this.recommendationService.getPopularProducts(limit);
    const enrichedProducts = await this.productService.findByIds(result.products.map(p => p.productId));
    return ApiResponse.success({ ...result, enrichedProducts });
  }

  @Public()
  @Get('recommendations/frequently-bought/:productId')
  async getFrequentlyBoughtTogether(@Param('productId') productId: string, @Query('limit') limit = 5) {
    const result = this.recommendationService.getFrequentlyBoughtTogether(productId, limit);
    const enrichedProducts = await this.productService.findByIds(result.products.map(p => p.productId));
    return ApiResponse.success({ ...result, enrichedProducts });
  }

  @Post('recommendations/track/view')
  @UseGuards(JwtAuthGuard)
  async trackProductView(@CurrentUser('id') userId: string, @Body('productId') productId: string) {
    this.recommendationService.recordProductView(userId, productId);
    return ApiResponse.success(null, 'View recorded');
  }

  @Post('recommendations/track/purchase')
  @UseGuards(JwtAuthGuard)
  async trackPurchase(@CurrentUser('id') userId: string, @Body('productId') productId: string, @Body('relatedProductIds') relatedProductIds: string[] = []) {
    this.recommendationService.recordPurchase(userId, productId, relatedProductIds);
    return ApiResponse.success(null, 'Purchase recorded');
  }

  @Post('recommendations/track/cart')
  @UseGuards(JwtAuthGuard)
  async trackAddToCart(@CurrentUser('id') userId: string, @Body('productId') productId: string) {
    this.recommendationService.recordAddToCart(userId, productId);
    return ApiResponse.success(null, 'Cart add recorded');
  }

  @Get('recommendations/stats')
  @UseGuards(JwtAuthGuard)
  async getRecommendationStats() {
    return ApiResponse.success(await this.recommendationService.getStats());
  }
}
