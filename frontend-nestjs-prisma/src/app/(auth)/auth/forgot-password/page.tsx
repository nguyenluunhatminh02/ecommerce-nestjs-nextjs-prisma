'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { authService } from '@/services';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Vui lòng nhập email hợp lệ');
      return;
    }
    try {
      setIsLoading(true);
      await authService.forgotPassword(email);
      setIsSent(true);
    } catch {
      toast.error('Không thể gửi email khôi phục');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-black text-primary">ShopVN</h1>
          </Link>
          <h2 className="text-xl font-semibold mt-4">Quên mật khẩu</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isSent
              ? 'Kiểm tra email của bạn'
              : 'Nhập email để nhận link khôi phục mật khẩu'}
          </p>
        </div>

        {isSent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Chúng tôi đã gửi link khôi phục mật khẩu đến{' '}
              <span className="font-medium text-foreground">{email}</span>. Vui lòng kiểm tra
              hộp thư (bao gồm cả thư rác).
            </p>
            <Button variant="outline" onClick={() => setIsSent(false)} className="w-full">
              Gửi lại email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Gửi link khôi phục
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        )}

        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary mt-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
