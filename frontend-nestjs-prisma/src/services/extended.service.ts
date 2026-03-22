import apiClient from '@/lib/api-client';
import { ApiResponse, PageResponse } from '@/types';

// ==================== FAQ Service ====================
export const faqService = {
  async getAll(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/faqs');
    return response.data.data;
  },
  async create(data: any): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/faqs', data);
    return response.data.data;
  },
  async update(id: number, data: any): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>(`/faqs/${id}`, data);
    return response.data.data;
  },
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/faqs/${id}`);
  },
};

// ==================== Newsletter Service ====================
export const newsletterService = {
  async subscribe(email: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/newsletter/subscribe', { email });
    return response.data.data;
  },
  async unsubscribe(email: string): Promise<void> {
    await apiClient.post('/newsletter/unsubscribe', { email });
  },
  async getSubscribers(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/newsletter/subscribers');
    return response.data.data;
  },
};

// ==================== CMS Service ====================
export const cmsService = {
  async getPages(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/cms/pages');
    return response.data.data;
  },
  async getPageBySlug(slug: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/cms/pages/${slug}`);
    return response.data.data;
  },
  async create(data: any): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/cms/pages', data);
    return response.data.data;
  },
  async update(id: number, data: any): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>(`/cms/pages/${id}`, data);
    return response.data.data;
  },
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/cms/pages/${id}`);
  },
};

// ==================== Collection Service ====================
export const collectionService = {
  async getAll(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/collections');
    return response.data.data;
  },
  async getBySlug(slug: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/collections/${slug}`);
    return response.data.data;
  },
  async create(data: any): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/collections', data);
    return response.data.data;
  },
  async update(id: number | string, data: any): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>(`/collections/${id}`, data);
    return response.data.data;
  },
  async delete(id: number | string): Promise<void> {
    await apiClient.delete(`/collections/${id}`);
  },
};

// ==================== Gift Card Service ====================
export const giftCardService = {
  async getAll(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/gift-cards');
    return response.data.data;
  },
  async redeem(code: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/gift-cards/${encodeURIComponent(code)}/redeem`);
    return response.data.data;
  },
};

// ==================== Promotion Service ====================
export const promotionService = {
  async getActive(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/promotions');
    return response.data.data;
  },
};

// ==================== Loyalty Service ====================
export const loyaltyService = {
  async getPrograms(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/loyalty/programs');
    return response.data.data;
  },
  async getMembership(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/loyalty/membership');
    return response.data.data;
  },
  async getTransactions(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/loyalty/transactions');
    return response.data.data;
  },
  async join(programId: string | number): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/loyalty/join', { programId });
    return response.data.data;
  },
  async redeem(points: number): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/loyalty/redeem', { points });
    return response.data.data;
  },
};

// ==================== Wallet Service ====================
export const walletService = {
  async getWallet(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/wallet');
    return response.data.data;
  },
  async getTransactions(page = 0, size = 20): Promise<PageResponse<any>> {
    const response = await apiClient.get<ApiResponse<PageResponse<any>>>(`/wallet/transactions?page=${page}&size=${size}`);
    return response.data.data;
  },
  async topUp(data: { amount: number }): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/wallet/top-up', data);
    return response.data.data;
  },
};

// ==================== Subscription Service ====================
export const subscriptionService = {
  async getPlans(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/subscriptions/plans');
    return response.data.data;
  },
  async getMySubscriptions(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/subscriptions/my');
    return response.data.data;
  },
  async subscribe(data: { planId: string | number }): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/subscriptions', data);
    return response.data.data;
  },
  async cancel(): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/subscriptions/cancel');
    return response.data.data;
  },
};

// ==================== Affiliate Service ====================
export const affiliateService = {
  async getPrograms(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/affiliates/programs');
    return response.data.data;
  },
  async getMyAffiliate(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/affiliates/my');
    return response.data.data;
  },
  async getStats(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/affiliates/stats');
    return response.data.data;
  },
  async join(programId: string | number): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/affiliates/join', { programId });
    return response.data.data;
  },
};

// ==================== Return Service ====================
export const returnService = {
  async getMyReturns(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/returns');
    return response.data.data;
  },
  async create(data: any): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/returns', data);
    return response.data.data;
  },
};

// ==================== Warehouse Service ====================
export const warehouseService = {
  async getAll(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/warehouses');
    return response.data.data;
  },
};

// ==================== Analytics Service ====================
export const analyticsService = {
  async getDashboard(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/analytics/dashboard');
    return response.data.data;
  },
  async getAdminDashboard(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/analytics/dashboard');
    return response.data.data;
  },
};

// ==================== Product Question Service ====================
export const productQuestionService = {
  async getByProduct(productId: string): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(`/product-questions/product/${productId}`);
    return response.data.data;
  },
  async create(data: any): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/product-questions', data);
    return response.data.data;
  },
};

// ==================== Admin Service ====================
export const adminService = {
  async getUsers(params?: Record<string, unknown>): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/users', { params });
    return response.data.data;
  },
  async getOrders(params?: Record<string, unknown>): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/orders', { params });
    return response.data.data;
  },
};

// ==================== Recently Viewed Service ====================
export const recentlyViewedService = {
  async addView(productId: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/recently-viewed/${productId}`);
    return response.data.data;
  },
  async getAll(limit = 20): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(`/recently-viewed?limit=${limit}`);
    return response.data.data;
  },
  async clearAll(): Promise<void> {
    await apiClient.delete('/recently-viewed');
  },
  async remove(productId: string): Promise<void> {
    await apiClient.delete(`/recently-viewed/${productId}`);
  },
};

