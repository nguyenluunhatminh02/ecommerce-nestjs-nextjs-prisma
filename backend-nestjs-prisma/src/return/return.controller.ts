import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ReturnService } from './return.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('returns')
export class ReturnController {
  constructor(private readonly returnService: ReturnService) {}

  @Get()
  getMyReturns(@CurrentUser('id') userId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.returnService.getMyReturns(userId, Math.max(1, +(page || 1)), Math.max(1, +(limit || 10)));
  }

  @Get(':id')
  getById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.returnService.getById(userId, +id);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.returnService.create(userId, dto);
  }
}
