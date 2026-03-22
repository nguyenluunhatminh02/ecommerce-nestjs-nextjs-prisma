import apiClient from '@/lib/api-client';
import {
  ApiResponse,
  PageResponse,
  ProductResponse,
  ProductFilterParams,
  CreateProductRequest,
} from '@/types';
import { generateQueryString } from '@/lib/utils';

export const productService = {
  async getProducts(params: ProductFilterParams): Promise<PageResponse<ProductResponse>> {
    const query = generateQueryString(params as Record<string, unknown>);
    const response = await apiClient.get<ApiResponse<PageResponse<ProductResponse>>>(
      `/products/filter?${query}`
    );
    return response.data.data;
  },

  async getProductById(id: string): Promise<ProductResponse> {
    const response = await apiClient.get<ApiResponse<ProductResponse>>(`/products/${id}`);
    return response.data.data;
  },

  async getProductBySlug(slug: string): Promise<ProductResponse> {
    const response = await apiClient.get<ApiResponse<ProductResponse>>(`/products/slug/${slug}`);
    return response.data.data;
  },

  async getFeaturedProducts(page = 0, size = 12): Promise<PageResponse<ProductResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<ProductResponse>>>(
      `/products/featured?page=${page}&size=${size}`
    );
    return response.data.data;
  },

  async getNewArrivals(page = 0, size = 12): Promise<PageResponse<ProductResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<ProductResponse>>>(
      `/products/new-arrivals?page=${page}&size=${size}`
    );
    return response.data.data;
  },

  async getBestSellers(page = 0, size = 12): Promise<PageResponse<ProductResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<ProductResponse>>>(
      `/products/best-sellers?page=${page}&size=${size}`
    );
    return response.data.data;
  },

  async getDeals(page = 0, size = 12): Promise<PageResponse<ProductResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<ProductResponse>>>(
      `/products/deals?page=${page}&size=${size}`
    );
    return response.data.data;
  },

  async getShopProducts(
    shopId: string,
    page = 0,
    size = 12
  ): Promise<PageResponse<ProductResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<ProductResponse>>>(
      `/products/shop/${shopId}?page=${page}&size=${size}`
    );
    return response.data.data;
  },

  async createProduct(data: CreateProductRequest): Promise<ProductResponse> {
    const response = await apiClient.post<ApiResponse<ProductResponse>>('/products', data);
    return response.data.data;
  },

  async updateProduct(id: string, data: Partial<CreateProductRequest>): Promise<ProductResponse> {
    const response = await apiClient.put<ApiResponse<ProductResponse>>(`/products/${id}`, data);
    return response.data.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },

  async publishProduct(id: string): Promise<void> {
    await apiClient.put(`/products/${id}/publish`);
  },
};
