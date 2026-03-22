import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock apiClient
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockDelete = vi.fn();
const mockPatch = vi.fn();

vi.mock('@/lib/api-client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}));

import {
  recentlyViewedService,
  priceAlertService,
  auditLogService,
  recommendationService,
} from '@/services/extended.service';

describe('recentlyViewedService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('addView calls POST /recently-viewed/:productId', async () => {
    mockPost.mockResolvedValue({ data: { data: { id: 1, productId: 'p1' } } });
    const result = await recentlyViewedService.addView('p1');
    expect(mockPost).toHaveBeenCalledWith('/recently-viewed/p1');
    expect(result).toEqual({ id: 1, productId: 'p1' });
  });

  it('getAll calls GET /recently-viewed with limit', async () => {
    mockGet.mockResolvedValue({ data: { data: [{ id: 1 }, { id: 2 }] } });
    const result = await recentlyViewedService.getAll(10);
    expect(mockGet).toHaveBeenCalledWith('/recently-viewed?limit=10');
    expect(result).toHaveLength(2);
  });

  it('clearAll calls DELETE /recently-viewed', async () => {
    mockDelete.mockResolvedValue({});
    await recentlyViewedService.clearAll();
    expect(mockDelete).toHaveBeenCalledWith('/recently-viewed');
  });

  it('remove calls DELETE /recently-viewed/:productId', async () => {
    mockDelete.mockResolvedValue({});
    await recentlyViewedService.remove('p1');
    expect(mockDelete).toHaveBeenCalledWith('/recently-viewed/p1');
  });
});

describe('priceAlertService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('create calls POST /price-alerts', async () => {
    const dto = { productId: 'p1', targetPrice: 49.99 };
    mockPost.mockResolvedValue({ data: { data: { id: 1, ...dto, active: true } } });
    const result = await priceAlertService.create(dto);
    expect(mockPost).toHaveBeenCalledWith('/price-alerts', dto);
    expect(result.active).toBe(true);
    expect(result.targetPrice).toBe(49.99);
  });

  it('getAll calls GET /price-alerts', async () => {
    mockGet.mockResolvedValue({ data: { data: [{ id: 1, active: true }] } });
    const result = await priceAlertService.getAll();
    expect(mockGet).toHaveBeenCalledWith('/price-alerts');
    expect(result).toHaveLength(1);
  });

  it('delete calls DELETE /price-alerts/:id', async () => {
    mockDelete.mockResolvedValue({});
    await priceAlertService.delete(1);
    expect(mockDelete).toHaveBeenCalledWith('/price-alerts/1');
  });

  it('deactivate calls PATCH /price-alerts/:id/deactivate', async () => {
    mockPatch.mockResolvedValue({});
    await priceAlertService.deactivate(1);
    expect(mockPatch).toHaveBeenCalledWith('/price-alerts/1/deactivate');
  });
});

describe('auditLogService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll calls GET /admin/audit-logs with params', async () => {
    const params = { page: 1, limit: 20, action: 'CREATE' };
    mockGet.mockResolvedValue({ data: { data: { items: [], total: 0 } } });
    await auditLogService.getAll(params);
    expect(mockGet).toHaveBeenCalledWith('/admin/audit-logs', { params });
  });

  it('getStats calls GET /admin/audit-logs/stats', async () => {
    mockGet.mockResolvedValue({ data: { data: { totalLogs: 500, todayLogs: 10 } } });
    const result = await auditLogService.getStats();
    expect(mockGet).toHaveBeenCalledWith('/admin/audit-logs/stats');
    expect(result.totalLogs).toBe(500);
  });

  it('getByEntity calls correct URL', async () => {
    mockGet.mockResolvedValue({ data: { data: [{ id: 1 }] } });
    await auditLogService.getByEntity('PRODUCT', 'prod-1');
    expect(mockGet).toHaveBeenCalledWith('/admin/audit-logs/entity/PRODUCT/prod-1');
  });

  it('getByUser calls correct URL', async () => {
    mockGet.mockResolvedValue({ data: { data: [{ id: 1 }] } });
    await auditLogService.getByUser('user-1');
    expect(mockGet).toHaveBeenCalledWith('/admin/audit-logs/user/user-1');
  });
});

describe('recommendationService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getPersonalized calls correct URL with limit', async () => {
    mockGet.mockResolvedValue({ data: { data: { products: [] } } });
    await recommendationService.getPersonalized(5);
    expect(mockGet).toHaveBeenCalledWith('/products/recommendations/personalized?limit=5');
  });

  it('getSimilar calls correct URL', async () => {
    mockGet.mockResolvedValue({ data: { data: { products: [] } } });
    await recommendationService.getSimilar('p1', 8);
    expect(mockGet).toHaveBeenCalledWith('/products/recommendations/similar/p1?limit=8');
  });

  it('getTrending calls correct URL', async () => {
    mockGet.mockResolvedValue({ data: { data: { products: [] } } });
    await recommendationService.getTrending();
    expect(mockGet).toHaveBeenCalledWith('/products/recommendations/trending?limit=10');
  });

  it('getPopular calls correct URL', async () => {
    mockGet.mockResolvedValue({ data: { data: { products: [] } } });
    await recommendationService.getPopular();
    expect(mockGet).toHaveBeenCalledWith('/products/recommendations/popular?limit=10');
  });

  it('getFrequentlyBought calls correct URL', async () => {
    mockGet.mockResolvedValue({ data: { data: { products: [] } } });
    await recommendationService.getFrequentlyBought('p1');
    expect(mockGet).toHaveBeenCalledWith('/products/recommendations/frequently-bought/p1');
  });

  it('trackView calls POST', async () => {
    mockPost.mockResolvedValue({});
    await recommendationService.trackView('p1');
    expect(mockPost).toHaveBeenCalledWith('/products/recommendations/track/view', { productId: 'p1' });
  });

  it('trackPurchase calls POST with array', async () => {
    mockPost.mockResolvedValue({});
    await recommendationService.trackPurchase(['p1', 'p2']);
    expect(mockPost).toHaveBeenCalledWith('/products/recommendations/track/purchase', { productIds: ['p1', 'p2'] });
  });

  it('trackCart calls POST', async () => {
    mockPost.mockResolvedValue({});
    await recommendationService.trackCart('p1');
    expect(mockPost).toHaveBeenCalledWith('/products/recommendations/track/cart', { productId: 'p1' });
  });

  it('getStats calls correct URL', async () => {
    mockGet.mockResolvedValue({ data: { data: { indexedProducts: 100 } } });
    const result = await recommendationService.getStats();
    expect(mockGet).toHaveBeenCalledWith('/products/recommendations/stats');
    expect(result.indexedProducts).toBe(100);
  });
});
