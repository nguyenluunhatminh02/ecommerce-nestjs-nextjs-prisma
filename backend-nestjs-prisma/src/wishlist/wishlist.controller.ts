import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getAll(@CurrentUser('id') userId: string, @Query('page') page?: string, @Query('size') size?: string) {
    return this.wishlistService.getAll(userId, +(page || 0), +(size || 20));
  }

  @Get('count')
  count(@CurrentUser('id') userId: string) {
    return this.wishlistService.count(userId);
  }

  @Get('check/:productId')
  checkByPath(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlistService.check(userId, productId);
  }

  @Post(':productId')
  add(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlistService.toggle(userId, productId);
  }

  @Post(':productId/toggle')
  toggle(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlistService.toggle(userId, productId);
  }

  @Get(':productId/check')
  check(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlistService.check(userId, productId);
  }

  @Delete(':productId')
  remove(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlistService.remove(userId, productId);
  }

  @Delete()
  clearAll(@CurrentUser('id') userId: string) {
    return this.wishlistService.clearAll(userId);
  }
}
