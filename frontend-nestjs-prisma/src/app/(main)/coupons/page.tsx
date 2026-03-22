'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Ticket, Copy, Tag, Gift } from 'lucide-react';
import { couponService } from '@/services';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const data = await couponService.getActiveCoupons();
        setCoupons(Array.isArray(data) ? data : ((data as any)?.content ?? []));
      } catch (error) {
        console.error('Failed to fetch coupons:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã: ${code}`);
  };

  return (
    <div className="container-custom py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Mã giảm giá</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Ticket className="w-6 h-6 text-primary" />
          Mã Giảm Giá
        </h1>
        <p className="text-muted-foreground mt-1">Thu thập mã giảm giá để tiết kiệm hơn</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20">
          <Gift className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Hiện chưa có mã giảm giá nào</p>
          <Link href="/products" className="btn-primary">Xem sản phẩm</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon: any) => (
            <div
              key={coupon.id}
              className="card overflow-hidden border-dashed border-2 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <Tag className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">
                    {coupon.discountType === 'PERCENTAGE'
                      ? `-${coupon.discountValue}%`
                      : `-${formatCurrency(coupon.discountValue)}`}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <code className="bg-muted px-3 py-1.5 rounded-lg font-mono font-bold text-sm flex-1 text-center">
                    {coupon.code}
                  </code>
                  <button
                    onClick={() => copyCode(coupon.code)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Sao chép mã"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {coupon.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{coupon.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {coupon.minOrderAmount && (
                    <span>Đơn tối thiểu: {formatCurrency(coupon.minOrderAmount)}</span>
                  )}
                  {coupon.expiresAt && (
                    <span>HSD: {new Date(coupon.expiresAt).toLocaleDateString('vi-VN')}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
