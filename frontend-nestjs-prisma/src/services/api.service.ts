import apiClient from '@/lib/api-client';
import {
  ApiResponse,
  PageResponse,
  UserResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  AddressResponse,
  AddressRequest,
  WishlistItemResponse,
  NotificationResponse,
  CategoryResponse,
  BrandResponse,
  ShopResponse,
  CreateShopRequest,
  CouponResponse,
  BlogPostResponse,
  BlogCategoryResponse,
  SupportTicketResponse,
  ChatRoomResponse,
  ChatMessageResponse,
  DashboardStats,
  SellerDashboardStats,
  BannerResponse,
  PaymentIntentResponse,
  FlashSaleResponse,
  ShippingMethodResponse,
} from '@/types';
import { generateQueryString } from '@/lib/utils';

// ==================== User Service ====================
export const userService = {
  async updateProfile(data: UpdateProfileRequest): Promise<UserResponse> {
    const response = await apiClient.put<ApiResponse<UserResponse>>('/users/me', data);
    return response.data.data;
  },
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.put('/users/me/password', data);
  },
  async getAllUsers(params?: { keyword?: string; role?: string; page?: number; size?: number }): Promise<PageResponse<UserResponse>> {
    const query = generateQueryString((params || {}) as Record<string, unknown>);
    const response = await apiClient.get<ApiResponse<PageResponse<UserResponse>>>(`/users?${query}`);
    return response.data.data;
  },
  async getUserById(id: string): Promise<UserResponse> {
    const response = await apiClient.get<ApiResponse<UserResponse>>(`/users/id/${id}`);
    return response.data.data;
  },
  async toggleUserStatus(id: string): Promise<void> {
    await apiClient.put(`/users/${id}/toggle-status`);
  },
  async updateUserRole(id: string, role: string): Promise<void> {
    await apiClient.put(`/users/${id}/role?role=${role}`);
  },
};

// ==================== Address Service ====================
export const addressService = {
  async getAddresses(): Promise<AddressResponse[]> {
    const response = await apiClient.get<ApiResponse<AddressResponse[]>>('/addresses');
    return response.data.data;
  },
  async getAddressById(id: string): Promise<AddressResponse> {
    const response = await apiClient.get<ApiResponse<AddressResponse>>(`/addresses/${id}`);
    return response.data.data;
  },
  async createAddress(data: AddressRequest): Promise<AddressResponse> {
    const response = await apiClient.post<ApiResponse<AddressResponse>>('/addresses', data);
    return response.data.data;
  },
  async updateAddress(id: string, data: AddressRequest): Promise<AddressResponse> {
    const response = await apiClient.put<ApiResponse<AddressResponse>>(`/addresses/${id}`, data);
    return response.data.data;
  },
  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(`/addresses/${id}`);
  },
  async setDefaultAddress(id: string): Promise<void> {
    await apiClient.put(`/addresses/${id}/default`);
  },
  async getDefaultAddress(): Promise<AddressResponse> {
    const response = await apiClient.get<ApiResponse<AddressResponse>>('/addresses/default');
    return response.data.data;
  },
};

// ==================== Category Service ====================
export const categoryService = {
  async getAll(): Promise<CategoryResponse[]> {
    const response = await apiClient.get<ApiResponse<CategoryResponse[]>>('/categories');
    return response.data.data;
  },
  async getById(id: string): Promise<CategoryResponse> {
    const response = await apiClient.get<ApiResponse<CategoryResponse>>(`/categories/${id}`);
    return response.data.data;
  },
  async getBySlug(slug: string): Promise<CategoryResponse> {
    const response = await apiClient.get<ApiResponse<CategoryResponse>>(`/categories/slug/${slug}`);
    return response.data.data;
  },
  async getRootCategories(): Promise<CategoryResponse[]> {
    const response = await apiClient.get<ApiResponse<CategoryResponse[]>>('/categories/root');
    return response.data.data;
  },
  async getFeatured(): Promise<CategoryResponse[]> {
    const response = await apiClient.get<ApiResponse<CategoryResponse[]>>('/categories/featured');
    return response.data.data;
  },
  async create(data: any): Promise<CategoryResponse> {
    const response = await apiClient.post<ApiResponse<CategoryResponse>>('/categories', data);
    return response.data.data;
  },
  async update(id: string, data: any): Promise<CategoryResponse> {
    const response = await apiClient.put<ApiResponse<CategoryResponse>>(`/categories/${id}`, data);
    return response.data.data;
  },
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};

