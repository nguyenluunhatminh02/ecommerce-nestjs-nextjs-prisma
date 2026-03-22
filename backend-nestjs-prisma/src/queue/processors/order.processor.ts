import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES, JOB_NAMES } from '../queue.constants';

@Processor(QUEUE_NAMES.ORDER, { concurrency: 3 })
export class OrderProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderProcessor.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.EMAIL) private emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private notificationQueue: Queue,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing order job [${job.name}] id=${job.id}`);

    try {
      switch (job.name) {
        case JOB_NAMES.ORDER_CREATED:
          return this.handleOrderCreated(job.data);
        case JOB_NAMES.ORDER_STATUS_CHANGED:
          return this.handleOrderStatusChanged(job.data);
        default:
          this.logger.warn(`Unknown order job: ${job.name}`);
      }
    } catch (err) {
      this.logger.error(`Failed order job [${job.name}] id=${job.id}: ${err.message}`);
      throw err;
    }
  }

  private async handleOrderCreated(data: { orderId: string; userId: string }) {
    const order = await this.prisma.orders.findUnique({
      where: { id: data.orderId },
      include: { users: { select: { email: true, first_name: true } } },
    });

    if (!order) {
      this.logger.warn(`Order ${data.orderId} not found`);
      return;
    }

    // Queue order confirmation email
    await this.emailQueue.add(JOB_NAMES.SEND_ORDER_CONFIRMATION_EMAIL, {
      to: order.users.email,
      firstName: order.users.first_name || 'Customer',
      orderNumber: order.order_number,
      totalAmount: Number(order.total_amount),
    });

    // Queue in-app notification
    await this.notificationQueue.add(JOB_NAMES.SEND_NOTIFICATION, {
      userId: data.userId,
      title: 'Order Placed',
      message: `Your order #${order.order_number} has been placed successfully.`,
      type: 'ORDER',
      channel: 'IN_APP',
    });

    this.logger.log(`Order created events dispatched for order ${order.order_number}`);
    return { processed: true };
  }

  private async handleOrderStatusChanged(data: { orderId: string; newStatus: string }) {
    const order = await this.prisma.orders.findUnique({
      where: { id: data.orderId },
      include: { users: { select: { id: true, email: true, first_name: true } } },
    });

    if (!order) {
      this.logger.warn(`Order ${data.orderId} not found`);
      return;
    }

    // Queue in-app notification for status change
    await this.notificationQueue.add(JOB_NAMES.SEND_NOTIFICATION, {
      userId: order.users.id,
      title: 'Order Status Updated',
      message: `Your order #${order.order_number} is now ${data.newStatus}.`,
      type: 'ORDER',
      channel: 'IN_APP',
    });

    this.logger.log(`Order status change events dispatched for order ${order.order_number} -> ${data.newStatus}`);
    return { processed: true };
  }
}
