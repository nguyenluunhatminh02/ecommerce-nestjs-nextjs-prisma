import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
} from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator';
import { RedisHealthIndicator } from './redis.health-indicator';
import { MinioHealthIndicator } from './minio.health-indicator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaHealthIndicator } from './prisma.health-indicator';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private redis: RedisHealthIndicator,
    private minio: MinioHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Application is running' })
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('detailed')
  @HealthCheck()
  @ApiOperation({ summary: 'Detailed health check with dependencies' })
  @ApiResponse({ status: 200, description: 'All dependencies are healthy' })
  @ApiResponse({ status: 503, description: 'One or more dependencies are unhealthy' })
  check() {
    return this.health.check([
      () => this.db.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
      () => this.minio.isHealthy('minio'),
    ]);
  }

  @Get('database')
  @HealthCheck()
  @ApiOperation({ summary: 'Database health check' })
  @ApiResponse({ status: 200, description: 'Database is healthy' })
  @ApiResponse({ status: 503, description: 'Database is unhealthy' })
  checkDatabase() {
    return this.health.check([() => this.db.isHealthy('database')]);
  }

  @Get('redis')
  @HealthCheck()
  @ApiOperation({ summary: 'Redis health check' })
  @ApiResponse({ status: 200, description: 'Redis is healthy' })
  @ApiResponse({ status: 503, description: 'Redis is unhealthy' })
  checkRedis() {
    return this.health.check([() => this.redis.isHealthy('redis')]);
  }

  @Get('minio')
  @HealthCheck()
  @ApiOperation({ summary: 'MinIO health check' })
  @ApiResponse({ status: 200, description: 'MinIO is healthy' })
  @ApiResponse({ status: 503, description: 'MinIO is unhealthy' })
  checkMinio() {
    return this.health.check([() => this.minio.isHealthy('minio')]);
  }
}
