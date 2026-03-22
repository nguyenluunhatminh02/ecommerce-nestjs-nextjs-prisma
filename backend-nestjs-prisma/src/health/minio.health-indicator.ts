import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { FileStorageService } from '../files/files.service';

@Injectable()
export class MinioHealthIndicator extends HealthIndicator {
  constructor(private readonly fileStorageService: FileStorageService) {
    super();
  }

  async isHealthy(key: string = 'minio'): Promise<HealthIndicatorResult> {
    try {
      const isHealthy = await this.fileStorageService.healthCheck();

      if (!isHealthy) {
        throw new HealthCheckError('MinIO connection failed', this.getStatus(key, false));
      }

      return this.getStatus(key, true, {
        message: 'MinIO connection is healthy',
      });
    } catch (error) {
      if (error instanceof HealthCheckError) {
        throw error;
      }

      throw new HealthCheckError(
        'MinIO health check failed',
        this.getStatus(key, false, {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}
