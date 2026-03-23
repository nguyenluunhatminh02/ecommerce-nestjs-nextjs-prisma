import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CartService } from './cart.service';
import { CurrentUser } from '../common/decorators/auth/current-user.decorator';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Get('count')
  getCount(@CurrentUser('id') userId: string) {
    return this.cartService.getCount(userId);
  }

  @Post('items')
  addItem(@CurrentUser('id') userId: string, @Body() dto: { productId: string; variantId?: string; quantity: number }) {
    return this.cartService.addItem(userId, dto);
  }

  @Put('items/:itemId')
  updateItem(@CurrentUser('id') userId: string, @Param('itemId') itemId: string, @Body('quantity') quantity: number) {
    return this.cartService.updateItem(userId, itemId, quantity);
  }

  @Delete('items/:itemId')
  removeItem(@CurrentUser('id') userId: string, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(userId, itemId);
  }

  @Delete()
  clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }

  @Post('coupon')
  applyCoupon(@CurrentUser('id') userId: string, @Body('code') code: string) {
    return this.cartService.applyCoupon(userId, code);
  }

  @Delete('coupon')
  removeCoupon(@CurrentUser('id') userId: string) {
    return this.cartService.removeCoupon(userId);
  }
}
