'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Percent, Tag, Clock, Sparkles } from 'lucide-react';
import { promotionService } from '@/services';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const data = await promotionService.getActive();
        setPromotions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch promotions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  return (
    <div className="container-custom py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Khuyến mãi</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Percent className="w-6 h-6 text-primary" />
          Chương Trình Khuyến Mãi
        </h1>
        <p className="text-muted-foreground mt-1">Khám phá các chương trình ưu đãi đang diễn ra</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-20">
          <Sparkles className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Hiện chưa có chương trình khuyến mãi nào</p>
          <Link href="/products" className="btn-primary">Xem sản phẩm</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promotions.map((promo: any) => (
            <div
              key={promo.id}
              className="card overflow-hidden hover:shadow-md transition-all"
            >
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-5 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{promo.name || promo.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{promo.description}</p>
                  </div>
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {promo.discountType === 'PERCENTAGE'
                      ? `-${promo.discountValue}%`
                      : `-${formatCurrency(promo.discountValue || 0)}`}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  {promo.minOrderAmount && (
                    <div>
                      <span className="text-muted-foreground">Đơn tối thiểu:</span>
                      <p className="font-medium">{formatCurrency(promo.minOrderAmount)}</p>
                    </div>
                  )}
                  {promo.maxDiscount && (
                    <div>
                      <span className="text-muted-foreground">Giảm tối đa:</span>
                      <p className="font-medium">{formatCurrency(promo.maxDiscount)}</p>
                    </div>
                  )}
                </div>
                {(promo.startDate || promo.endDate) && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {promo.startDate && formatDateTime(promo.startDate)}
                      {promo.endDate && ` - ${formatDateTime(promo.endDate)}`}
                    </span>
                  </div>
                )}
                {promo.code && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-sm text-muted-foreground">Mã: </span>
                    <code className="bg-primary/10 text-primary px-3 py-1 rounded font-mono font-bold">{promo.code}</code>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
