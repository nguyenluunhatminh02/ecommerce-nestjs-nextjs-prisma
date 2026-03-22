import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RecommendationResult, RecommendationScore } from './product-recommendation.service';

export interface MLRecommendationResponse {
  user_id: string;
  recommendations: { product_id: string; score: number; algorithm: string; reason?: string }[];
  metadata: { algorithm: string; model_version?: string; generated_at: string };
}

export interface MLSimilarProductsResponse {
  product_id: string;
  similar_products: { product_id: string; similarity_score: number }[];
  metadata: { algorithm: string; generated_at: string };
}

export interface MLTrendingProductsResponse {
  trending_products: { product_id: string; trending_score: number }[];
  metadata: { generated_at: string };
}

export interface MLTrainingResponse {
  training_id: string;
  status: string;
  progress?: number;
  message: string;
}

enum CircuitState { CLOSED = 'CLOSED', OPEN = 'OPEN', HALF_OPEN = 'HALF_OPEN' }

@Injectable()
export class MLIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(MLIntegrationService.name);
  private readonly mlServiceUrl: string;
  private readonly requestTimeoutMs: number;
  private readonly maxRetries: number;
  private readonly failureThreshold = 5;
  private readonly recoveryTimeMs = 30_000;
  private readonly halfOpenMaxAttempts = 3;
  private circuitBreaker = { state: CircuitState.CLOSED, failureCount: 0, lastFailureTime: 0, successCount: 0 };
  private lastHealthCheck: { status: string; timestamp: number } | null = null;

  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    this.requestTimeoutMs = parseInt(process.env.ML_REQUEST_TIMEOUT_MS || '5000', 10);
    this.maxRetries = parseInt(process.env.ML_MAX_RETRIES || '2', 10);
  }

  async onModuleInit(): Promise<void> {
    this.logger.log(`ML Integration Service initialized. ML Service URL: ${this.mlServiceUrl}`);
    this.checkHealth().catch(() => {
      this.logger.warn('ML Service not available at startup - will use fallback recommendations');
    });
  }

  async getPersonalizedRecommendations(userId: string, limit = 20, algorithm = 'ensemble', excludeIds: string[] = []): Promise<RecommendationResult | null> {
    const params = new URLSearchParams({ limit: String(limit), algorithm });
    if (excludeIds.length) params.set('exclude_ids', excludeIds.join(','));
    const response = await this.callMLService<MLRecommendationResponse>('GET', `/api/v1/recommendations/users/${encodeURIComponent(userId)}?${params}`);
    if (!response) return null;
    return {
      products: response.recommendations.map((item): RecommendationScore => ({ productId: item.product_id, score: item.score, reason: 'personalized' })),
      userId: response.user_id, context: 'personalized', generatedAt: new Date(response.metadata.generated_at), algorithm: response.metadata.algorithm,
    };
  }

  async getSimilarProducts(productId: string, limit = 10, algorithm = 'ensemble', excludeIds: string[] = []): Promise<RecommendationResult | null> {
    const params = new URLSearchParams({ limit: String(limit), algorithm });
    if (excludeIds.length) params.set('exclude_ids', excludeIds.join(','));
    const response = await this.callMLService<MLSimilarProductsResponse>('GET', `/api/v1/recommendations/products/${encodeURIComponent(productId)}/similar?${params}`);
    if (!response) return null;
    return {
      products: response.similar_products.map((item): RecommendationScore => ({ productId: item.product_id, score: item.similarity_score, reason: 'similar' })),
      context: 'similar', generatedAt: new Date(response.metadata.generated_at), algorithm: response.metadata.algorithm,
    };
  }

  async getTrendingProducts(limit = 20, categoryId?: string): Promise<RecommendationResult | null> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (categoryId) params.set('category_id', categoryId);
    const response = await this.callMLService<MLTrendingProductsResponse>('GET', `/api/v1/recommendations/trending?${params}`);
    if (!response) return null;
    return {
      products: response.trending_products.map((item): RecommendationScore => ({ productId: item.product_id, score: item.trending_score, reason: 'trending' })),
      context: 'trending', generatedAt: new Date(response.metadata.generated_at), algorithm: 'ml_trending',
    };
  }

  async startTraining(algorithm: 'svd' | 'nmf' | 'all' = 'all', forceRetrain = false): Promise<MLTrainingResponse | null> {
    return this.callMLService<MLTrainingResponse>('POST', '/api/v1/training/train', { algorithm, force_retrain: forceRetrain });
  }

  async getTrainingStatus(trainingId: string): Promise<MLTrainingResponse | null> {
    return this.callMLService<MLTrainingResponse>('GET', `/api/v1/training/status/${encodeURIComponent(trainingId)}`);
  }

  async getModelMetrics(): Promise<any> {
    return this.callMLService('GET', '/api/v1/training/metrics');
  }

  async checkHealth(): Promise<any> {
    const response = await this.callMLService<any>('GET', '/health', undefined, true);
    if (response) this.lastHealthCheck = { status: response.status, timestamp: Date.now() };
    return response;
  }

  async isReady(): Promise<boolean> {
    const response = await this.callMLService<{ status: string }>('GET', '/ready', undefined, true);
    return response?.status === 'ready';
  }

  getCircuitBreakerStatus() {
    return {
      state: this.circuitBreaker.state,
      failureCount: this.circuitBreaker.failureCount,
      isAvailable: this.isCircuitClosed(),
      lastHealthCheck: this.lastHealthCheck,
    };
  }

  private async callMLService<T>(method: 'GET' | 'POST', path: string, body?: any, skipCircuitBreaker = false): Promise<T | null> {
    if (!skipCircuitBreaker && !this.isCircuitClosed()) return null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const url = `${this.mlServiceUrl}${path}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

        const options: RequestInit = {
          method,
          headers: { 'Content-Type': 'application/json', ...(process.env.ML_API_KEY ? { 'X-API-Key': process.env.ML_API_KEY } : {}) },
          signal: controller.signal,
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status >= 400 && response.status < 500) return null;
          throw new Error(`HTTP ${response.status}`);
        }

        this.onSuccess();
        return await response.json() as T;
      } catch (error: any) {
        if (attempt === this.maxRetries) {
          this.logger.error(`ML Service call failed after ${this.maxRetries + 1} attempts: ${method} ${path} - ${error.message}`);
          this.onFailure();
          return null;
        }
        const delay = Math.min(100 * Math.pow(2, attempt), 2000);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    return null;
  }

  private isCircuitClosed(): boolean {
    if (this.circuitBreaker.state === CircuitState.CLOSED) return true;
    if (this.circuitBreaker.state === CircuitState.OPEN) {
      if (Date.now() - this.circuitBreaker.lastFailureTime >= this.recoveryTimeMs) {
        this.circuitBreaker.state = CircuitState.HALF_OPEN;
        this.circuitBreaker.successCount = 0;
        return true;
      }
      return false;
    }
    return true;
  }

  private onSuccess(): void {
    if (this.circuitBreaker.state === CircuitState.HALF_OPEN) {
      this.circuitBreaker.successCount++;
      if (this.circuitBreaker.successCount >= this.halfOpenMaxAttempts) {
        this.circuitBreaker.state = CircuitState.CLOSED;
        this.circuitBreaker.failureCount = 0;
      }
    } else {
      this.circuitBreaker.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();
    if (this.circuitBreaker.failureCount >= this.failureThreshold) {
      this.circuitBreaker.state = CircuitState.OPEN;
      this.logger.warn(`Circuit breaker OPEN after ${this.circuitBreaker.failureCount} failures`);
    }
  }
}
