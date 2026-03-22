import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from './queue.constants';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL) private emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private notificationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.ORDER) private orderQueue: Queue,
  ) {}

  // ─── Email Jobs ─────────────────────────────────────────

  async queueWelcomeEmail(to: string, firstName: string) {
    const job = await this.emailQueue.add(JOB_NAMES.SEND_WELCOME_EMAIL, { to, firstName }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    this.logger.log(`Queued welcome email for ${to} (job ${job.id})`);
    return job;
  }

  async queueVerificationEmail(to: string, firstName: string, token: string) {
    const job = await this.emailQueue.add(JOB_NAMES.SEND_VERIFICATION_EMAIL, { to, firstName, token }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    this.logger.log(`Queued verification email for ${to} (job ${job.id})`);
    return job;
  }

  async queuePasswordResetEmail(to: string, firstName: string, token: string) {
    const job = await this.emailQueue.add(JOB_NAMES.SEND_PASSWORD_RESET_EMAIL, { to, firstName, token }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    this.logger.log(`Queued password reset email for ${to} (job ${job.id})`);
    return job;
  }

  async queueAccountLockedEmail(to: string, firstName: string) {
    const job = await this.emailQueue.add(JOB_NAMES.SEND_ACCOUNT_LOCKED_EMAIL, { to, firstName }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    this.logger.log(`Queued account locked email for ${to} (job ${job.id})`);
    return job;
  }

  async queuePasswordChangedEmail(to: string, firstName: string) {
    const job = await this.emailQueue.add(JOB_NAMES.SEND_PASSWORD_CHANGED_EMAIL, { to, firstName }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    this.logger.log(`Queued password changed email for ${to} (job ${job.id})`);
    return job;
  }

  async queueNewsletterEmail(to: string, subject: string, content: string) {
    const job = await this.emailQueue.add(JOB_NAMES.SEND_NEWSLETTER_EMAIL, { to, subject, content }, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
    });
    this.logger.log(`Queued newsletter email for ${to} (job ${job.id})`);
    return job;
  }

  // ─── Notification Jobs ──────────────────────────────────

  async queueNotification(userId: string, title: string, message: string, type: string, channel: string, extraData?: string) {
    const job = await this.notificationQueue.add(JOB_NAMES.SEND_NOTIFICATION, {
      userId, title, message, type, channel, extraData,
    }, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 1000 },
    });
    this.logger.log(`Queued notification for user ${userId} (job ${job.id})`);
    return job;
  }

  // ─── Order Jobs ─────────────────────────────────────────

  async queueOrderCreated(orderId: string, userId: string) {
    const job = await this.orderQueue.add(JOB_NAMES.ORDER_CREATED, { orderId, userId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    this.logger.log(`Queued order created event for order ${orderId} (job ${job.id})`);
    return job;
  }

  async queueOrderStatusChanged(orderId: string, newStatus: string) {
    const job = await this.orderQueue.add(JOB_NAMES.ORDER_STATUS_CHANGED, { orderId, newStatus }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    this.logger.log(`Queued order status change for order ${orderId} -> ${newStatus} (job ${job.id})`);
    return job;
  }

  // ─── Queue Info ─────────────────────────────────────────

  async getQueueStats() {
    const [emailCounts, notifCounts, orderCounts] = await Promise.all([
      this.emailQueue.getJobCounts(),
      this.notificationQueue.getJobCounts(),
      this.orderQueue.getJobCounts(),
    ]);

    return {
      email: emailCounts,
      notification: notifCounts,
      order: orderCounts,
    };
  }
}
