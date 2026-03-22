'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { isJwtExpired } from '@/lib/utils';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { fetchUser, user } = useAuthStore();
  const { fetchItemCount } = useCartStore();

  useEffect(() => {
    const accessToken = Cookies.get('accessToken');
    if (isJwtExpired(accessToken)) {
      return;
    }

    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const accessToken = Cookies.get('accessToken');
    if (user && !isJwtExpired(accessToken)) {
      fetchItemCount();
    }
  }, [user, fetchItemCount]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <AuthInitializer>{children}</AuthInitializer>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
