'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Bell, BellOff, Trash2, Plus } from 'lucide-react';
import { priceAlertService } from '@/services';
import { formatCurrency, formatDateTime, getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PriceAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await priceAlertService.getAll();
        setAlerts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch price alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await priceAlertService.delete(id);
      setAlerts(alerts.filter((a) => a.id !== id));
      toast.success('Đã xóa thông báo giá');
    } catch {
      toast.error('Không thể xóa');
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await priceAlertService.deactivate(id);
      setAlerts(alerts.map((a) => a.id === id ? { ...a, active: false } : a));
      toast.success('Đã tắt thông báo');
    } catch {
      toast.error('Không thể tắt thông báo');
    }
  };

  return (
    <div className="container-custom py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/account" className="hover:text-primary">Tài khoản</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Thông báo giá</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Thông Báo Giá
        </h1>
        <p className="text-muted-foreground mt-1">
          Nhận thông báo khi giá sản phẩm giảm đến mức bạn mong muốn
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-20">
          <BellOff className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Chưa có thông báo giá nào</p>
          <p className="text-sm text-muted-foreground mb-6">
            Bạn có thể tạo thông báo giá từ trang chi tiết sản phẩm
          </p>
          <Link href="/products" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Xem sản phẩm
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert: any) => {
            const product = alert.product || {};
            return (
              <div key={alert.id} className="card p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden shrink-0">
                  {product.thumbnail && (
                    <img
                      src={getImageUrl(product.thumbnail)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${product.slug || alert.productId}`}
                    className="font-medium hover:text-primary transition-colors line-clamp-1"
                  >
                    {product.name || `Sản phẩm #${alert.productId}`}
                  </Link>
                  <div className="flex items-center gap-4 mt-1 text-sm">
                    <span className="text-muted-foreground">
                      Giá hiện tại: <span className="font-medium text-foreground">{formatCurrency(product.price || 0)}</span>
                    </span>
                    <span className="text-primary font-medium">
                      Mục tiêu: {formatCurrency(alert.targetPrice)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tạo lúc: {formatDateTime(alert.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {alert.active !== false && (
                    <button
                      onClick={() => handleDeactivate(alert.id)}
                      className="p-2 text-muted-foreground hover:text-yellow-600 transition-colors"
                      title="Tắt thông báo"
                    >
                      <BellOff className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
