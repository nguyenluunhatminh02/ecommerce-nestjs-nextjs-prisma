import apiClient from '@/lib/api-client';
import {
    DashboardMetrics, RevenueChart, TopProduct, TopCategory,
    SalesFunnel, CustomerSegment, TrafficSource, Activity,
    FlashSale, CreateFlashSaleRequest, GiftCard, CreateGiftCardRequest,
    LoyaltyProgram, LoyaltyMember, Wallet, WalletTransaction,
    SubscriptionPlan, Subscription, ReturnRequest, Affiliate,
    AffiliateProgram, Promotion, CmsPage, Warehouse, ShippingMethod,
    TaxRule, Collection, Newsletter, FAQ, ProductQuestion, MediaFile,
    SupportTicket, BlogPost, Notification, PaginationParams
} from '@/types/admin';

// ==================== Dashboard Service ====================
export const dashboardService = {
    async getMetrics(period: string = '30d'): Promise<DashboardMetrics> {
        const { data } = await apiClient.get(`/admin/dashboard/metrics?period=${period}`);
        return data;
    },
    async getRevenueChart(period: string = '30d', granularity: string = 'day'): Promise<RevenueChart> {
        const { data } = await apiClient.get(`/admin/dashboard/revenue-chart?period=${period}&granularity=${granularity}`);
        return data;
    },
    async getTopProducts(limit: number = 10): Promise<TopProduct[]> {
        const { data } = await apiClient.get(`/admin/dashboard/top-products?limit=${limit}`);
        return data;
    },
    async getTopCategories(limit: number = 10): Promise<TopCategory[]> {
        const { data } = await apiClient.get(`/admin/dashboard/top-categories?limit=${limit}`);
        return data;
    },
    async getSalesFunnel(period: string = '30d'): Promise<SalesFunnel> {
        const { data } = await apiClient.get(`/admin/dashboard/sales-funnel?period=${period}`);
        return data;
    },
    async getCustomerSegments(): Promise<CustomerSegment[]> {
        const { data } = await apiClient.get('/admin/dashboard/customer-segments');
        return data;
    },
    async getTrafficSources(period: string = '30d'): Promise<TrafficSource[]> {
        const { data } = await apiClient.get(`/admin/dashboard/traffic-sources?period=${period}`);
        return data;
    },
    async getRecentActivity(limit: number = 20): Promise<Activity[]> {
        const { data } = await apiClient.get(`/admin/dashboard/activity?limit=${limit}`);
        return data;
    },
    async getRealtimeStats(): Promise<{ activeUsers: number; ordersToday: number; revenueToday: number }> {
        const { data } = await apiClient.get('/admin/dashboard/realtime');
        return data;
    }
};

