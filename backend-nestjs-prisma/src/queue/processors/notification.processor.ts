import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES, JOB_NAMES } from '../queue.constants';

@Processor(QUEUE_NAMES.NOTIFICATION, { concurrency: 5 })
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing notification job [${job.name}] id=${job.id}`);

    try {
      switch (job.name) {
        case JOB_NAMES.SEND_NOTIFICATION:
          return this.sendNotification(job.data);
        default:
          this.logger.warn(`Unknown notification job: ${job.name}`);
      }
    } catch (err) {
      this.logger.error(`Failed notification job [${job.name}] id=${job.id}: ${err.message}`);
      throw err;
    }
  }

  private async sendNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    channel: string;
    extraData?: string;
  }) {
    const notif = await this.prisma.notifications.create({
      data: {
        user_id: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        channel: data.channel,
        data: data.extraData,
        is_read: false,
      },
    });

    this.logger.log(`Notification created for user ${data.userId}: ${data.title}`);
    return { notificationId: notif.id };
  }
}
