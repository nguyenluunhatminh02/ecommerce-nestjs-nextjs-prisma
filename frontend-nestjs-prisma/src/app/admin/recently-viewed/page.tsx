'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, StatsCard, Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface RecentlyViewedItem {
    id: number;
    productId: string;
    productName: string;
    productImage: string;
    userId: string;
    userEmail: string;
    viewCount: number;
    lastViewedAt: string;
}

interface ViewStats {
    totalViews: number;
    uniqueProducts: number;
    uniqueUsers: number;
    topProducts: { name: string; views: number }[];
}

export default function AdminRecentlyViewedPage() {
    const [items, setItems] = useState<RecentlyViewedItem[]>([]);
    const [stats, setStats] = useState<ViewStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [viewsRes, statsRes] = await Promise.all([
                apiClient.get('/admin/recently-viewed').catch(() => null),
                apiClient.get('/admin/recently-viewed/stats').catch(() => null),
            ]);

            if (viewsRes) {
                const data = viewsRes.data.data || viewsRes.data;
                const list = Array.isArray(data) ? data : data.items || data.content || [];
                setItems(list.map((v: any) => ({
                    id: Number(v.id), productId: String(v.productId || ''),
                    productName: String(v.productName || v.product?.name || 'Unknown'),
                    productImage: String(v.productImage || v.product?.images?.[0]?.imageUrl || ''),
                    userId: String(v.userId || ''), userEmail: String(v.userEmail || v.user?.email || ''),
                    viewCount: Number(v.viewCount || 1),
                    lastViewedAt: String(v.viewedAt || v.lastViewedAt || v.createdAt || ''),
                })));
            }
            if (statsRes) {
                const s = statsRes.data.data || statsRes.data;
                setStats({
                    totalViews: s.totalViews || 0, uniqueProducts: s.uniqueProducts || 0,
                    uniqueUsers: s.uniqueUsers || 0,
                    topProducts: Array.isArray(s.topProducts) ? s.topProducts : [],
                });
            }
        } catch { toast.error('Không thể tải dữ liệu'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const columns = [
        {
            key: 'product', label: 'Sản phẩm', render: (_: unknown, r: RecentlyViewedItem) => (
                <div className="flex items-center gap-3">
                    {r.productImage && <img src={r.productImage} alt="" className="w-10 h-10 rounded object-cover" />}
                    <span className="font-medium text-sm">{r.productName}</span>
                </div>
            )
        },
        { key: 'userEmail', label: 'Khách hàng', render: (_: unknown, r: RecentlyViewedItem) => <span className="text-sm">{r.userEmail || r.userId.slice(0, 8)}</span> },
        { key: 'viewCount', label: 'Lượt xem', render: (_: unknown, r: RecentlyViewedItem) => <span className="text-sm font-medium">{r.viewCount}</span> },
        { key: 'lastViewedAt', label: 'Xem lần cuối', render: (_: unknown, r: RecentlyViewedItem) => <span className="text-xs text-gray-500">{new Date(r.lastViewedAt).toLocaleString('vi-VN')}</span> },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Recently Viewed" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Recently Viewed' }]} />

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatsCard title="Tổng lượt xem" value={stats.totalViews.toLocaleString()} icon="👁️" iconBg="bg-blue-100" />
                    <StatsCard title="Sản phẩm unique" value={stats.uniqueProducts} icon="📦" iconBg="bg-green-100" />
                    <StatsCard title="Người dùng" value={stats.uniqueUsers} icon="👥" iconBg="bg-purple-100" />
                    <StatsCard title="Top sản phẩm" value={stats.topProducts[0]?.name || '-'} icon="🔥" iconBg="bg-orange-100" />
                </div>
            )}

            <Card title="Lịch sử xem gần đây">
                {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={items} emptyMessage="Chưa có dữ liệu xem gần đây" />}
            </Card>

            {stats && stats.topProducts.length > 0 && (
                <Card title="Top sản phẩm được xem nhiều nhất">
                    <div className="space-y-3">
                        {stats.topProducts.slice(0, 10).map((p, i) => (
                            <div key={i} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-400 w-6">#{i + 1}</span>
                                    <span className="text-sm font-medium">{p.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                        <div className="bg-indigo-500 rounded-full h-2" style={{ width: `${Math.min(100, (p.views / (stats.topProducts[0]?.views || 1)) * 100)}%` }} />
                                    </div>
                                    <span className="text-sm text-gray-600 w-12 text-right">{p.views}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
