'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, StatsCard, Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface PriceAlert {
    id: number;
    userId: string;
    userEmail: string;
    productId: string;
    productName: string;
    currentPrice: number;
    targetPrice: number;
    active: boolean;
    triggeredAt: string | null;
    createdAt: string;
}

export default function AdminPriceAlertsPage() {
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ total: 0, active: 0, triggered: 0 });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/admin/price-alerts').catch(() => null);
            if (res) {
                const data = res.data.data || res.data;
                const items = Array.isArray(data) ? data : data.items || data.content || [];
                const mapped = items.map((a: any) => ({
                    id: Number(a.id), userId: String(a.userId || ''),
                    userEmail: String(a.userEmail || a.user?.email || ''),
                    productId: String(a.productId || ''),
                    productName: String(a.productName || a.product?.name || 'Unknown'),
                    currentPrice: Number(a.currentPrice || a.product?.price || 0),
                    targetPrice: Number(a.targetPrice || 0),
                    active: Boolean(a.active), triggeredAt: a.triggeredAt ? String(a.triggeredAt) : null,
                    createdAt: String(a.createdAt || ''),
                }));
                setAlerts(mapped);
                setSummary({
                    total: mapped.length,
                    active: mapped.filter((a: PriceAlert) => a.active).length,
                    triggered: mapped.filter((a: PriceAlert) => a.triggeredAt).length,
                });
            }
        } catch { toast.error('Không thể tải price alerts'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

    const columns = [
        { key: 'productName', label: 'Sản phẩm', render: (_: unknown, r: PriceAlert) => <span className="font-medium text-sm">{r.productName}</span> },
        { key: 'userEmail', label: 'Khách hàng', render: (_: unknown, r: PriceAlert) => <span className="text-sm">{r.userEmail || r.userId.slice(0, 8)}</span> },
        { key: 'currentPrice', label: 'Giá hiện tại', render: (_: unknown, r: PriceAlert) => <span className="text-sm">{fmt(r.currentPrice)}</span> },
        { key: 'targetPrice', label: 'Giá mong muốn', render: (_: unknown, r: PriceAlert) => <span className="text-sm font-medium text-green-600">{fmt(r.targetPrice)}</span> },
        {
            key: 'active', label: 'Trạng thái', render: (_: unknown, r: PriceAlert) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${r.active ? 'bg-green-100 text-green-800' : r.triggeredAt ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {r.active ? 'Đang theo dõi' : r.triggeredAt ? 'Đã thông báo' : 'Ngừng'}
                </span>
            )
        },
        { key: 'createdAt', label: 'Ngày tạo', render: (_: unknown, r: PriceAlert) => <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span> },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Price Alerts" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Price Alerts' }]} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard title="Tổng alerts" value={summary.total} icon="🔔" iconBg="bg-blue-100" />
                <StatsCard title="Đang theo dõi" value={summary.active} icon="👁️" iconBg="bg-green-100" />
                <StatsCard title="Đã trigger" value={summary.triggered} icon="✅" iconBg="bg-purple-100" />
            </div>

            <Card>
                {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={alerts} emptyMessage="Chưa có price alert nào" />}
            </Card>
        </div>
    );
}
