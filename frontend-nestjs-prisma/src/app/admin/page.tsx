'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import {
    StatsCard, Card, MiniLineChart, MiniBarChart, ProgressBar,
    Avatar, StatusBadge, SkeletonCard, SkeletonChart, SkeletonTable
} from '@/components/admin/AdminComponents';

interface DashboardData {
    totalRevenue: number;
    todayRevenue: number;
    monthlyRevenue: number;
    totalOrders: number;
    todayOrders: number;
    pendingOrders: number;
    totalUsers: number;
    newUsersToday: number;
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    totalShops: number;
    revenueChart: { date: string; revenue: number; orders: number }[];
    topProducts: { productName: string; productImage: string | null; totalSold: number; revenue: number }[];
    topCategories: { categoryName: string; productCount: number; revenue: number }[] | null;
    orderStatusDistribution: Record<string, number>;
    orderChart: { date: string; count: number }[] | null;
}

interface RecentOrder {
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    shippingAddress: { fullName: string; phone: string } | null;
    items: { productName: string }[];
    createdAt: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const STATUS_COLORS: Record<string, string> = {
    PENDING: '#f59e0b',
    CONFIRMED: '#3b82f6',
    PROCESSING: '#8b5cf6',
    SHIPPING: '#06b6d4',
    SHIPPED: '#06b6d4',
    DELIVERED: '#10b981',
    CANCELLED: '#ef4444',
    RETURNED: '#f97316',
    REFUNDED: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang xử lý',
    SHIPPING: 'Đang giao',
    SHIPPED: 'Đang giao',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã hủy',
    RETURNED: 'Hoàn trả',
    REFUNDED: 'Hoàn tiền',
};

export default function AdminDashboardPage() {
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const [dashRes, ordersRes] = await Promise.all([
                apiClient.get('/dashboard/admin'),
                apiClient.get('/orders/admin/all', { params: { page: 0, size: 7 } }),
            ]);

            const dashData = dashRes.data.data || dashRes.data;
            setDashboard(dashData);

            const ordersData = ordersRes.data.data || ordersRes.data;
            const ordersList = ordersData.content || ordersData || [];
            setRecentOrders(ordersList);
        } catch (err) {
            console.error('Failed to fetch dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    if (loading || !dashboard) {
        return (
            <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <SkeletonChart />
                    <SkeletonChart />
                </div>
                <SkeletonTable rows={5} columns={5} />
            </div>
        );
    }

    const revenueChartVals = dashboard.revenueChart?.map(r => r.revenue) || [];
    const ordersChartVals = dashboard.revenueChart?.map(r => r.orders) || [];
    const statusEntries = Object.entries(dashboard.orderStatusDistribution || {}).filter(([, v]) => v > 0);
    const totalStatusOrders = statusEntries.reduce((sum, [, v]) => sum + v, 0);

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Tổng quan hoạt động hệ thống</p>
                </div>
                <button
                    onClick={fetchDashboard}
                    className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Làm mới
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatsCard
                    title="Tổng doanh thu"
                    value={formatCurrency(dashboard.totalRevenue || 0)}
                    icon={<MiniLineChart data={revenueChartVals.length > 0 ? revenueChartVals : [0]} color="#ffffff" />}
                    iconBg="bg-indigo-600"
                    href="/admin/orders"
                />
                <StatsCard
                    title="Tổng đơn hàng"
                    value={dashboard.totalOrders?.toLocaleString() || '0'}
                    icon={<MiniBarChart data={ordersChartVals.length > 0 ? ordersChartVals : [0]} color="#ffffff" />}
                    iconBg="bg-emerald-600"
                    href="/admin/orders"
                />
                <StatsCard
                    title="Tổng người dùng"
                    value={dashboard.totalUsers?.toLocaleString() || '0'}
                    icon={
                        <div className="text-white text-lg font-bold">
                            +{dashboard.newUsersToday || 0}
                        </div>
                    }
                    iconBg="bg-amber-600"
                    href="/admin/customers"
                />
                <StatsCard
                    title="Tổng sản phẩm"
                    value={dashboard.totalProducts?.toLocaleString() || '0'}
                    icon={
                        <div className="text-white text-xs text-center leading-tight">
                            <div className="text-lg font-bold">{dashboard.activeProducts || 0}</div>
                            <div>đang bán</div>
                        </div>
                    }
                    iconBg="bg-rose-600"
                    href="/admin/products"
                />
            </div>

            {/* Sub metrics row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Doanh thu hôm nay</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(dashboard.todayRevenue || 0)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Doanh thu tháng</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(dashboard.monthlyRevenue || 0)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Đơn hôm nay</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">{dashboard.todayOrders || 0}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Đơn chờ xác nhận</p>
                    <p className="text-lg font-bold text-amber-600 mt-1">{dashboard.pendingOrders || 0}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Sản phẩm sắp hết</p>
                    <p className="text-lg font-bold text-red-600 mt-1">{dashboard.lowStockProducts || 0}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">Tổng shop</p>
                    <p className="text-lg font-bold text-purple-600 mt-1">{dashboard.totalShops || 0}</p>
                </div>
            </div>

            {/* Revenue Chart + Order Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card title="Biểu đồ doanh thu (30 ngày)" className="lg:col-span-2">
                    {dashboard.revenueChart && dashboard.revenueChart.length > 0 ? (() => {
                        const maxVal = Math.max(...dashboard.revenueChart!.map(r => r.revenue), 1);
                        return (
                        <div className="h-72 flex items-end gap-1 px-2">
                            {dashboard.revenueChart.map((item, i) => {
                                const height = (item.revenue / maxVal) * 100;
                                const date = new Date(item.date);
                                const dayLabel = `${date.getDate()}/${date.getMonth() + 1}`;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
                                        <div className="relative w-full flex items-end justify-center" style={{ height: '220px' }}>
                                            <div
                                                className="w-full max-w-[20px] bg-indigo-500 hover:bg-indigo-600 rounded-t-sm transition-all cursor-pointer relative group"
                                                style={{ height: `${Math.max(height, 2)}%` }}
                                            >
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                    {formatCurrency(item.revenue)}
                                                    <br />{item.orders} đơn
                                                </div>
                                            </div>
                                        </div>
                                        {i % 3 === 0 && (
                                            <span className="text-[9px] text-gray-400">{dayLabel}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        );
                    })() : (
                        <div className="h-72 flex items-center justify-center text-gray-400">
                            Chưa có dữ liệu doanh thu
                        </div>
                    )}
                </Card>

                <Card title="Phân bố đơn hàng">
                    {statusEntries.length > 0 ? (
                        <div className="space-y-3">
                            {statusEntries.map(([status, count]) => {
                                const pct = totalStatusOrders > 0 ? (count / totalStatusOrders) * 100 : 0;
                                return (
                                    <div key={status}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] || '#94a3b8' }} />
                                                <span className="text-gray-700">{STATUS_LABELS[status] || status}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900">{count}</span>
                                                <span className="text-gray-400 text-xs">({pct.toFixed(1)}%)</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[status] || '#94a3b8' }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-400">
                            Chưa có dữ liệu
                        </div>
                    )}
                </Card>
            </div>

            {/* Quick Info + Key Metrics + Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card title="Tóm tắt nhanh">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Đơn chờ xử lý</p>
                                    <p className="text-xs text-gray-500">Cần xác nhận ngay</p>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-blue-600">{dashboard.pendingOrders}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Sản phẩm sắp hết</p>
                                    <p className="text-xs text-gray-500">Cần bổ sung hàng</p>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-red-600">{dashboard.lowStockProducts}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Người dùng mới hôm nay</p>
                                    <p className="text-xs text-gray-500">Đã đăng ký</p>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-green-600">{dashboard.newUsersToday}</span>
                        </div>
                    </div>
                </Card>

                <Card title="Chỉ số quan trọng">
                    <div className="space-y-5">
                        <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600">Sản phẩm đang bán</span>
                                <span className="font-bold text-gray-900">{dashboard.activeProducts} / {dashboard.totalProducts}</span>
                            </div>
                            <ProgressBar value={dashboard.activeProducts || 0} max={dashboard.totalProducts || 1} label="" color="bg-indigo-600" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600">Tổng đơn hàng</span>
                                <span className="font-bold text-gray-900">{dashboard.totalOrders?.toLocaleString()}</span>
                            </div>
                            <ProgressBar value={dashboard.totalOrders || 0} max={Math.max(dashboard.totalOrders || 0, 200)} label="" color="bg-emerald-600" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-600">Tổng người dùng</span>
                                <span className="font-bold text-gray-900">{dashboard.totalUsers?.toLocaleString()}</span>
                            </div>
                            <ProgressBar value={dashboard.totalUsers || 0} max={Math.max(dashboard.totalUsers || 0, 100)} label="" color="bg-amber-600" />
                        </div>
                        <hr />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                                <p className="text-2xl font-bold text-gray-900">{dashboard.totalShops}</p>
                                <p className="text-xs text-gray-500 mt-1">Shop đang hoạt động</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                                <p className="text-2xl font-bold text-gray-900">{dashboard.todayOrders}</p>
                                <p className="text-xs text-gray-500 mt-1">Đơn hôm nay</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Top sản phẩm bán chạy" actions={
                    <Link href="/admin/products" className="text-sm text-indigo-600 hover:text-indigo-700">Xem tất cả</Link>
                }>
                    {dashboard.topProducts && dashboard.topProducts.length > 0 ? (
                        <div className="space-y-3">
                            {dashboard.topProducts.slice(0, 5).map((product, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <span className="text-sm font-medium text-gray-400 w-5">{i + 1}</span>
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                        {product.productImage ? (
                                            <img src={product.productImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{product.productName}</p>
                                        <p className="text-xs text-gray-500">Đã bán: {product.totalSold}</p>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{formatCurrency(product.revenue)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-400">
                            Chưa có dữ liệu
                        </div>
                    )}
                </Card>
            </div>

            {/* Recent Orders Table */}
            <Card title="Đơn hàng gần đây" actions={
                <Link href="/admin/orders" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    Xem tất cả →
                </Link>
            } noPadding>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recentOrders.length > 0 ? recentOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-indigo-600">{order.orderNumber}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={order.shippingAddress?.fullName || 'N/A'} size="sm" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{order.shippingAddress?.fullName || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">{order.items?.[0]?.productName || ''}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatCurrency(order.totalAmount)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <StatusBadge status={order.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/admin/orders?highlight=${order.id}`} className="text-sm text-indigo-600 hover:text-indigo-700">
                                            Xem
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                        Chưa có đơn hàng
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
