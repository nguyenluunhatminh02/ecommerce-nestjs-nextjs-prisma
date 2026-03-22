import { Injectable, Logger } from '@nestjs/common';
import { MLIntegrationService } from './ml-integration.service';
import { ProductRecommendationService, RecommendationResult } from './product-recommendation.service';

@Injectable()
export class MLRecommendationFacade {
  private readonly logger = new Logger(MLRecommendationFacade.name);

  constructor(
    private readonly mlService: MLIntegrationService,
    private readonly localService: ProductRecommendationService,
  ) {}

  async getPersonalizedRecommendations(userId: string, limit = 20, excludeIds: string[] = []): Promise<RecommendationResult> {
    try {
      const mlResult = await this.mlService.getPersonalizedRecommendations(userId, limit, 'ensemble', excludeIds);
      if (mlResult?.products.length > 0) return mlResult;
    } catch (error: any) {
      this.logger.warn(`ML personalized recommendations failed: ${error.message}`);
    }
    return this.localService.getPersonalizedRecommendations(userId, limit, excludeIds);
  }

  async getSimilarProducts(productId: string, limit = 10, excludeIds: string[] = []): Promise<RecommendationResult> {
    try {
      const mlResult = await this.mlService.getSimilarProducts(productId, limit, 'ensemble', excludeIds);
      if (mlResult?.products.length > 0) return mlResult;
    } catch (error: any) {
      this.logger.warn(`ML similar products failed: ${error.message}`);
    }
    return this.localService.getSimilarProducts(productId, limit, excludeIds);
  }

  async getTrendingProducts(limit = 20, categoryId?: string, excludeIds: string[] = []): Promise<RecommendationResult> {
    try {
      const mlResult = await this.mlService.getTrendingProducts(limit, categoryId);
      if (mlResult?.products.length > 0) return mlResult;
    } catch (error: any) {
      this.logger.warn(`ML trending products failed: ${error.message}`);
    }
    return this.localService.getTrendingProducts(limit, categoryId, excludeIds);
  }

  getPopularProducts(limit = 20, excludeIds: string[] = []): RecommendationResult {
    return this.localService.getPopularProducts(limit, excludeIds);
  }

  getFrequentlyBoughtTogether(productId: string, limit = 5): RecommendationResult {
    return this.localService.getFrequentlyBoughtTogether(productId, limit);
  }

  recordProductView(userId: string, productId: string): void {
    this.localService.recordProductView(userId, productId);
  }

  recordPurchase(userId: string, productId: string, relatedProductIds: string[] = []): void {
    this.localService.recordPurchase(userId, productId, relatedProductIds);
  }

  recordAddToCart(userId: string, productId: string): void {
    this.localService.recordAddToCart(userId, productId);
  }

  async triggerTraining(algorithm: 'svd' | 'nmf' | 'all' = 'all', forceRetrain = false) {
    return this.mlService.startTraining(algorithm, forceRetrain);
  }

  async getTrainingStatus(trainingId: string) {
    return this.mlService.getTrainingStatus(trainingId);
  }

  async getModelMetrics() {
    return this.mlService.getModelMetrics();
  }

  async getStats(): Promise<Record<string, any>> {
    const localStats = this.localService.getStats();
    const circuitBreaker = this.mlService.getCircuitBreakerStatus();
    let mlHealth: any = null;
    let mlReady = false;
    try {
      mlHealth = await this.mlService.checkHealth();
      mlReady = await this.mlService.isReady();
    } catch { /* ML service unavailable */ }
    return {
      ...localStats,
      mlService: {
        available: circuitBreaker.isAvailable,
        circuitBreakerState: circuitBreaker.state,
        failureCount: circuitBreaker.failureCount,
        health: mlHealth,
        modelsReady: mlReady,
        url: process.env.ML_SERVICE_URL || 'http://localhost:8000',
      },
    };
  }
}
