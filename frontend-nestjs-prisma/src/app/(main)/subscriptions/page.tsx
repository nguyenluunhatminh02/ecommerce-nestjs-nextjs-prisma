'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, CreditCard, Check, Star, Zap } from 'lucide-react';
import { subscriptionService } from '@/services';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [mySubscriptions, setMySubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansData, myData] = await Promise.allSettled([
          subscriptionService.getPlans(),
          subscriptionService.getMySubscriptions(),
        ]);
        if (plansData.status === 'fulfilled') setPlans(Array.isArray(plansData.value) ? plansData.value : []);
        if (myData.status === 'fulfilled') setMySubscriptions(Array.isArray(myData.value) ? myData.value : []);
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubscribe = async (planId: number) => {
    try {
      await subscriptionService.subscribe({ planId });
      toast.success('Đăng ký thành công!');
      const data = await subscriptionService.getMySubscriptions();
      setMySubscriptions(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Không thể đăng ký');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Bạn có chắc muốn hủy gói đăng ký?')) return;
    try {
      await subscriptionService.cancel();
      toast.success('Đã hủy đăng ký');
      const data = await subscriptionService.getMySubscriptions();
      setMySubscriptions(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Không thể hủy đăng ký');
    }
  };

  const activeSub = mySubscriptions.find((s) => s.status === 'ACTIVE');

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-80 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/account" className="hover:text-primary">Tài khoản</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Gói đăng ký</span>
      </nav>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Gói Đăng Ký Premium</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Nâng cấp trải nghiệm mua sắm với các ưu đãi độc quyền
        </p>
      </div>

      {activeSub && (
        <div className="card p-6 mb-8 border-primary border-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Gói hiện tại: {activeSub.plan?.name || activeSub.planName}</h3>
                <p className="text-sm text-muted-foreground">
                  Hết hạn: {formatDateTime(activeSub.expiresAt || activeSub.endDate)}
                </p>
              </div>
            </div>
            <button onClick={handleCancel} className="btn-outline text-red-500 border-red-200 hover:bg-red-50">
              Hủy gói
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan: any, index: number) => {
          const isPopular = index === 1;
          const isCurrentPlan = activeSub?.planId === plan.id;
          return (
            <div
              key={plan.id}
              className={`card p-6 relative ${isPopular ? 'border-primary border-2 scale-105' : ''} ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold">
                  Phổ biến nhất
                </div>
              )}
              <div className="text-center mb-6">
                <Zap className={`w-10 h-10 mx-auto mb-3 ${isPopular ? 'text-primary' : 'text-muted-foreground'}`} />
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(plan.price)}
                  <span className="text-sm font-normal text-muted-foreground">/{plan.interval || 'tháng'}</span>
                </p>
              </div>
              <ul className="space-y-3 mb-6">
                {(plan.features || []).map((feature: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
                {plan.description && (
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    {plan.description}
                  </li>
                )}
              </ul>
              <button
                onClick={() => !isCurrentPlan && handleSubscribe(plan.id)}
                disabled={isCurrentPlan}
                className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                  isCurrentPlan
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : isPopular
                    ? 'btn-primary'
                    : 'btn-outline'
                }`}
              >
                {isCurrentPlan ? 'Gói hiện tại' : 'Đăng ký ngay'}
              </button>
            </div>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-16">
          <CreditCard className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Chưa có gói đăng ký nào</p>
        </div>
      )}
    </div>
  );
}
