import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Public } from '../common/decorators/auth/public.decorator';
import { CurrentUser } from '../common/decorators/auth/current-user.decorator';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Public()
  @Get('plans')
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Get('my')
  getMySubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionService.getMySubscription(userId);
  }

  @Post()
  subscribe(@CurrentUser('id') userId: string, @Body('planId') planId: string) {
    return this.subscriptionService.subscribe(userId, +planId);
  }

  @Post('cancel')
  cancel(@CurrentUser('id') userId: string) {
    return this.subscriptionService.cancel(userId);
  }

  @Post('plans')
  createPlan(@Body() dto: any) {
    return this.subscriptionService.createPlan(dto);
  }

  @Put('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: any) {
    return this.subscriptionService.updatePlan(+id, dto);
  }

  @Get('admin/all')
  async getAllSubscriptions(@Query('page') page?: string, @Query('size') size?: string) {
    return this.subscriptionService.getAll(Math.max(1, +(page || 1)), Math.max(1, +(size || 20)));
  }
}
