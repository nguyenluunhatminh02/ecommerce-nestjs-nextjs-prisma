import apiClient from '@/lib/api-client';
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from '@/types';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh-token', {
      refreshToken,
    });
    return response.data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, newPassword });
  },

  async verifyEmail(token: string): Promise<void> {
    await apiClient.get(`/auth/verify-email?token=${token}`);
  },

  async getMe(): Promise<UserResponse> {
    const response = await apiClient.get<ApiResponse<UserResponse>>('/users/me');
    return response.data.data;
  },
};
