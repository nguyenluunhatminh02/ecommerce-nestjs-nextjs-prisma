'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, Trash2, X } from 'lucide-react';
import { recentlyViewedService } from '@/services';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function RecentlyViewedPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await recentlyViewedService.getAll(50);
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch recently viewed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      await recentlyViewedService.remove(productId);
      setItems(items.filter((item) => (item.productId || item.id) !== productId));
      toast.success('Đã xóa');
    } catch {
      toast.error('Không thể xóa');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Xóa toàn bộ lịch sử xem?')) return;
    try {
      await recentlyViewedService.clearAll();
      setItems([]);
      toast.success('Đã xóa toàn bộ');
    } catch {
      toast.error('Không thể xóa');
    }
  };

  return (
    <div className="container-custom py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Đã xem gần đây</span>
      </nav>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Sản Phẩm Đã Xem
          </h1>
          <p className="text-muted-foreground mt-1">{items.length} sản phẩm</p>
        </div>
        {items.length > 0 && (
          <button onClick={handleClearAll} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
            <Trash2 className="w-4 h-4" />
            Xóa tất cả
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-72 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <Clock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Chưa có sản phẩm nào được xem gần đây</p>
          <Link href="/products" className="btn-primary">Khám phá sản phẩm</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item: any) => {
            const product = item.product || item;
            const productId = item.productId || product.id;
            return (
              <div key={productId} className="card overflow-hidden group relative">
                <button
                  onClick={() => handleRemove(productId)}
                  className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
                <Link href={`/products/${product.slug || productId}`}>
                  <div className="aspect-square bg-muted overflow-hidden">
                    <img
                      src={getImageUrl(product.thumbnail || product.image)}
                      alt={product.name || 'Sản phẩm'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-primary font-semibold mt-1">
                      {formatCurrency(product.salePrice || product.price)}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
