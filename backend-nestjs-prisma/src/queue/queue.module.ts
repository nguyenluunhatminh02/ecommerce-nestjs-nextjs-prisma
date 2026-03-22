import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from './queue.constants';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { EmailProcessor } from './processors/email.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { OrderProcessor } from './processors/order.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
        },
        defaultJobOptions: {
          removeOnComplete: { age: 3600, count: 100 }, // keep last 100 or 1 hour
          removeOnFail: { age: 86400, count: 500 },   // keep failed for 24 hours
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.EMAIL },
      { name: QUEUE_NAMES.NOTIFICATION },
      { name: QUEUE_NAMES.ORDER },
    ),
    PrismaModule,
  ],
  controllers: [QueueController],
  providers: [
    QueueService,
    EmailProcessor,
    NotificationProcessor,
    OrderProcessor,
  ],
  exports: [QueueService],
})
export class QueueModule {}
