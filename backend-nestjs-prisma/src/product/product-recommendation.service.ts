import { Injectable, Logger } from '@nestjs/common';

export interface RecommendationScore {
  productId: string;
  score: number;
  reason: 'collaborative' | 'content_based' | 'trending' | 'similar' | 'popular' | 'personalized';
}

export interface UserVector {
  userId: string;
  categoryWeights: Record<string, number>;
  priceRange: { min: number; max: number; avg: number };
  brandWeights: Record<string, number>;
  recentProductIds: string[];
  purchasedProductIds: string[];
  viewedProductIds: string[];
  lastUpdated: Date;
}

export interface ProductFeatures {
  productId: string;
  categoryId: string;
  brandId?: string;
  price: number;
  rating: number;
  reviewCount: number;
  salesCount: number;
  tags: string[];
  inStock: boolean;
  createdAt: Date;
}

export interface RecommendationResult {
  products: RecommendationScore[];
  userId?: string;
  context?: string;
  generatedAt: Date;
  algorithm: string;
}

@Injectable()
export class ProductRecommendationService {
  private readonly logger = new Logger(ProductRecommendationService.name);
  private readonly userVectors = new Map<string, UserVector>();
  private readonly productFeatures = new Map<string, ProductFeatures>();
  private readonly trendingCache = new Map<string, { score: number; updatedAt: Date }>();
  private readonly coOccurrenceMatrix = new Map<string, Map<string, number>>();
  private readonly viewHistory = new Map<string, string[]>();
  private readonly purchaseHistory = new Map<string, string[]>();

  indexProduct(features: ProductFeatures): void {
    this.productFeatures.set(features.productId, features);
  }

  bulkIndexProducts(products: ProductFeatures[]): void {
    products.forEach(p => this.indexProduct(p));
    this.logger.log(`Bulk indexed ${products.length} products`);
  }

  recordProductView(userId: string, productId: string): void {
    const views = this.viewHistory.get(userId) ?? [];
    views.unshift(productId);
    if (views.length > 200) views.pop();
    this.viewHistory.set(userId, views);

    const vector = this.userVectors.get(userId) ?? this.createEmptyVector(userId);
    if (!vector.viewedProductIds.includes(productId)) {
      vector.viewedProductIds.unshift(productId);
      if (vector.viewedProductIds.length > 100) vector.viewedProductIds.pop();
    }
    this.updateProductInVector(vector, productId, 0.3);
    this.userVectors.set(userId, vector);
  }

  recordPurchase(userId: string, productId: string, relatedProductIds: string[] = []): void {
    const purchases = this.purchaseHistory.get(userId) ?? [];
    purchases.unshift(productId);
    this.purchaseHistory.set(userId, purchases);

    const vector = this.userVectors.get(userId) ?? this.createEmptyVector(userId);
    if (!vector.purchasedProductIds.includes(productId)) {
      vector.purchasedProductIds.unshift(productId);
    }
    this.updateProductInVector(vector, productId, 1.0);
    this.userVectors.set(userId, vector);

    for (const relatedId of relatedProductIds) {
      this.updateCoOccurrence(productId, relatedId);
      this.updateCoOccurrence(relatedId, productId);
    }
  }

  recordAddToCart(userId: string, productId: string): void {
    const vector = this.userVectors.get(userId) ?? this.createEmptyVector(userId);
    this.updateProductInVector(vector, productId, 0.6);
    this.userVectors.set(userId, vector);
  }

