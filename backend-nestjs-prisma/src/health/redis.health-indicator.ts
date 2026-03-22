import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisService } from '../common/services/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async isHealthy(key: string = 'redis'): Promise<HealthIndicatorResult> {
    try {
      const isHealthy = await this.redisService.healthCheck();

      if (!isHealthy) {
        throw new HealthCheckError('Redis connection failed', this.getStatus(key, false));
      }

      return this.getStatus(key, true, {
        message: 'Redis connection is healthy',
      });
    } catch (error) {
      if (error instanceof HealthCheckError) {
        throw error;
      }

      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}
