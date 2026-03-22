import apiClient from '@/lib/api-client';
import {
  ApiResponse,
  PageResponse,
  ReviewResponse,
  CreateReviewRequest,
  RatingDistribution,
} from '@/types';

export const reviewService = {
  async createReview(data: CreateReviewRequest): Promise<ReviewResponse> {
    const response = await apiClient.post<ApiResponse<ReviewResponse>>('/reviews', data);
    return response.data.data;
  },

  async updateReview(
    id: string,
    data: Partial<CreateReviewRequest>
  ): Promise<ReviewResponse> {
    const response = await apiClient.put<ApiResponse<ReviewResponse>>(`/reviews/${id}`, data);
    return response.data.data;
  },

  async deleteReview(id: string): Promise<void> {
    await apiClient.delete(`/reviews/${id}`);
  },

  async getProductReviews(
    productId: string,
    page = 0,
    size = 10,
    sortBy = 'createdAt'
  ): Promise<PageResponse<ReviewResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<ReviewResponse>>>(
      `/reviews/product/${productId}?page=${page}&size=${size}&sortBy=${sortBy}`
    );
    return response.data.data;
  },

  async getRatingDistribution(productId: string): Promise<RatingDistribution[]> {
    const response = await apiClient.get<ApiResponse<Record<string, number> | RatingDistribution[]>>(
      `/reviews/product/${productId}/rating-distribution`
    );
    const data = response.data.data;
    // API returns a map { "5": count, "4": count, ... } - transform to array
    if (data && !Array.isArray(data)) {
      const map = data as Record<string, number>;
      const total = Object.values(map).reduce((sum, c) => sum + c, 0);
      return Object.entries(map).map(([rating, count]) => ({
        rating: parseInt(rating),
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }));
    }
    return data as RatingDistribution[];
  },

  async markHelpful(id: string): Promise<void> {
    await apiClient.post(`/reviews/${id}/helpful`);
  },

  async replyToReview(id: string, message: string): Promise<void> {
    await apiClient.post(`/reviews/${id}/reply?reply=${encodeURIComponent(message)}`);
  },
};
