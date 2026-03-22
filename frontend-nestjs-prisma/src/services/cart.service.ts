import apiClient from '@/lib/api-client';
import { ApiResponse, CartResponse, AddToCartRequest, CouponValidationResponse } from '@/types';

export const cartService = {
  async getCart(): Promise<CartResponse> {
    const response = await apiClient.get<ApiResponse<CartResponse>>('/cart');
    return response.data.data;
  },

  async addToCart(data: AddToCartRequest): Promise<CartResponse> {
    const response = await apiClient.post<ApiResponse<CartResponse>>('/cart/items', data);
    return response.data.data;
  },

  async updateCartItem(itemId: string, quantity: number): Promise<CartResponse> {
    const response = await apiClient.put<ApiResponse<CartResponse>>(
      `/cart/items/${itemId}?quantity=${quantity}`
    );
    return response.data.data;
  },

  async removeCartItem(itemId: string): Promise<CartResponse> {
    const response = await apiClient.delete<ApiResponse<CartResponse>>(`/cart/items/${itemId}`);
    return response.data.data;
  },

  async clearCart(): Promise<void> {
    await apiClient.delete('/cart');
  },

  async applyCoupon(couponCode: string): Promise<CartResponse> {
    const response = await apiClient.post<ApiResponse<CartResponse>>(
      `/cart/coupon?code=${couponCode}`
    );
    return response.data.data;
  },

  async removeCoupon(): Promise<CartResponse> {
    const response = await apiClient.delete<ApiResponse<CartResponse>>('/cart/coupon');
    return response.data.data;
  },

  async getCartItemCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<number>>('/cart/count');
    return response.data.data;
  },
};
