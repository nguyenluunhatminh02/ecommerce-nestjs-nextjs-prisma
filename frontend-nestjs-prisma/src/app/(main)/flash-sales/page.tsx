'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Zap, Clock, Flame } from 'lucide-react';
import { flashSaleService } from '@/services';
import { formatCurrency, getImageUrl } from '@/lib/utils';

interface FlashSaleItem {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  status: string;
  items?: any[];
}

export default function FlashSalesPage() {
  const [sales, setSales] = useState<FlashSaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const data = await flashSaleService.getActiveFlashSales();
        setSales(Array.isArray(data) ? data : ((data as any)?.content ?? []));
      } catch (error) {
        console.error('Failed to fetch flash sales:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSales();
  }, []);

  const getTimeLeft = (endTime: string) => {
    const end = new Date(endTime).getTime();
    if (isNaN(end)) return 'Đang diễn ra';
    const diff = end - Date.now();
    if (diff <= 0) return 'Đã kết thúc';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="container-custom py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Flash Sale</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Zap className="w-8 h-8 text-yellow-500" />
          Flash Sale
        </h1>
        <p className="text-muted-foreground mt-2">Ưu đãi có thời hạn - Nhanh tay kẻo lỡ!</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-20">
          <Flame className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Hiện chưa có Flash Sale</h2>
          <p className="text-muted-foreground mb-6">Theo dõi để không bỏ lỡ các đợt giảm giá sắp tới!</p>
          <Link href="/products" className="btn-primary inline-flex items-center gap-2">
            Xem sản phẩm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sales.map((sale) => (
            <div key={sale.id} className="card overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">{sale.name}</h3>
                  <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    {getTimeLeft(sale.endTime)}
                  </div>
                </div>
              </div>
              <div className="p-4">
                {sale.items && sale.items.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {sale.items.slice(0, 6).map((item: any, idx: number) => {
                      const product = item.products || item.product || item;
                      const imgUrl = product.images?.[0]?.imageUrl || product.images?.[0]?.url || product.thumbnail || product.image;
                      return (
                        <Link key={idx} href={`/products/${product.slug || product.id}`} className="block">
                          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                            <img
                              src={getImageUrl(imgUrl)}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <p className="text-xs mt-1 text-red-600 font-semibold">
                            {formatCurrency(item.salePrice || product.price)}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sản phẩm đang được cập nhật
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
