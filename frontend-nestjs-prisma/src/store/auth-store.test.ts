import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock authService before store import
vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
  },
}));

import { useAuthStore } from '@/store/auth-store';
import { authService } from '@/services/auth.service';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  phone: null,
  avatarUrl: null,
  role: 'CUSTOMER' as const,
  provider: 'LOCAL' as const,
  emailVerified: true,
  enabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockAuthResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  tokenType: 'Bearer',
  expiresIn: 3600,
  user: mockUser,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
    vi.clearAllMocks();
  });

  it('initial state is unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('login sets user and authenticated state on success', async () => {
    vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

    await useAuthStore.getState().login('test@example.com', 'password');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('test@example.com');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('login sets error state on failure', async () => {
    vi.mocked(authService.login).mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    try {
      await useAuthStore.getState().login('wrong@example.com', 'wrongpass');
    } catch {}

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.error).toBe('Invalid credentials');
  });

  it('setUser updates user in state', () => {
    useAuthStore.getState().setUser(mockUser);

    const state = useAuthStore.getState();
    expect(state.user?.id).toBe('user-1');
  });

  it('clearError resets error to null', () => {
    useAuthStore.setState({ error: 'Some error' });

    useAuthStore.getState().clearError();

    const state = useAuthStore.getState();
    expect(state.error).toBeNull();
  });

  it('register calls authService.register and sets authenticated state', async () => {
    vi.mocked(authService.register).mockResolvedValue(mockAuthResponse);

    await useAuthStore.getState().register({
      firstName: 'John',
      lastName: 'Doe',
      email: 'new@example.com',
      password: 'password',
      confirmPassword: 'password',
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('test@example.com');
  });
});