// ==================== Price Alert Service ====================
export const priceAlertService = {
  async create(data: { productId: string; targetPrice: number }): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/price-alerts', data);
    return response.data.data;
  },
  async getAll(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/price-alerts');
    return response.data.data;
  },
  async delete(id: number | string): Promise<void> {
    await apiClient.delete(`/price-alerts/${id}`);
  },
  async deactivate(id: number | string): Promise<void> {
    await apiClient.patch(`/price-alerts/${id}/deactivate`);
  },
};

// ==================== Audit Log Service ====================
export const auditLogService = {
  async getAll(params?: Record<string, unknown>): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/audit-logs', { params });
    return response.data.data;
  },
  async getStats(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/audit-logs/stats');
    return response.data.data;
  },
  async getByEntity(entityType: string, entityId: string): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(`/admin/audit-logs/entity/${entityType}/${entityId}`);
    return response.data.data;
  },
  async getByUser(userId: string): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(`/admin/audit-logs/user/${userId}`);
    return response.data.data;
  },
};

// ==================== Recommendation Service ====================
export const recommendationService = {
  async getPersonalized(limit = 10): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/products/recommendations/personalized?limit=${limit}`);
    return response.data.data;
  },
  async getSimilar(productId: string, limit = 10): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/products/recommendations/similar/${productId}?limit=${limit}`);
    return response.data.data;
  },
  async getTrending(limit = 10): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/products/recommendations/trending?limit=${limit}`);
    return response.data.data;
  },
  async getPopular(limit = 10): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/products/recommendations/popular?limit=${limit}`);
    return response.data.data;
  },
  async getFrequentlyBought(productId: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/products/recommendations/frequently-bought/${productId}`);
    return response.data.data;
  },
  async trackView(productId: string): Promise<void> {
    await apiClient.post('/products/recommendations/track/view', { productId });
  },
  async trackPurchase(productIds: string[]): Promise<void> {
    await apiClient.post('/products/recommendations/track/purchase', { productIds });
  },
  async trackCart(productId: string): Promise<void> {
    await apiClient.post('/products/recommendations/track/cart', { productId });
  },
  async getStats(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/products/recommendations/stats');
    return response.data.data;
  },
};