// ==================== Brand Service ====================
export const brandService = {
  async getAll(): Promise<BrandResponse[]> {
    const response = await apiClient.get<ApiResponse<BrandResponse[]>>('/brands');
    return response.data.data;
  },
  async getById(id: string): Promise<BrandResponse> {
    const response = await apiClient.get<ApiResponse<BrandResponse>>(`/brands/${id}`);
    return response.data.data;
  },
  async search(keyword: string, page = 0, size = 10): Promise<PageResponse<BrandResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<BrandResponse>>>(
      `/brands/search?keyword=${keyword}&page=${page}&size=${size}`
    );
    return response.data.data;
  },
  async create(data: any): Promise<BrandResponse> {
    const response = await apiClient.post<ApiResponse<BrandResponse>>('/brands', data);
    return response.data.data;
  },
  async update(id: string, data: any): Promise<BrandResponse> {
    const response = await apiClient.put<ApiResponse<BrandResponse>>(`/brands/${id}`, data);
    return response.data.data;
  },
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/brands/${id}`);
  },
};

// ==================== Shop Service ====================
export const shopService = {
  async getBySlug(slug: string): Promise<ShopResponse> {
    const response = await apiClient.get<ApiResponse<ShopResponse>>(`/shops/slug/${slug}`);
    return response.data.data;
  },
  async getMyShop(): Promise<ShopResponse> {
    const response = await apiClient.get<ApiResponse<ShopResponse>>('/shops/my-shop');
    return response.data.data;
  },
  async createShop(data: CreateShopRequest): Promise<ShopResponse> {
    const response = await apiClient.post<ApiResponse<ShopResponse>>('/shops', data);
    return response.data.data;
  },
  async updateShop(id: string, data: Partial<CreateShopRequest>): Promise<ShopResponse> {
    const response = await apiClient.put<ApiResponse<ShopResponse>>(`/shops/${id}`, data);
    return response.data.data;
  },
  async search(keyword: string, page = 0, size = 10): Promise<PageResponse<ShopResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<ShopResponse>>>(
      `/shops/search?keyword=${keyword}&page=${page}&size=${size}`
    );
    return response.data.data;
  },
  async getTopShops(limit = 10): Promise<ShopResponse[]> {
    const response = await apiClient.get<ApiResponse<ShopResponse[]>>(`/shops/top?limit=${limit}`);
    return response.data.data;
  },
  async followShop(shopId: string): Promise<void> {
    await apiClient.post(`/shops/${shopId}/follow`);
  },
  async unfollowShop(shopId: string): Promise<void> {
    await apiClient.delete(`/shops/${shopId}/follow`);
  },
};

// ==================== Wishlist Service ====================
export const wishlistService = {
  async getWishlist(page = 0, size = 20): Promise<PageResponse<WishlistItemResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<WishlistItemResponse>>>(
      `/wishlist?page=${page}&size=${size}`
    );
    return response.data.data;
  },
  async addToWishlist(productId: string): Promise<void> {
    await apiClient.post(`/wishlist/${productId}`);
  },
  async removeFromWishlist(productId: string): Promise<void> {
    await apiClient.delete(`/wishlist/${productId}`);
  },
  async toggleWishlist(productId: string): Promise<boolean> {
    const response = await apiClient.post<ApiResponse<boolean>>(`/wishlist/${productId}/toggle`);
    return response.data.data;
  },
  async checkInWishlist(productId: string): Promise<boolean> {
    const response = await apiClient.get<ApiResponse<boolean>>(`/wishlist/check/${productId}`);
    return response.data.data;
  },
  async getWishlistCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<number>>('/wishlist/count');
    return response.data.data;
  },
  async clearWishlist(): Promise<void> {
    await apiClient.delete('/wishlist');
  },
};

// ==================== Notification Service ====================
export const notificationService = {
  async getNotifications(page = 0, size = 20): Promise<PageResponse<NotificationResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<NotificationResponse>>>(
      `/notifications?page=${page}&size=${size}`
    );
    return response.data.data;
  },
  async getUnreadNotifications(page = 0, size = 20): Promise<PageResponse<NotificationResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<NotificationResponse>>>(
      `/notifications/unread?page=${page}&size=${size}`
    );
    return response.data.data;
  },
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<number>>('/notifications/unread/count');
    return response.data.data;
  },
  async markAsRead(id: string): Promise<void> {
    await apiClient.put(`/notifications/${id}/read`);
  },
  async markAllAsRead(): Promise<void> {
    await apiClient.put('/notifications/read-all');
  },
  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },
};

// ==================== Coupon Service ====================
export const couponService = {
  async validateCoupon(code: string, orderAmount: number): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/coupons/validate?code=${encodeURIComponent(code)}&orderTotal=${orderAmount}`
    );
    return response.data.data;
  },
  async getActiveCoupons(page = 0, size = 10): Promise<PageResponse<CouponResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<CouponResponse>>>(
      `/coupons/active?page=${page}&size=${size}`
    );
    return response.data.data;
  },
  async create(data: any): Promise<CouponResponse> {
    const response = await apiClient.post<ApiResponse<CouponResponse>>('/coupons', data);
    return response.data.data;
  },
  async update(id: string, data: any): Promise<CouponResponse> {
    const response = await apiClient.put<ApiResponse<CouponResponse>>(`/coupons/${id}`, data);
    return response.data.data;
  },
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/coupons/${id}`);
  },
  async toggle(id: string): Promise<void> {
    await apiClient.put(`/coupons/${id}/toggle`);
  },
};

// ==================== Payment Service ====================
export const paymentService = {
  async getMethods(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/payments/methods');
    return response.data.data;
  },
  async createPaymentIntent(orderId: string): Promise<PaymentIntentResponse> {
    const response = await apiClient.post<ApiResponse<PaymentIntentResponse>>(
      `/payments/create-intent/${orderId}`
    );
    return response.data.data;
  },
  async confirmPayment(paymentIntentId: string): Promise<void> {
    await apiClient.post(`/payments/confirm?paymentIntentId=${encodeURIComponent(paymentIntentId)}`);
  },
  async confirmCOD(orderId: string): Promise<void> {
    await apiClient.post(`/payments/cod/${orderId}`);
  },
  async confirmBankTransfer(orderId: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/payments/bank-transfer/${orderId}`);
    return response.data.data;
  },
  async requestRefund(orderId: string, amount: number, reason?: string): Promise<void> {
    const params = new URLSearchParams({ amount: amount.toString() });
    if (reason) {
      params.set('reason', reason);
    }
    await apiClient.post(`/payments/refund/${orderId}?${params.toString()}`);
  },
};

