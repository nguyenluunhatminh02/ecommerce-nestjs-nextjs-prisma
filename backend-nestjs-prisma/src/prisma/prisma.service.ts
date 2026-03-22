import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {
    const host = configService.get<string>('database.host');
    const port = configService.get<number>('database.port');
    const username = configService.get<string>('database.username');
    const password = encodeURIComponent(configService.get<string>('database.password'));
    const database = configService.get<string>('database.name');
    const ssl = configService.get<boolean>('database.ssl');

    const connectionString = process.env.DATABASE_URL ||
      `postgresql://${username}:${password}@${host}:${port}/${database}`;

    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}