import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { Public } from '../common/decorators/auth/public.decorator';
import { CurrentUser } from '../common/decorators/auth/current-user.decorator';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Public()
  @Get()
  getOverview() {
    return this.loyaltyService.getPrograms();
  }

  @Public()
  @Get('programs')
  getPrograms() {
    return this.loyaltyService.getPrograms();
  }

  @Get('membership')
  getMyMembership(@CurrentUser('id') userId: string) {
    return this.loyaltyService.getMyMembership(userId);
  }

  @Post('join')
  join(@CurrentUser('id') userId: string, @Body('programId') programId: string) {
    return this.loyaltyService.join(userId, +programId);
  }

  @Get('transactions')
  getTransactions(@CurrentUser('id') userId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.loyaltyService.getTransactions(userId, +(page || 1), +(limit || 20));
  }

  @Post('redeem')
  redeemPoints(@CurrentUser('id') userId: string, @Body() dto: { points: number; description: string }) {
    return this.loyaltyService.redeemPoints(userId, dto.points, dto.description);
  }

  @Post('programs')
  createProgram(@Body() dto: any) {
    return this.loyaltyService.createProgram(dto);
  }
}
