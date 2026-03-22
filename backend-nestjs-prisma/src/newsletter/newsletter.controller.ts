import { Controller, Get, Post, Delete, Body, Query } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Public()
  @Post('subscribe')
  subscribe(@Body() dto: { email: string }) {
    return this.newsletterService.subscribe(dto.email);
  }

  @Public()
  @Post('unsubscribe')
  unsubscribe(@Body('email') email: string) {
    return this.newsletterService.unsubscribe(email);
  }

  @Get('subscribers')
  getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.newsletterService.getAll(Math.max(1, +(page || 1)), Math.max(1, +(limit || 50)));
  }
}
