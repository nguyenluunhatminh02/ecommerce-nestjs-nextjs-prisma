'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, StatsCard, Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface DashboardData {
    revenue: { total: number; daily: number; monthly: number; growth: number };
    orders: { total: number; pending: number; processing: number; delivered: number; cancelled: number };
    products: { total: number; topSelling: { name: string; sold: number }[]; topViewed: { name: string; views: number }[] };
    users: { total: number; newToday: number; activeMonth: number };
    traffic: { totalVisits: number; uniqueVisitors: number; bounceRate: number };
}

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30d');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [dashRes, revenueRes, ordersRes, productsRes, usersRes] = await Promise.all([
                apiClient.get(`/admin/analytics/dashboard?period=${period}`).catch(() => null),
                apiClient.get(`/admin/analytics/revenue?period=${period}`).catch(() => null),
                apiClient.get(`/admin/analytics/orders?period=${period}`).catch(() => null),
                apiClient.get(`/admin/analytics/products?period=${period}`).catch(() => null),
                apiClient.get(`/admin/analytics/users?period=${period}`).catch(() => null),
            ]);

            const dash = dashRes?.data?.data || dashRes?.data || {};
            const rev = revenueRes?.data?.data || revenueRes?.data || {};
            const ord = ordersRes?.data?.data || ordersRes?.data || {};
            const prod = productsRes?.data?.data || productsRes?.data || {};
            const usr = usersRes?.data?.data || usersRes?.data || {};

            setData({
                revenue: { total: rev.totalRevenue || dash.totalRevenue || 0, daily: rev.dailyRevenue || 0, monthly: rev.monthlyRevenue || 0, growth: rev.growth || 0 },
                orders: { total: ord.totalOrders || dash.totalOrders || 0, pending: ord.pending || 0, processing: ord.processing || 0, delivered: ord.delivered || 0, cancelled: ord.cancelled || 0 },
                products: {
                    total: prod.totalProducts || 0,
                    topSelling: Array.isArray(prod.topSelling) ? prod.topSelling.slice(0, 10) : [],
                    topViewed: Array.isArray(prod.topViewed) ? prod.topViewed.slice(0, 10) : [],
                },
                users: { total: usr.totalUsers || 0, newToday: usr.newToday || 0, activeMonth: usr.activeMonth || 0 },
                traffic: { totalVisits: dash.totalVisits || 0, uniqueVisitors: dash.uniqueVisitors || 0, bounceRate: dash.bounceRate || 0 },
            });
        } catch { toast.error('Không thể tải analytics'); }
        finally { setLoading(false); }
    }, [period]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

    const d = data || { revenue: { total: 0, daily: 0, monthly: 0, growth: 0 }, orders: { total: 0, pending: 0, processing: 0, delivered: 0, cancelled: 0 }, products: { total: 0, topSelling: [], topViewed: [] }, users: { total: 0, newToday: 0, activeMonth: 0 }, traffic: { totalVisits: 0, uniqueVisitors: 0, bounceRate: 0 } };

    return (
        <div className="space-y-6">
            <PageHeader title="Analytics" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Analytics' }]}
                actions={
                    <select value={period} onChange={e => setPeriod(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                        <option value="7d">7 ngày</option><option value="30d">30 ngày</option><option value="90d">90 ngày</option><option value="1y">1 năm</option>
                    </select>
                } />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard title="Tổng doanh thu" value={fmt(d.revenue.total)} change={d.revenue.growth} icon="💰" iconBg="bg-green-100" />
                <StatsCard title="Tổng đơn hàng" value={d.orders.total} icon="📦" iconBg="bg-blue-100" />
                <StatsCard title="Tổng người dùng" value={d.users.total} icon="👥" iconBg="bg-purple-100" />
                <StatsCard title="Tổng sản phẩm" value={d.products.total} icon="🛍️" iconBg="bg-orange-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard title="Doanh thu hôm nay" value={fmt(d.revenue.daily)} icon="📈" iconBg="bg-emerald-100" />
                <StatsCard title="Doanh thu tháng" value={fmt(d.revenue.monthly)} icon="📊" iconBg="bg-teal-100" />
                <StatsCard title="Tăng trưởng" value={`${d.revenue.growth > 0 ? '+' : ''}${d.revenue.growth}%`} icon="📉" iconBg="bg-cyan-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Phân bổ đơn hàng">
                    <div className="space-y-3">
                        {[
                            { label: 'Chờ xử lý', value: d.orders.pending, color: 'bg-yellow-500' },
                            { label: 'Đang xử lý', value: d.orders.processing, color: 'bg-blue-500' },
                            { label: 'Đã giao', value: d.orders.delivered, color: 'bg-green-500' },
                            { label: 'Đã hủy', value: d.orders.cancelled, color: 'bg-red-500' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                    <span className="text-sm">{item.label}</span>
                                </div>
                                <span className="font-medium">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="Top sản phẩm bán chạy">
                    {d.products.topSelling.length > 0 ? (
                        <div className="space-y-2">
                            {d.products.topSelling.map((p, i) => (
                                <div key={i} className="flex items-center justify-between py-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 w-5">#{i + 1}</span>
                                        <span className="text-sm">{p.name}</span>
                                    </div>
                                    <span className="text-sm font-medium">{p.sold} sold</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-gray-500 text-sm text-center py-4">Chưa có dữ liệu</p>}
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard title="Lượt truy cập" value={d.traffic.totalVisits.toLocaleString()} icon="🌐" iconBg="bg-indigo-100" />
                <StatsCard title="Khách unique" value={d.traffic.uniqueVisitors.toLocaleString()} icon="👤" iconBg="bg-pink-100" />
                <StatsCard title="Bounce Rate" value={`${d.traffic.bounceRate}%`} icon="↩️" iconBg="bg-red-100" />
            </div>
        </div>
    );
}
