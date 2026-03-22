'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Store,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import apiClient from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';

interface DashboardData {
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number | null;
  pendingOrders: number;
  totalProducts: number;
  orderStatusDistribution: Record<string, number>;
}

interface ShopData {
  id: string;
  name: string;
  slug: string;
  averageRating: number;
  totalReviews: number;
  totalProducts: number;
  totalFollowers: number;
  isVerified: boolean;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  PENDING: { label: 'Chờ xác nhận', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  CONFIRMED: { label: 'Đã xác nhận', icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
  PROCESSING: { label: 'Đang xử lý', icon: Package, color: 'text-indigo-600 bg-indigo-50' },
  SHIPPED: { label: 'Đang giao', icon: Truck, color: 'text-purple-600 bg-purple-50' },
  DELIVERED: { label: 'Đã giao', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  CANCELLED: { label: 'Đã hủy', icon: XCircle, color: 'text-red-600 bg-red-50' },
};

export default function SellerDashboardPage() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [shop, setShop] = useState<ShopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // First get shop info
        const shopRes = await apiClient.get('/shops/my-shop');
        const shopData = shopRes.data.data;
        if (!shopData) {
          setShop(null);
          setDashboard(null);
          return;
        }
        setShop(shopData);

        // Then fetch dashboard with shop ID
        const dashRes = await apiClient.get(`/dashboard/seller/${shopData.id}`);
        setDashboard(dashRes.data.data);
      } catch (error) {
        console.error('Failed to fetch seller dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const totalOrders = dashboard?.orderStatusDistribution
    ? Object.values(dashboard.orderStatusDistribution).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Xin chào, {user?.firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Đây là tổng quan cửa hàng {shop?.name} của bạn
          </p>
        </div>
        {shop && (
          <Link
            href={`/shop/${shop.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition text-sm font-medium"
          >
            <Store className="w-4 h-4" />
            Xem cửa hàng
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(dashboard?.totalRevenue || 0)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <ArrowUpRight className="w-3 h-3 text-green-500" />
            <span className="text-green-500 font-medium">Hôm nay: {formatCurrency(dashboard?.todayRevenue || 0)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
              <p className="text-2xl font-bold mt-1">{totalOrders}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <AlertTriangle className="w-3 h-3 text-yellow-500" />
            <span className="text-yellow-600 font-medium">{dashboard?.pendingOrders || 0} đơn chờ xác nhận</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sản phẩm</p>
              <p className="text-2xl font-bold mt-1">{dashboard?.totalProducts || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3">
            <Link href="/seller/products" className="text-xs text-primary hover:underline flex items-center gap-1">
              Quản lý sản phẩm <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Người theo dõi</p>
              <p className="text-2xl font-bold mt-1">{shop?.totalFollowers?.toLocaleString() || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">
              ⭐ {shop?.averageRating?.toFixed(1) || '0.0'} đánh giá trung bình
            </span>
          </div>
        </div>
      </div>

      {/* Order Status + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold mb-4">Phân bổ đơn hàng</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(dashboard?.orderStatusDistribution || {}).map(([status, count]) => {
              const config = statusConfig[status] || {
                label: status,
                icon: Package,
                color: 'text-gray-600 bg-gray-50',
              };
              const Icon = config.icon;
              const percentage = totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(0) : 0;
              return (
                <div
                  key={status}
                  className={`rounded-lg p-4 ${config.color}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{config.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs opacity-70">{percentage}% tổng đơn</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold mb-4">Thao tác nhanh</h2>
          <div className="space-y-2">
            <Link
              href="/seller/products"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Quản lý sản phẩm</p>
                <p className="text-xs text-muted-foreground">{dashboard?.totalProducts || 0} sản phẩm</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link
              href="/seller/orders"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Quản lý đơn hàng</p>
                <p className="text-xs text-muted-foreground">{dashboard?.pendingOrders || 0} chờ xử lý</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link
              href="/seller/reviews"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition"
            >
              <div className="w-10 h-10 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Đánh giá sản phẩm</p>
                <p className="text-xs text-muted-foreground">Xem và phản hồi đánh giá</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link
              href="/seller/settings"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center">
                <Store className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Cài đặt cửa hàng</p>
                <p className="text-xs text-muted-foreground">Cập nhật thông tin shop</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>

      {/* Shop Info Banner */}
      {shop && (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-primary text-xl font-bold">
                {shop.name[0]}
              </div>
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {shop.name}
                  {shop.isVerified && (
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  ⭐ {shop.averageRating?.toFixed(1)} · {shop.totalFollowers?.toLocaleString()} người theo dõi · {shop.totalProducts} sản phẩm
                </p>
              </div>
            </div>
            <Link
              href="/seller/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
            >
              Chỉnh sửa thông tin
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
