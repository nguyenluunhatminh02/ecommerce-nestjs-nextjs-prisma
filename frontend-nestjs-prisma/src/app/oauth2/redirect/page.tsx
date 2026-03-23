'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function OAuth2RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refresh_token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
      router.replace('/auth/login');
      return;
    }

    if (!token || !refreshToken) {
      toast.error('Không nhận được token. Vui lòng thử lại.');
      router.replace('/auth/login');
      return;
    }

    Cookies.set('accessToken', token, { expires: 1 });
    Cookies.set('refreshToken', refreshToken, { expires: 7 });

    fetchUser()
      .then(() => {
        toast.success('Đăng nhập thành công!');
        router.replace('/');
      })
      .catch(() => {
        toast.error('Không thể lấy thông tin người dùng.');
        router.replace('/auth/login');
      });
  }, [searchParams, router, fetchUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground">Đang xử lý đăng nhập...</p>
    </div>
  );
}

export default function OAuth2RedirectPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <OAuth2RedirectContent />
    </Suspense>
  );
}
