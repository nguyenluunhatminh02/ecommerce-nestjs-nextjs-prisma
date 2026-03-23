import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GiftCardService } from './gift-card.service';
import { CurrentUser } from '../common/decorators/auth/current-user.decorator';

@Controller('gift-cards')
export class GiftCardController {
  constructor(private readonly giftCardService: GiftCardService) {}

  @Get()
  getMyCards(@CurrentUser('id') userId: string) {
    return this.giftCardService.getMyCards(userId);
  }

  @Get(':code')
  getByCode(@Param('code') code: string) {
    return this.giftCardService.getByCode(code);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.giftCardService.create(userId, dto);
  }

  @Post(':code/redeem')
  redeem(@CurrentUser('id') userId: string, @Param('code') code: string) {
    return this.giftCardService.redeem(userId, code);
  }
}
