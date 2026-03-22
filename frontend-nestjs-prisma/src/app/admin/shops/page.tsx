'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface Shop {
    id: string;
    name: string;
    slug: string;
    ownerName: string;
    ownerEmail: string;
    verified: boolean;
    active: boolean;
    productCount: number;
    followerCount: number;
    rating: number;
    createdAt: string;
}

export default function AdminShopsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            const { data } = await apiClient.get(`/shops/search?${params.toString()}`);
            const res = data.data || data;
            const items = Array.isArray(res) ? res : res.content || res.items || [];
            setShops(items.map((s: Record<string, unknown>) => ({
                id: String(s.id), name: String(s.name || ''), slug: String(s.slug || ''),
                ownerName: String((s as Record<string, Record<string, unknown>>).owner?.fullName || s.ownerName || ''),
                ownerEmail: String((s as Record<string, Record<string, unknown>>).owner?.email || s.ownerEmail || ''),
                verified: Boolean(s.verified), active: Boolean(s.active ?? true),
                productCount: Number(s.productCount || (s as Record<string, unknown[]>).products?.length || 0),
                followerCount: Number(s.followerCount || s.followers_count || 0),
                rating: Number(s.rating || 0), createdAt: String(s.createdAt || ''),
            })));
            setTotalPages(res.totalPages || Math.ceil((res.total || items.length) / size));
            setTotalItems(res.totalElements || res.total || items.length);
        } catch { toast.error('Không thể tải danh sách shop'); }
        finally { setLoading(false); }
    }, [search, page, size]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleVerify = async (id: string) => {
        try { await apiClient.put(`/shops/${id}/verify`); toast.success('Đã xác minh shop'); fetchData(); }
        catch { toast.error('Thao tác thất bại'); }
    };
    const handleToggle = async (id: string) => {
        try { await apiClient.put(`/shops/${id}/toggle-status`); toast.success('Đã cập nhật trạng thái'); fetchData(); }
        catch { toast.error('Thao tác thất bại'); }
    };

    const columns = [
        {
            key: 'name', label: 'Shop', render: (_: unknown, r: Shop) => (
                <div><div className="font-medium flex items-center gap-2">{r.name} {r.verified && <span className="text-blue-500" title="Verified">✓</span>}</div>
                    <div className="text-xs text-gray-500">/{r.slug}</div></div>
            )
        },
        { key: 'ownerName', label: 'Chủ shop', render: (_: unknown, r: Shop) => (<div><div className="text-sm">{r.ownerName}</div><div className="text-xs text-gray-500">{r.ownerEmail}</div></div>) },
        { key: 'productCount', label: 'Sản phẩm', render: (_: unknown, r: Shop) => r.productCount },
        { key: 'followerCount', label: 'Followers', render: (_: unknown, r: Shop) => r.followerCount },
        { key: 'rating', label: 'Rating', render: (_: unknown, r: Shop) => <span className="text-yellow-500">★ {r.rating.toFixed(1)}</span> },
        { key: 'active', label: 'Trạng thái', render: (_: unknown, r: Shop) => <StatusBadge status={r.active ? 'ACTIVE' : 'INACTIVE'} /> },
        {
            key: 'actions', label: '', render: (_: unknown, r: Shop) => (
                <div className="flex gap-2">
                    {!r.verified && <button onClick={() => handleVerify(r.id)} className="text-blue-600 text-sm hover:underline">Xác minh</button>}
                    <button onClick={() => handleToggle(r.id)} className={`text-sm hover:underline ${r.active ? 'text-red-600' : 'text-green-600'}`}>
                        {r.active ? 'Tắt' : 'Bật'}
                    </button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Quản lý Shop" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Shops' }]} />
            <Card>
                <TableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Tìm shop..." totalItems={totalItems} />
                {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={shops} emptyMessage="Chưa có shop nào" />}
                <TablePagination currentPage={page + 1} totalPages={totalPages} totalItems={totalItems} pageSize={size} onPageChange={(p) => setPage(p - 1)} onPageSizeChange={setSize} />
            </Card>
        </div>
    );
}