// ==================== Chat Service ====================
export const chatService = {
  async getMyRooms(): Promise<ChatRoomResponse[]> {
    const response = await apiClient.get<ApiResponse<ChatRoomResponse[]>>('/chat/rooms');
    return response.data.data;
  },
  async getOrCreateRoom(shopId: string): Promise<ChatRoomResponse> {
    const response = await apiClient.post<ApiResponse<ChatRoomResponse>>(
      `/chat/rooms?shopId=${shopId}`
    );
    return response.data.data;
  },
  async getRoomMessages(roomId: string, page = 0, size = 50): Promise<PageResponse<ChatMessageResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<ChatMessageResponse>>>(
      `/chat/rooms/${roomId}/messages?page=${page}&size=${size}`
    );
    return response.data.data;
  },
  async sendMessage(roomId: string, content: string, imageUrl?: string): Promise<ChatMessageResponse> {
    const params = new URLSearchParams({ content });
    if (imageUrl) {
      params.set('type', 'IMAGE');
    }
    const response = await apiClient.post<ApiResponse<ChatMessageResponse>>(
      `/chat/rooms/${roomId}/messages?${params.toString()}`
    );
    return response.data.data;
  },
  async markAsRead(roomId: string): Promise<void> {
    await apiClient.put(`/chat/rooms/${roomId}/read`);
  },
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<number>>('/chat/unread-count');
    return response.data.data;
  },
};

// ==================== Blog Service ====================
export const blogService = {
  async getPosts(page = 0, size = 10): Promise<PageResponse<BlogPostResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<BlogPostResponse>>>(
      `/blog/posts?page=${page}&size=${size}`
    );
    return response.data.data;
  },
  async getPostBySlug(slug: string): Promise<BlogPostResponse> {
    const response = await apiClient.get<ApiResponse<BlogPostResponse>>(`/blog/posts/slug/${slug}`);
    return response.data.data;
  },
  async getFeaturedPosts(size = 5): Promise<PageResponse<BlogPostResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<BlogPostResponse>>>(
      `/blog/posts/featured?size=${size}`
    );
    return response.data.data;
  },
  async searchPosts(keyword: string, page = 0, size = 10): Promise<PageResponse<BlogPostResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<BlogPostResponse>>>(
      `/blog/posts/search?keyword=${keyword}&page=${page}&size=${size}`
    );
    return response.data.data;
  },
  async getCategories(): Promise<BlogCategoryResponse[]> {
    const response = await apiClient.get<ApiResponse<BlogCategoryResponse[]>>('/blog/categories');
    return response.data.data;
  },
  async getPostsByCategory(categoryId: string, page = 0, size = 10): Promise<PageResponse<BlogPostResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<BlogPostResponse>>>(
      `/blog/posts/category/${categoryId}?page=${page}&size=${size}`
    );
    return response.data.data;
  },
};

