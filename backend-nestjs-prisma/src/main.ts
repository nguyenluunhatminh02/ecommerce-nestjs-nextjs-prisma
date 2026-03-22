import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { getQueueToken } from '@nestjs/bullmq';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './queue/queue.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');

  app.use(cookieParser());

  // ─── Bull Board UI ─────────────────────────────────────
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const emailQueue = app.get<Queue>(getQueueToken(QUEUE_NAMES.EMAIL));
  const notificationQueue = app.get<Queue>(getQueueToken(QUEUE_NAMES.NOTIFICATION));
  const orderQueue = app.get<Queue>(getQueueToken(QUEUE_NAMES.ORDER));

  createBullBoard({
    queues: [
      new BullMQAdapter(emailQueue),
      new BullMQAdapter(notificationQueue),
      new BullMQAdapter(orderQueue),
    ],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ApiResponseInterceptor());

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS')?.split(',').map(o => o.trim()).filter(Boolean) ?? ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const config = new DocumentBuilder()
    .setTitle('Ecommerce API')
    .setDescription('NestJS port of the Spring Boot ecommerce auth backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Application running on http://localhost:${port}`);
  console.log(`Bull Board UI: http://localhost:${port}/admin/queues`);
  console.log(`Swagger API docs: http://localhost:${port}/api/docs`);
}
bootstrap();
