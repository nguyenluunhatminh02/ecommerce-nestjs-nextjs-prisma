import { Controller, Get, Post, Put, Patch, Body, Param, Query } from '@nestjs/common';
import { SupportService } from './support.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  getMyTickets(@CurrentUser('id') userId: string, @Query('page') page?: string, @Query('limit') limit?: string, @Query('size') size?: string) {
    return this.supportService.getMyTickets(userId, +(page || 0), +(size || limit || 10));
  }

  @Get('tickets/:id')
  getById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.supportService.getById(userId, id);
  }

  @Post('tickets')
  create(@CurrentUser('id') userId: string, @Body() dto: any, @Query('subject') subject?: string, @Query('message') message?: string) {
    const data = { ...dto };
    if (subject) data.subject = subject;
    if (message) data.message = message;
    return this.supportService.create(userId, data);
  }

  @Post('tickets/:id/reply')
  reply(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('content') content: string, @Query('message') message?: string) {
    return this.supportService.reply(userId, id, content || message || '');
  }

  @Put('tickets/:id/close')
  closePut(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.supportService.close(userId, id);
  }

  @Patch('tickets/:id/close')
  close(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.supportService.close(userId, id);
  }
}
