import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { QueueService } from './queue.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('queues')
@Controller('queues')
export class QueueController {
  constructor(private queueService: QueueService) {}

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  async getStats() {
    return this.queueService.getQueueStats();
  }

  @Public()
  @Post('test/email')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send a test email via queue (dev only)' })
  async sendTestEmail(@Body() body: { to: string; firstName?: string }) {
    const job = await this.queueService.queueWelcomeEmail(
      body.to,
      body.firstName ?? 'Test User',
    );
    return { message: 'Email job queued', jobId: job.id };
  }

  @Public()
  @Post('test/notification')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send a test notification via queue (dev only)' })
  async sendTestNotification(@Body() body: { userId: string; title?: string; message?: string }) {
    const job = await this.queueService.queueNotification(
      body.userId,
      body.title ?? 'Test Notification',
      body.message ?? 'This is a test notification from the queue system.',
      'SYSTEM',
      'IN_APP',
    );
    return { message: 'Notification job queued', jobId: job.id };
  }
}
