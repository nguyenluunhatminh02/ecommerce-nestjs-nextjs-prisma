import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import { Public } from '../common/decorators/auth/public.decorator';
import { CurrentUser } from '../common/decorators/auth/current-user.decorator';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('pending')
  getPending(@Query('page') page?: string, @Query('size') size?: string) {
    return this.reviewService.getPending(Math.max(1, +(page || 1)), Math.max(1, +(size || 20)));
  }

  @Public()
  @Get('product/:productId')
  getByProduct(@Param('productId') productId: string, @Query('page') page?: string, @Query('size') size?: string) {
    const p = Math.max(1, +(page || 0) + 1);
    return this.reviewService.getByProduct(productId, p, Math.max(1, +(size || 10)));
  }

  @Public()
  @Get('product/:productId/rating-distribution')
  getRatingDistribution(@Param('productId') productId: string) {
    return this.reviewService.getRatingDistribution(productId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.reviewService.create(userId, dto);
  }

  @Put(':id')
  update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: any) {
    return this.reviewService.update(userId, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.reviewService.delete(userId, id);
  }

  @Post(':id/reply')
  reply(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('comment') comment: string) {
    return this.reviewService.reply(userId, id, comment);
  }

  @Post(':id/helpful')
  helpful(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.reviewService.helpful(userId, id);
  }
}