// ==================== Admin Products Service ====================
export const adminProductService = {
    async getProducts(params: PaginationParams & Record<string, unknown>) {
        const { data } = await apiClient.get('/admin/products', { params });
        return data;
    },
    async getProduct(id: number) {
        const { data } = await apiClient.get(`/admin/products/${id}`);
        return data;
    },
    async createProduct(productData: FormData) {
        const { data } = await apiClient.post('/admin/products', productData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    async updateProduct(id: number, productData: FormData) {
        const { data } = await apiClient.put(`/admin/products/${id}`, productData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    async deleteProduct(id: number) {
        await apiClient.delete(`/admin/products/${id}`);
    },
    async bulkDelete(ids: number[]) {
        await apiClient.post('/admin/products/bulk-delete', { ids });
    },
    async bulkUpdateStatus(ids: number[], active: boolean) {
        await apiClient.post('/admin/products/bulk-update-status', { ids, active });
    },
    async importProducts(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await apiClient.post('/admin/products/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    async exportProducts(format: string = 'csv') {
        const { data } = await apiClient.get(`/admin/products/export?format=${format}`, {
            responseType: 'blob'
        });
        return data;
    }
};

// ==================== Admin Orders Service ====================
export const adminOrderService = {
    async getOrders(params: PaginationParams & Record<string, unknown>) {
        const { data } = await apiClient.get('/admin/orders', { params });
        return data;
    },
    async getOrder(id: number) {
        const { data } = await apiClient.get(`/admin/orders/${id}`);
        return data;
    },
    async updateOrderStatus(id: number, status: string, note?: string) {
        const { data } = await apiClient.put(`/admin/orders/${id}/status`, { status, note });
        return data;
    },
    async cancelOrder(id: number, reason: string) {
        const { data } = await apiClient.post(`/admin/orders/${id}/cancel`, { reason });
        return data;
    },
    async refundOrder(id: number, amount: number, reason: string) {
        const { data } = await apiClient.post(`/admin/orders/${id}/refund`, { amount, reason });
        return data;
    },
    async assignShipping(id: number, carrier: string, trackingNumber: string) {
        const { data } = await apiClient.put(`/admin/orders/${id}/shipping`, { carrier, trackingNumber });
        return data;
    },
    async addOrderNote(id: number, note: string, internal: boolean = false) {
        const { data } = await apiClient.post(`/admin/orders/${id}/notes`, { note, internal });
        return data;
    },
    async exportOrders(params: Record<string, unknown>) {
        const { data } = await apiClient.get('/admin/orders/export', { params, responseType: 'blob' });
        return data;
    },
    async getOrderStats() {
        const { data } = await apiClient.get('/admin/orders/stats');
        return data;
    }
};

// ==================== Admin Users Service ====================
export const adminUserService = {
    async getUsers(params: PaginationParams & Record<string, unknown>) {
        const { data } = await apiClient.get('/admin/users', { params });
        return data;
    },
    async getUser(id: number) {
        const { data } = await apiClient.get(`/admin/users/${id}`);
        return data;
    },
    async createUser(userData: Record<string, unknown>) {
        const { data } = await apiClient.post('/admin/users', userData);
        return data;
    },
    async updateUser(id: number, userData: Record<string, unknown>) {
        const { data } = await apiClient.put(`/admin/users/${id}`, userData);
        return data;
    },
    async deleteUser(id: number) {
        await apiClient.delete(`/admin/users/${id}`);
    },
    async toggleUserStatus(id: number) {
        const { data } = await apiClient.put(`/admin/users/${id}/toggle-status`);
        return data;
    },
    async verifyUser(id: number) {
        const { data } = await apiClient.put(`/admin/users/${id}/verify`);
        return data;
    },
    async resetPassword(id: number) {
        const { data } = await apiClient.post(`/admin/users/${id}/reset-password`);
        return data;
    },
    async getUserStats() {
        const { data } = await apiClient.get('/admin/users/stats');
        return data;
    },
    async exportUsers(format: string = 'csv') {
        const { data } = await apiClient.get(`/admin/users/export?format=${format}`, {
            responseType: 'blob'
        });
        return data;
    }
};

// ==================== Admin Categories Service ====================
export const adminCategoryService = {
    async getCategories(params?: PaginationParams & Record<string, unknown>) {
        const { data } = await apiClient.get('/admin/categories', { params });
        return data;
    },
    async getCategory(id: number) {
        const { data } = await apiClient.get(`/admin/categories/${id}`);
        return data;
    },
    async createCategory(categoryData: FormData) {
        const { data } = await apiClient.post('/admin/categories', categoryData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    async updateCategory(id: number, categoryData: FormData) {
        const { data } = await apiClient.put(`/admin/categories/${id}`, categoryData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    async deleteCategory(id: number) {
        await apiClient.delete(`/admin/categories/${id}`);
    },
    async reorderCategories(orderedIds: number[]) {
        await apiClient.post('/admin/categories/reorder', { orderedIds });
    },
    async getCategoryTree() {
        const { data } = await apiClient.get('/admin/categories/tree');
        return data;
    }
};

// ==================== Flash Sale Service ====================
export const flashSaleService = {
    async getFlashSales(params?: PaginationParams) {
        const { data } = await apiClient.get('/flash-sales', { params });
        return data;
    },
    async getFlashSale(id: number): Promise<FlashSale> {
        const { data } = await apiClient.get(`/flash-sales/${id}`);
        return data;
    },
    async createFlashSale(request: CreateFlashSaleRequest): Promise<FlashSale> {
        const { data } = await apiClient.post('/flash-sales', request);
        return data;
    },
    async updateFlashSale(id: number, request: Partial<CreateFlashSaleRequest>): Promise<FlashSale> {
        const { data } = await apiClient.put(`/flash-sales/${id}`, request);
        return data;
    },
    async deleteFlashSale(id: number) {
        await apiClient.delete(`/flash-sales/${id}`);
    },
    async getActiveFlashSales(): Promise<FlashSale[]> {
        const { data } = await apiClient.get('/flash-sales/active');
        return data;
    },
    async getUpcomingFlashSales(): Promise<FlashSale[]> {
        const { data } = await apiClient.get('/flash-sales/upcoming');
        return data;
    }
};

// ==================== Gift Card Service ====================
export const giftCardService = {
    async getGiftCards(params?: PaginationParams & Record<string, unknown>) {
        const { data } = await apiClient.get('/gift-cards', { params });
        return data;
    },
    async getGiftCard(id: number): Promise<GiftCard> {
        const { data } = await apiClient.get(`/gift-cards/${id}`);
        return data;
    },
    async createGiftCard(request: CreateGiftCardRequest): Promise<GiftCard> {
        const { data } = await apiClient.post('/gift-cards', request);
        return data;
    },
    async createBatchGiftCards(count: number, request: CreateGiftCardRequest): Promise<GiftCard[]> {
        const { data } = await apiClient.post(`/gift-cards/batch?count=${count}`, request);
        return data;
    },
    async disableGiftCard(id: number) {
        const { data } = await apiClient.put(`/gift-cards/${id}/disable`);
        return data;
    },
    async checkBalance(code: string): Promise<{ balance: number }> {
        const { data } = await apiClient.get(`/gift-cards/balance/${code}`);
        return data;
    }
};

// ==================== Loyalty Service ====================
export const loyaltyService = {
    async getPrograms(): Promise<LoyaltyProgram[]> {
        const { data } = await apiClient.get('/loyalty/programs');
        return data;
    },
    async getProgram(id: number): Promise<LoyaltyProgram> {
        const { data } = await apiClient.get(`/loyalty/programs/${id}`);
        return data;
    },
    async createProgram(programData: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
        const { data } = await apiClient.post('/loyalty/programs', programData);
        return data;
    },
    async updateProgram(id: number, programData: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
        const { data } = await apiClient.put(`/loyalty/programs/${id}`, programData);
        return data;
    },
    async getMembers(params?: PaginationParams & Record<string, unknown>) {
        const { data } = await apiClient.get('/loyalty/members', { params });
        return data;
    },
    async getMember(id: number): Promise<LoyaltyMember> {
        const { data } = await apiClient.get(`/loyalty/members/${id}`);
        return data;
    },
    async adjustPoints(memberId: number, points: number, description: string) {
        const { data } = await apiClient.post(`/loyalty/members/${memberId}/adjust-points`, { points, description });
        return data;
    }
};

// ==================== Wallet Service ====================
export const walletService = {
    async getWallets(params?: PaginationParams & Record<string, unknown>) {
        const { data } = await apiClient.get('/wallets', { params });
        return data;
    },
    async getWallet(id: number): Promise<Wallet> {
        const { data } = await apiClient.get(`/wallets/${id}`);
        return data;
    },
    async getMyWallet(): Promise<Wallet> {
        const { data } = await apiClient.get('/wallets/me');
        return data;
    },
    async deposit(amount: number, paymentMethod: string) {
        const { data } = await apiClient.post('/wallets/deposit', { amount, paymentMethod });
        return data;
    },
    async withdraw(amount: number, bankAccount: string) {
        const { data } = await apiClient.post('/wallets/withdraw', { amount, bankAccount });
        return data;
    },
    async getTransactions(params?: PaginationParams) {
        const { data } = await apiClient.get('/wallets/transactions', { params });
        return data;
    },
    async freezeWallet(id: number, reason: string) {
        const { data } = await apiClient.post(`/wallets/${id}/freeze`, { reason });
        return data;
    },
    async unfreezeWallet(id: number) {
        const { data } = await apiClient.post(`/wallets/${id}/unfreeze`);
        return data;
    }
};

// ==================== Subscription Service ====================
export const subscriptionService = {
    async getPlans(): Promise<SubscriptionPlan[]> {
        const { data } = await apiClient.get('/subscriptions/plans');
        return data;
    },
    async getPlan(id: number): Promise<SubscriptionPlan> {
        const { data } = await apiClient.get(`/subscriptions/plans/${id}`);
        return data;
    },
    async createPlan(planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
        const { data } = await apiClient.post('/subscriptions/plans', planData);
        return data;
    },
    async updatePlan(id: number, planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
        const { data } = await apiClient.put(`/subscriptions/plans/${id}`, planData);
        return data;
    },
    async getSubscriptions(params?: PaginationParams & Record<string, unknown>) {
        const { data } = await apiClient.get('/subscriptions', { params });
        return data;
    },
    async getSubscription(id: number): Promise<Subscription> {
        const { data } = await apiClient.get(`/subscriptions/${id}`);
        return data;
    },
    async subscribe(planId: number, paymentMethod: string): Promise<Subscription> {
        const { data } = await apiClient.post('/subscriptions/subscribe', { planId, paymentMethod });
        return data;
    },
    async cancelSubscription(id: number, reason?: string) {
        const { data } = await apiClient.post(`/subscriptions/${id}/cancel`, { reason });
        return data;
    },
    async pauseSubscription(id: number) {
        const { data } = await apiClient.post(`/subscriptions/${id}/pause`);
        return data;
    },
    async resumeSubscription(id: number) {
        const { data } = await apiClient.post(`/subscriptions/${id}/resume`);
        return data;
    }
};

// ==================== Return Service ====================
export const returnService = {
    async getReturns(params?: PaginationParams & Record<string, unknown>) {
        const { data } = await apiClient.get('/returns', { params });
        return data;
    },
    async getReturn(id: number): Promise<ReturnRequest> {
        const { data } = await apiClient.get(`/returns/${id}`);
        return data;
    },
    async createReturn(orderId: number, items: ReturnRequest['items'], reason: string, description?: string): Promise<ReturnRequest> {
        const { data } = await apiClient.post('/returns', { orderId, items, reason, description });
        return data;
    },
    async approveReturn(id: number, note?: string) {
        const { data } = await apiClient.post(`/returns/${id}/approve`, { note });
        return data;
    },
    async rejectReturn(id: number, reason: string) {
        const { data } = await apiClient.post(`/returns/${id}/reject`, { reason });
        return data;
    },
    async processRefund(id: number, amount: number, method: string) {
        const { data } = await apiClient.post(`/returns/${id}/refund`, { amount, method });
        return data;
    }
};

// ==================== Affiliate Service ====================
export const affiliateService = {
    async getPrograms(): Promise<AffiliateProgram[]> {
        const { data } = await apiClient.get('/affiliates/programs');
        return data;
    },
    async getProgram(id: number): Promise<AffiliateProgram> {
        const { data } = await apiClient.get(`/affiliates/programs/${id}`);
        return data;
    },
    async createProgram(programData: Partial<AffiliateProgram>): Promise<AffiliateProgram> {
        const { data } = await apiClient.post('/affiliates/programs', programData);
        return data;
    },
    async getAffiliates(params?: PaginationParams & Record<string, unknown>) {
        const { data } = await apiClient.get('/affiliates', { params });
        return data;
    },
    async getAffiliate(id: number): Promise<Affiliate> {
        const { data } = await apiClient.get(`/affiliates/${id}`);
        return data;
    },
    async approveAffiliate(id: number) {
        const { data } = await apiClient.post(`/affiliates/${id}/approve`);
        return data;
    },
    async rejectAffiliate(id: number, reason: string) {
        const { data } = await apiClient.post(`/affiliates/${id}/reject`, { reason });
        return data;
    },
    async getPayouts(params?: PaginationParams) {
        const { data } = await apiClient.get('/affiliates/payouts', { params });
        return data;
    },
    async processPayout(affiliateId: number, amount: number) {
        const { data } = await apiClient.post(`/affiliates/${affiliateId}/payout`, { amount });
        return data;
    }
};

// ==================== Promotion Service ====================
export const promotionService = {
    async getPromotions(params?: PaginationParams & Record<string, unknown>) {
        const { data } = await apiClient.get('/promotions', { params });
        return data;
    },
    async getPromotion(id: number): Promise<Promotion> {
        const { data } = await apiClient.get(`/promotions/${id}`);
        return data;
    },
    async createPromotion(promotionData: Partial<Promotion>): Promise<Promotion> {
        const { data } = await apiClient.post('/promotions', promotionData);
        return data;
    },
    async updatePromotion(id: number, promotionData: Partial<Promotion>): Promise<Promotion> {
        const { data } = await apiClient.put(`/promotions/${id}`, promotionData);
        return data;
    },
    async deletePromotion(id: number) {
        await apiClient.delete(`/promotions/${id}`);
    },
    async togglePromotion(id: number) {
        const { data } = await apiClient.put(`/promotions/${id}/toggle`);
        return data;
    }
};

// ==================== CMS Service ====================
export const cmsService = {
    async getPages(params?: PaginationParams & Record<string, unknown>) {
        const { data } = await apiClient.get('/cms/pages', { params });
        return data;
    },
    async getPage(id: number): Promise<CmsPage> {
        const { data } = await apiClient.get(`/cms/pages/${id}`);
        return data;
    },
    async getPageBySlug(slug: string): Promise<CmsPage> {
        const { data } = await apiClient.get(`/cms/pages/slug/${slug}`);
        return data;
    },
    async createPage(pageData: Partial<CmsPage>): Promise<CmsPage> {
        const { data } = await apiClient.post('/cms/pages', pageData);
        return data;
    },
    async updatePage(id: number, pageData: Partial<CmsPage>): Promise<CmsPage> {
        const { data } = await apiClient.put(`/cms/pages/${id}`, pageData);
        return data;
    },
    async deletePage(id: number) {
        await apiClient.delete(`/cms/pages/${id}`);
    },
    async publishPage(id: number) {
        const { data } = await apiClient.put(`/cms/pages/${id}/publish`);
        return data;
    },
    async unpublishPage(id: number) {
        const { data } = await apiClient.put(`/cms/pages/${id}/unpublish`);
        return data;
    }
};

// ==================== Warehouse Service ====================
export const warehouseService = {
    async getWarehouses(params?: PaginationParams) {
        const { data } = await apiClient.get('/warehouses', { params });
        return data;
    },
    async getWarehouse(id: number): Promise<Warehouse> {
        const { data } = await apiClient.get(`/warehouses/${id}`);
        return data;
    },
    async createWarehouse(warehouseData: Partial<Warehouse>): Promise<Warehouse> {
        const { data } = await apiClient.post('/warehouses', warehouseData);
        return data;
    },
    async updateWarehouse(id: number, warehouseData: Partial<Warehouse>): Promise<Warehouse> {
        const { data } = await apiClient.put(`/warehouses/${id}`, warehouseData);
        return data;
    },
    async deleteWarehouse(id: number) {
        await apiClient.delete(`/warehouses/${id}`);
    },
    async getInventory(warehouseId: number, params?: PaginationParams) {
        const { data } = await apiClient.get(`/warehouses/${warehouseId}/inventory`, { params });
        return data;
    },
    async updateInventory(warehouseId: number, productId: number, quantity: number) {
        const { data } = await apiClient.put(`/warehouses/${warehouseId}/inventory/${productId}`, { quantity });
        return data;
    },
    async transferStock(fromWarehouseId: number, toWarehouseId: number, productId: number, quantity: number) {
        const { data } = await apiClient.post('/warehouses/transfer', { fromWarehouseId, toWarehouseId, productId, quantity });
        return data;
    }
};

// ==================== Shipping & Tax Service ====================
export const shippingTaxService = {
    async getShippingMethods(): Promise<ShippingMethod[]> {
        const { data } = await apiClient.get('/shipping/methods');
        return data;
    },
    async createShippingMethod(methodData: Partial<ShippingMethod>): Promise<ShippingMethod> {
        const { data } = await apiClient.post('/shipping/methods', methodData);
        return data;
    },
    async updateShippingMethod(id: number, methodData: Partial<ShippingMethod>): Promise<ShippingMethod> {
        const { data } = await apiClient.put(`/shipping/methods/${id}`, methodData);
        return data;
    },
    async deleteShippingMethod(id: number) {
        await apiClient.delete(`/shipping/methods/${id}`);
    },
    async calculateShipping(methodId: number, weight: number, origin: string, destination: string) {
        const { data } = await apiClient.post('/shipping/calculate', { methodId, weight, origin, destination });
        return data;
    },
    async getTaxRules(): Promise<TaxRule[]> {
        const { data } = await apiClient.get('/tax/rules');
        return data;
    },
    async createTaxRule(ruleData: Partial<TaxRule>): Promise<TaxRule> {
        const { data } = await apiClient.post('/tax/rules', ruleData);
        return data;
    },
    async updateTaxRule(id: number, ruleData: Partial<TaxRule>): Promise<TaxRule> {
        const { data } = await apiClient.put(`/tax/rules/${id}`, ruleData);
        return data;
    },
    async deleteTaxRule(id: number) {
        await apiClient.delete(`/tax/rules/${id}`);
    },
    async calculateTax(country: string, state: string, amount: number, category?: string) {
        const { data } = await apiClient.post('/tax/calculate', { country, state, amount, category });
        return data;
    }
};

// ==================== Collection Service ====================
export const collectionService = {
    async getCollections(params?: PaginationParams) {
        const { data } = await apiClient.get('/collections', { params });
        return data;
    },
    async getCollection(id: number): Promise<Collection> {
        const { data } = await apiClient.get(`/collections/${id}`);
        return data;
    },
    async createCollection(collectionData: Partial<Collection>): Promise<Collection> {
        const { data } = await apiClient.post('/collections', collectionData);
        return data;
    },
    async updateCollection(id: number, collectionData: Partial<Collection>): Promise<Collection> {
        const { data } = await apiClient.put(`/collections/${id}`, collectionData);
        return data;
    },
    async deleteCollection(id: number) {
        await apiClient.delete(`/collections/${id}`);
    },
    async addProducts(collectionId: number, productIds: number[]) {
        await apiClient.post(`/collections/${collectionId}/products`, { productIds });
    },
    async removeProducts(collectionId: number, productIds: number[]) {
        await apiClient.delete(`/collections/${collectionId}/products`, { data: { productIds } });
    }
};

// ==================== Newsletter Service ====================
export const newsletterService = {
    async getSubscribers(params?: PaginationParams & Record<string, unknown>) {
        const { data } = await apiClient.get('/newsletter/subscribers', { params });
        return data;
    },
    async subscribe(email: string, name?: string): Promise<Newsletter> {
        const { data } = await apiClient.post('/newsletter/subscribe', { email, name });
        return data;
    },
    async unsubscribe(email: string) {
        await apiClient.post('/newsletter/unsubscribe', { email });
    },
    async getCount(): Promise<{ count: number }> {
        const { data } = await apiClient.get('/newsletter/count');
        return data;
    },
    async exportSubscribers() {
        const { data } = await apiClient.get('/newsletter/export', { responseType: 'blob' });
        return data;
    }
};

// ==================== FAQ Service ====================
export const faqService = {
    async getFaqs(params?: PaginationParams & { category?: string }) {
        const { data } = await apiClient.get('/faqs', { params });
        return data;
    },
    async getFaq(id: number): Promise<FAQ> {
        const { data } = await apiClient.get(`/faqs/${id}`);
        return data;
    },
    async createFaq(faqData: Partial<FAQ>): Promise<FAQ> {
        const { data } = await apiClient.post('/faqs', faqData);
        return data;
    },
    async updateFaq(id: number, faqData: Partial<FAQ>): Promise<FAQ> {
        const { data } = await apiClient.put(`/faqs/${id}`, faqData);
        return data;
    },
    async deleteFaq(id: number) {
        await apiClient.delete(`/faqs/${id}`);
    },
    async getCategories(): Promise<string[]> {
        const { data } = await apiClient.get('/faqs/categories');
        return data;
    },
    async searchFaqs(query: string): Promise<FAQ[]> {
        const { data } = await apiClient.get(`/faqs/search?q=${query}`);
        return data;
    },
    async markHelpful(id: number) {
        await apiClient.post(`/faqs/${id}/helpful`);
    },
    async markNotHelpful(id: number) {
        await apiClient.post(`/faqs/${id}/not-helpful`);
    }
};

// ==================== Support Service ====================
export const supportService = {
    async getTickets(params?: PaginationParams & Record<string, unknown>) {
        const { data } = await apiClient.get('/support/tickets', { params });
        return data;
    },
    async getTicket(id: number): Promise<SupportTicket> {
        const { data } = await apiClient.get(`/support/tickets/${id}`);
        return data;
    },
    async createTicket(ticketData: { subject: string; description: string; category: string; priority: string }): Promise<SupportTicket> {
        const { data } = await apiClient.post('/support/tickets', ticketData);
        return data;
    },
    async updateTicketStatus(id: number, status: string) {
        const { data } = await apiClient.put(`/support/tickets/${id}/status`, { status });
        return data;
    },
    async assignTicket(id: number, userId: number) {
        const { data } = await apiClient.put(`/support/tickets/${id}/assign`, { userId });
        return data;
    },
    async addMessage(id: number, message: string, attachments?: File[]) {
        const formData = new FormData();
        formData.append('message', message);
        attachments?.forEach(f => formData.append('attachments', f));
        const { data } = await apiClient.post(`/support/tickets/${id}/messages`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    }
};

// ==================== Media Service ====================
export const mediaService = {
    async getFiles(params?: PaginationParams & { folder?: string; type?: string }) {
        const { data } = await apiClient.get('/media', { params });
        return data;
    },
    async uploadFile(file: File, folder?: string, altText?: string): Promise<MediaFile> {
        const formData = new FormData();
        formData.append('file', file);
        if (folder) formData.append('folder', folder);
        if (altText) formData.append('altText', altText);
        const { data } = await apiClient.post('/media/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    async uploadMultiple(files: File[], folder?: string): Promise<MediaFile[]> {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        if (folder) formData.append('folder', folder);
        const { data } = await apiClient.post('/media/upload-multiple', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    async deleteFile(id: number) {
        await apiClient.delete(`/media/${id}`);
    },
    async updateFile(id: number, updates: { altText?: string; title?: string }) {
        const { data } = await apiClient.put(`/media/${id}`, updates);
        return data;
    },
    async getFolders(): Promise<string[]> {
        const { data } = await apiClient.get('/media/folders');
        return data;
    },
    async createFolder(name: string) {
        const { data } = await apiClient.post('/media/folders', { name });
        return data;
    }
};

// ==================== Blog Service ====================
export const blogService = {
    async getPosts(params?: PaginationParams & Record<string, unknown>) {
        const { data } = await apiClient.get('/blog/posts', { params });
        return data;
    },
    async getPost(id: number): Promise<BlogPost> {
        const { data } = await apiClient.get(`/blog/posts/${id}`);
        return data;
    },
    async getPostBySlug(slug: string): Promise<BlogPost> {
        const { data } = await apiClient.get(`/blog/posts/slug/${slug}`);
        return data;
    },
    async createPost(postData: FormData): Promise<BlogPost> {
        const { data } = await apiClient.post('/blog/posts', postData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    async updatePost(id: number, postData: FormData): Promise<BlogPost> {
        const { data } = await apiClient.put(`/blog/posts/${id}`, postData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    },
    async deletePost(id: number) {
        await apiClient.delete(`/blog/posts/${id}`);
    },
    async publishPost(id: number) {
        const { data } = await apiClient.put(`/blog/posts/${id}/publish`);
        return data;
    },
    async getCategories(): Promise<string[]> {
        const { data } = await apiClient.get('/blog/categories');
        return data;
    },
    async getTags(): Promise<string[]> {
        const { data } = await apiClient.get('/blog/tags');
        return data;
    }
};

// ==================== Notification Service ====================
export const notificationService = {
    async getNotifications(params?: PaginationParams): Promise<Notification[]> {
        const { data } = await apiClient.get('/notifications', { params });
        return data;
    },
    async getUnreadCount(): Promise<{ count: number }> {
        const { data } = await apiClient.get('/notifications/unread-count');
        return data;
    },
    async markAsRead(id: number) {
        await apiClient.put(`/notifications/${id}/read`);
    },
    async markAllAsRead() {
        await apiClient.put('/notifications/read-all');
    },
    async deleteNotification(id: number) {
        await apiClient.delete(`/notifications/${id}`);
    }
};

// ==================== Product Question Service ====================
export const productQuestionService = {
    async getQuestions(params?: PaginationParams & { productId?: number; status?: string }) {
        const { data } = await apiClient.get('/product-questions', { params });
        return data;
    },
    async getQuestion(id: number): Promise<ProductQuestion> {
        const { data } = await apiClient.get(`/product-questions/${id}`);
        return data;
    },
    async askQuestion(productId: number, question: string): Promise<ProductQuestion> {
        const { data } = await apiClient.post('/product-questions', { productId, question });
        return data;
    },
    async answerQuestion(id: number, answer: string) {
        const { data } = await apiClient.post(`/product-questions/${id}/answer`, { answer });
        return data;
    },
    async approveQuestion(id: number) {
        const { data } = await apiClient.put(`/product-questions/${id}/approve`);
        return data;
    },
    async rejectQuestion(id: number) {
        const { data } = await apiClient.put(`/product-questions/${id}/reject`);
        return data;
    }
};
