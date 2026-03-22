'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Package, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface DashboardData {
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  revenueChart: { date: string; revenue: number; orders: number }[];
  orderChart: { date: string; count: number }[];
  topProducts: { productName: string; productImage: string; totalSold: number; revenue: number }[];
  topCategories: { categoryName: string; productCount: number; revenue: number }[];
  orderStatusDistribution: Record<string, number>;
}

export default function SellerAnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const shopRes = await apiClient.get('/shops/my-shop');
        if (!shopRes.data.data) return;
        const shopId = shopRes.data.data.id;
        const dashRes = await apiClient.get(`/dashboard/seller/${shopId}`);
        setData(dashRes.data.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Không thể tải dữ liệu thống kê</p>
      </div>
    );
  }

  const totalOrders = Object.values(data.orderStatusDistribution || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thống kê</h1>
        <p className="text-muted-foreground">Phân tích hoạt động kinh doanh</p>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium opacity-90">Tổng doanh thu</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(data.totalRevenue || 0)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium opacity-90">Doanh thu tháng</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(data.monthlyRevenue || 0)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium opacity-90">Doanh thu hôm nay</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(data.todayRevenue || 0)}</p>
        </div>
      </div>

      {/* Order & Product Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-4">
          <ShoppingCart className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{totalOrders}</p>
          <p className="text-xs text-muted-foreground">Tổng đơn hàng</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-4">
          <ShoppingCart className="w-5 h-5 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold">{data.pendingOrders}</p>
          <p className="text-xs text-muted-foreground">Đơn chờ xử lý</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-4">
          <Package className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{data.totalProducts}</p>
          <p className="text-xs text-muted-foreground">Tổng sản phẩm</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-4">
          <Package className="w-5 h-5 text-red-500 mb-2" />
          <p className="text-2xl font-bold">{data.lowStockProducts ?? 0}</p>
          <p className="text-xs text-muted-foreground">Sắp hết hàng</p>
        </div>
      </div>

      {/* Order Status Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
        <h2 className="text-lg font-bold mb-4">Phân bố trạng thái đơn hàng</h2>
        <div className="space-y-3">
          {Object.entries(data.orderStatusDistribution || {}).map(([status, count]) => {
            const percent = totalOrders > 0 ? ((count as number) / totalOrders * 100) : 0;
            const colorMap: Record<string, string> = {
              PENDING: 'bg-yellow-500',
              CONFIRMED: 'bg-blue-500',
              PROCESSING: 'bg-indigo-500',
              SHIPPED: 'bg-cyan-500',
              DELIVERED: 'bg-green-500',
              CANCELLED: 'bg-red-500',
            };
            const labelMap: Record<string, string> = {
              PENDING: 'Chờ xác nhận',
              CONFIRMED: 'Đã xác nhận',
              PROCESSING: 'Đang xử lý',
              SHIPPED: 'Đang giao',
              DELIVERED: 'Đã giao',
              CANCELLED: 'Đã hủy',
            };
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="text-sm w-28 text-muted-foreground">{labelMap[status] || status}</span>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colorMap[status] || 'bg-gray-500'} rounded-full transition-all flex items-center justify-end pr-2`}
                    style={{ width: `${Math.max(percent, 5)}%` }}
                  >
                    <span className="text-xs text-white font-medium">{count as number}</span>
                  </div>
                </div>
                <span className="text-sm font-medium w-12 text-right">{percent.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Products */}
      {(data.topProducts || []).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
          <h2 className="text-lg font-bold mb-4">Sản phẩm bán chạy</h2>
          <div className="space-y-3">
            {data.topProducts.map((product, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                  {i + 1}
                </span>
                <img
                  src={product.productImage || '/placeholder.png'}
                  alt={product.productName}
                  className="w-10 h-10 rounded-lg object-cover bg-muted"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.productName}</p>
                  <p className="text-xs text-muted-foreground">Đã bán: {product.totalSold}</p>
                </div>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(product.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Categories */}
      {(data.topCategories || []).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
          <h2 className="text-lg font-bold mb-4">Danh mục hàng đầu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.topCategories.map((cat, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{cat.categoryName}</p>
                  <p className="text-xs text-muted-foreground">{cat.productCount} sản phẩm</p>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(cat.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Chart (simple) */}
      {(data.revenueChart || []).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
          <h2 className="text-lg font-bold mb-4">Biểu đồ doanh thu</h2>
          <div className="flex items-end gap-1 h-48">
            {data.revenueChart.map((point, i) => {
              const maxRevenue = Math.max(...data.revenueChart.map(p => p.revenue), 1);
              const height = (point.revenue / maxRevenue) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">
                    {point.revenue > 0 ? formatCurrency(point.revenue) : ''}
                  </span>
                  <div
                    className="w-full bg-primary/80 rounded-t-sm min-h-[2px] transition-all hover:bg-primary"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${point.date}: ${formatCurrency(point.revenue)}`}
                  />
                  <span className="text-[9px] text-muted-foreground rotate-[-45deg] origin-top-left whitespace-nowrap">
                    {point.date ? new Date(point.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