// ==================== Support Ticket Service ====================
export const supportService = {
  async createTicket(data: { subject: string; message: string; orderId?: string; priority?: string }): Promise<SupportTicketResponse> {
    const query = generateQueryString(data as Record<string, unknown>);
    const response = await apiClient.post<ApiResponse<SupportTicketResponse>>(`/support/tickets?${query}`);
    return response.data.data;
  },
  async getMyTickets(page = 0, size = 10): Promise<PageResponse<SupportTicketResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<SupportTicketResponse>>>(
      `/support/tickets?page=${page}&size=${size}`
    );
    return response.data.data;
  },
  async getTicketById(id: string): Promise<SupportTicketResponse> {
    const response = await apiClient.get<ApiResponse<SupportTicketResponse>>(`/support/tickets/${id}`);
    return response.data.data;
  },
  async replyToTicket(id: string, message: string): Promise<void> {
    await apiClient.post(`/support/tickets/${id}/reply?message=${encodeURIComponent(message)}`);
  },
  async closeTicket(id: string): Promise<void> {
    await apiClient.put(`/support/tickets/${id}/close`);
  },
};

// ==================== Dashboard Service ====================
export const dashboardService = {
  async getAdminDashboard(): Promise<DashboardStats> {
    const response = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/admin');
    return response.data.data;
  },
  async getSellerDashboard(shopId: string): Promise<SellerDashboardStats> {
    const response = await apiClient.get<ApiResponse<SellerDashboardStats>>(`/dashboard/seller/${shopId}`);
    return response.data.data;
  },
  async getRevenueChart(days = 30): Promise<any> {
    const response = await apiClient.get(`/dashboard/admin/revenue?days=${days}`);
    return response.data.data;
  },
  async getOrdersChart(days = 30): Promise<any> {
    const response = await apiClient.get(`/dashboard/admin/orders-chart?days=${days}`);
    return response.data.data;
  },
};

// ==================== File Upload Service ====================
export const fileService = {
  async uploadImage(file: File, folder = 'general'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const response = await apiClient.post<ApiResponse<string>>('/files/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
  async uploadMultiple(files: File[], folder = 'general'): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('folder', folder);
    const response = await apiClient.post<ApiResponse<string[]>>('/files/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
  async deleteFile(fileUrl: string): Promise<void> {
    await apiClient.delete(`/files?fileUrl=${encodeURIComponent(fileUrl)}`);
  },
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<string>>('/files/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
};

// ==================== Banner Service ====================
export const bannerService = {
  async getActiveBanners(): Promise<BannerResponse[]> {
    const response = await apiClient.get<ApiResponse<BannerResponse[]>>('/banners/active');
    return response.data.data;
  },
};

// ==================== Flash Sale Service ====================
export const flashSaleService = {
  async getActiveFlashSales(): Promise<FlashSaleResponse[]> {
    const response = await apiClient.get<ApiResponse<FlashSaleResponse[]>>('/flash-sales/active');
    return response.data.data;
  },
  async getUpcomingFlashSales(): Promise<FlashSaleResponse[]> {
    const response = await apiClient.get<ApiResponse<FlashSaleResponse[]>>('/flash-sales/upcoming');
    return response.data.data;
  },
  async getFlashSaleById(id: number): Promise<FlashSaleResponse> {
    const response = await apiClient.get<ApiResponse<FlashSaleResponse>>(`/flash-sales/${id}`);
    return response.data.data;
  },
};

// ==================== Shipping Service ====================
export const shippingService = {
  async getActiveMethods(): Promise<ShippingMethodResponse[]> {
    const response = await apiClient.get<ApiResponse<ShippingMethodResponse[]>>('/shipping/methods/active');
    return response.data.data;
  },
  async calculateCost(methodId: number, orderTotal: number, weight?: number): Promise<number> {
    const params = new URLSearchParams({ methodId: String(methodId), orderTotal: String(orderTotal) });
    if (weight != null) params.set('weight', String(weight));
    const response = await apiClient.get<ApiResponse<number>>(`/shipping/methods/calculate?${params.toString()}`);
    return response.data.data;
  },
};

// ==================== Order Service ====================
export const orderService = {
  async createOrder(data: any): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/orders', data);
    return response.data.data;
  },
  async getMyOrders(page = 1, limit = 10): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/orders/my-orders?page=${page}&limit=${limit}`);
    return response.data.data;
  },
  async getOrderById(id: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/orders/${id}`);
    return response.data.data;
  },
  async cancelOrder(id: string): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(`/orders/${id}/cancel`);
    return response.data.data;
  },
  async updateOrderStatus(id: string, status: string, note?: string): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(`/orders/${id}/status`, { status, note });
    return response.data.data;
  },
  async getShopOrders(shopId: string, page = 1, limit = 20, status?: string): Promise<any> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    const response = await apiClient.get<ApiResponse<any>>(`/orders/shop/${shopId}?${params}`);
    return response.data.data;
  },
  async getAdminOrders(page = 1, limit = 20, status?: string): Promise<any> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    const response = await apiClient.get<ApiResponse<any>>(`/orders/admin/all?${params}`);
    return response.data.data;
  },
};
