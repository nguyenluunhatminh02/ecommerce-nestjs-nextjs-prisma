import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  getMyRooms(@CurrentUser('id') userId: string) {
    return this.chatService.getMyRooms(userId);
  }

  @Post('rooms')
  getOrCreateRoom(@CurrentUser('id') userId: string, @Body('userId') otherUserId: string, @Query('shopId') shopId?: string) {
    return this.chatService.getOrCreateRoom(userId, otherUserId || shopId || '');
  }

  @Get('rooms/:roomId/messages')
  getMessages(@CurrentUser('id') userId: string, @Param('roomId') roomId: string, @Query('page') page?: string, @Query('limit') limit?: string, @Query('size') size?: string) {
    return this.chatService.getMessages(userId, roomId, +(page || 0), +(size || limit || 50));
  }

  @Post('rooms/:roomId/messages')
  sendMessage(@CurrentUser('id') userId: string, @Param('roomId') roomId: string, @Body() dto: { content: string }, @Query('content') qContent?: string) {
    return this.chatService.sendMessage(userId, roomId, dto?.content || qContent || '');
  }

  @Put('rooms/:roomId/read')
  markReadPut(@CurrentUser('id') userId: string, @Param('roomId') roomId: string) {
    return this.chatService.markRead(userId, roomId);
  }

  @Post('rooms/:roomId/read')
  markRead(@CurrentUser('id') userId: string, @Param('roomId') roomId: string) {
    return this.chatService.markRead(userId, roomId);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.chatService.getUnreadCount(userId);
  }
}