  getPersonalizedRecommendations(userId: string, limit = 20, excludeIds: string[] = []): RecommendationResult {
    const vector = this.userVectors.get(userId);
    if (!vector) return this.getPopularProducts(limit, excludeIds);

    const scores = new Map<string, number>();

    for (const [productId, features] of this.productFeatures) {
      if (excludeIds.includes(productId) || vector.purchasedProductIds.includes(productId)) continue;
      const score = this.computeContentScore(vector, features);
      if (score > 0) scores.set(productId, (scores.get(productId) ?? 0) + score * 0.4);
    }

    const collabScores = this.computeCollaborativeScores(userId, excludeIds);
    for (const [productId, score] of collabScores) {
      scores.set(productId, (scores.get(productId) ?? 0) + score * 0.4);
    }

    for (const [productId, { score }] of this.trendingCache) {
      if (scores.has(productId)) scores.set(productId, scores.get(productId)! + score * 0.2);
    }

    const sorted = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId, score]): RecommendationScore => ({ productId, score, reason: 'personalized' }));

    return { products: sorted, userId, context: 'personalized', generatedAt: new Date(), algorithm: 'hybrid_cf_cb' };
  }

  getSimilarProducts(productId: string, limit = 10, excludeIds: string[] = []): RecommendationResult {
    const target = this.productFeatures.get(productId);
    if (!target) return { products: [], generatedAt: new Date(), algorithm: 'content_similarity' };

    const scores: RecommendationScore[] = [];
    const coOccurrences = this.coOccurrenceMatrix.get(productId);
    if (coOccurrences) {
      for (const [relatedId, count] of coOccurrences) {
        if (relatedId === productId || excludeIds.includes(relatedId)) continue;
        scores.push({ productId: relatedId, score: count / 100, reason: 'similar' });
      }
    }

    for (const [otherId, other] of this.productFeatures) {
      if (otherId === productId || excludeIds.includes(otherId)) continue;
      const sim = this.computeProductSimilarity(target, other);
      const existing = scores.find(s => s.productId === otherId);
      if (existing) {
        existing.score = (existing.score + sim) / 2;
      } else if (sim > 0.1) {
        scores.push({ productId: otherId, score: sim, reason: 'content_based' });
      }
    }

    return { products: scores.sort((a, b) => b.score - a.score).slice(0, limit), context: 'similar', generatedAt: new Date(), algorithm: 'content_similarity' };
  }

  getTrendingProducts(limit = 20, categoryId?: string, excludeIds: string[] = []): RecommendationResult {
    const trending: RecommendationScore[] = [];
    for (const [productId, { score }] of this.trendingCache) {
      if (excludeIds.includes(productId)) continue;
      const features = this.productFeatures.get(productId);
      if (categoryId && features?.categoryId !== categoryId) continue;
      trending.push({ productId, score, reason: 'trending' });
    }
    trending.sort((a, b) => b.score - a.score);
    return { products: trending.slice(0, limit), context: 'trending', generatedAt: new Date(), algorithm: 'trending' };
  }

  getPopularProducts(limit = 20, excludeIds: string[] = []): RecommendationResult {
    const popular: RecommendationScore[] = [];
    for (const [productId, features] of this.productFeatures) {
      if (excludeIds.includes(productId)) continue;
      const score = (features.salesCount * 0.5 + features.reviewCount * 0.3 + features.rating * features.reviewCount * 0.2) / 1000;
      popular.push({ productId, score, reason: 'popular' });
    }
    popular.sort((a, b) => b.score - a.score);
    return { products: popular.slice(0, limit), context: 'popular', generatedAt: new Date(), algorithm: 'popularity' };
  }

  getFrequentlyBoughtTogether(productId: string, limit = 5): RecommendationResult {
    const coOccurrences = this.coOccurrenceMatrix.get(productId) ?? new Map();
    const products = Array.from(coOccurrences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([pid, count]): RecommendationScore => ({ productId: pid, score: count, reason: 'similar' }));
    return { products, context: 'frequently_bought_together', generatedAt: new Date(), algorithm: 'co_occurrence' };
  }

  updateTrendingScore(productId: string, delta: number): void {
    const existing = this.trendingCache.get(productId) ?? { score: 0, updatedAt: new Date() };
    existing.score += delta;
    existing.updatedAt = new Date();
    this.trendingCache.set(productId, existing);
  }

  decayTrendingScores(decayFactor = 0.95): void {
    for (const [productId, data] of this.trendingCache) {
      data.score *= decayFactor;
      if (data.score < 0.001) this.trendingCache.delete(productId);
    }
  }

  getStats(): Record<string, number> {
    return {
      indexedProducts: this.productFeatures.size,
      userVectors: this.userVectors.size,
      trendingProducts: this.trendingCache.size,
      coOccurrenceEntries: Array.from(this.coOccurrenceMatrix.values()).reduce((a, m) => a + m.size, 0),
    };
  }

  private computeContentScore(vector: UserVector, features: ProductFeatures): number {
    let score = 0;
    score += (vector.categoryWeights[features.categoryId] ?? 0) * 3;
    if (features.brandId) score += (vector.brandWeights[features.brandId] ?? 0) * 1.5;
    if (features.price >= vector.priceRange.min && features.price <= vector.priceRange.max) score += 1;
    if (features.inStock) score += 0.5;
    score += features.rating / 5;
    return score;
  }

  private computeProductSimilarity(a: ProductFeatures, b: ProductFeatures): number {
    let sim = 0;
    if (a.categoryId === b.categoryId) sim += 0.4;
    if (a.brandId && a.brandId === b.brandId) sim += 0.2;
    const priceRatio = Math.min(a.price, b.price) / Math.max(a.price, b.price);
    sim += priceRatio * 0.2;
    const sharedTags = a.tags.filter(t => b.tags.includes(t)).length;
    sim += Math.min(sharedTags / Math.max(1, Math.max(a.tags.length, b.tags.length)), 0.2);
    return Math.min(sim, 1);
  }

  private computeCollaborativeScores(userId: string, excludeIds: string[]): Map<string, number> {
    const scores = new Map<string, number>();
    const userPurchases = new Set(this.purchaseHistory.get(userId) ?? []);
    for (const [otherUserId, otherPurchases] of this.purchaseHistory) {
      if (otherUserId === userId) continue;
      const otherSet = new Set(otherPurchases);
      const intersection = [...userPurchases].filter(p => otherSet.has(p)).length;
      const union = new Set([...userPurchases, ...otherSet]).size;
      const similarity = union > 0 ? intersection / union : 0;
      if (similarity < 0.1) continue;
      for (const productId of otherPurchases) {
        if (userPurchases.has(productId) || excludeIds.includes(productId)) continue;
        scores.set(productId, (scores.get(productId) ?? 0) + similarity);
      }
    }
    return scores;
  }

  private updateProductInVector(vector: UserVector, productId: string, weight: number): void {
    const features = this.productFeatures.get(productId);
    if (!features) return;
    vector.categoryWeights[features.categoryId] = Math.min(10, (vector.categoryWeights[features.categoryId] ?? 0) + weight);
    if (features.brandId) vector.brandWeights[features.brandId] = Math.min(10, (vector.brandWeights[features.brandId] ?? 0) + weight * 0.5);
    const prices = [vector.priceRange.min, vector.priceRange.max, features.price].filter(p => p > 0 && p < Infinity);
    if (prices.length) {
      vector.priceRange.min = Math.min(...prices);
      vector.priceRange.max = Math.max(...prices);
      vector.priceRange.avg = (vector.priceRange.avg + features.price) / 2;
    }
  }

  private updateCoOccurrence(productA: string, productB: string): void {
    if (!this.coOccurrenceMatrix.has(productA)) this.coOccurrenceMatrix.set(productA, new Map());
    const row = this.coOccurrenceMatrix.get(productA)!;
    row.set(productB, (row.get(productB) ?? 0) + 1);
  }

  private createEmptyVector(userId: string): UserVector {
    return {
      userId,
      categoryWeights: {},
      priceRange: { min: 0, max: Infinity, avg: 0 },
      brandWeights: {},
      recentProductIds: [],
      purchasedProductIds: [],
      viewedProductIds: [],
      lastUpdated: new Date(),
    };
  }
}
