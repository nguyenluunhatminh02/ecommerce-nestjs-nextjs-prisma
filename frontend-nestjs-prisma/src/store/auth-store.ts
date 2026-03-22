import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { UserResponse, AuthResponse } from '@/types';
import { authService } from '@/services/auth.service';
import { isJwtExpired } from '@/lib/utils';

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: UserResponse) => void;
  clearError: () => void;
}

const setTokens = (auth: AuthResponse) => {
  Cookies.set('accessToken', auth.accessToken, { expires: 1 });
  Cookies.set('refreshToken', auth.refreshToken, { expires: 7 });
};

const clearTokens = () => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const auth = await authService.login({ email, password });
          setTokens(auth);
          set({
            user: auth.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Đăng nhập thất bại',
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const auth = await authService.register(data);
          setTokens(auth);
          set({
            user: auth.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Đăng ký thất bại',
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          const refreshToken = Cookies.get('refreshToken');
          if (refreshToken) {
            await authService.logout(refreshToken);
          }
        } catch {
          // Ignore logout errors
        } finally {
          clearTokens();
          set({ user: null, isAuthenticated: false });
        }
      },

      fetchUser: async () => {
        const token = Cookies.get('accessToken');
        if (isJwtExpired(token)) {
          clearTokens();
          set({ user: null, isAuthenticated: false });
          return;
        }
        try {
          set({ isLoading: true });
          const user = await authService.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setUser: (user) => set({ user }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
