import apiClient from '@/lib/api-client';
import {
  ApiResponse,
  PageResponse,
  OrderResponse,
  CreateOrderRequest,
} from '@/types';
import { generateQueryString } from '@/lib/utils';

export const orderService = {
  async createOrder(data: CreateOrderRequest): Promise<OrderResponse> {
    const response = await apiClient.post<ApiResponse<OrderResponse>>('/orders', data);
    return response.data.data;
  },

  async getOrderById(id: string): Promise<OrderResponse> {
    const response = await apiClient.get<ApiResponse<OrderResponse>>(`/orders/${id}`);
    return response.data.data;
  },

  async getOrderByNumber(orderNumber: string): Promise<OrderResponse> {
    const response = await apiClient.get<ApiResponse<OrderResponse>>(
      `/orders/number/${orderNumber}`
    );
    return response.data.data;
  },

  async getMyOrders(params?: {
    status?: string;
    page?: number;
    size?: number;
    search?: string;
  }): Promise<PageResponse<OrderResponse>> {
    const query = generateQueryString((params || {}) as Record<string, unknown>);
    const response = await apiClient.get<ApiResponse<PageResponse<OrderResponse>>>(
      `/orders/my-orders?${query}`
    );
    return response.data.data;
  },

  async getShopOrders(shopId: string, params?: {
    status?: string;
    page?: number;
    size?: number;
    search?: string;
  }): Promise<PageResponse<OrderResponse>> {
    const query = generateQueryString((params || {}) as Record<string, unknown>);
    const response = await apiClient.get<ApiResponse<PageResponse<OrderResponse>>>(
      `/orders/shop/${shopId}?${query}`
    );
    return response.data.data;
  },

  async cancelOrder(id: string, reason?: string): Promise<void> {
    await apiClient.patch(`/orders/${id}/cancel`, reason ? { reason } : {});
  },

  async updateOrderStatus(id: string, status: string, note?: string): Promise<OrderResponse> {
    const response = await apiClient.patch<ApiResponse<OrderResponse>>(`/orders/${id}/status`, { status, note });
    return response.data.data;
  },

  async getAllOrders(params?: {
    status?: string;
    page?: number;
    size?: number;
    search?: string;
  }): Promise<PageResponse<OrderResponse>> {
    const query = generateQueryString((params || {}) as Record<string, unknown>);
    const response = await apiClient.get<ApiResponse<PageResponse<OrderResponse>>>(
      `/orders/admin/all?${query}`
    );
    return response.data.data;
  },
};
