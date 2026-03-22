'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface Subscriber {
    id: string;
    email: string;
    active: boolean;
    subscribedAt: string;
}

export default function AdminNewsletterPage() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
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
            const { data } = await apiClient.get(`/newsletter/subscribers?${params.toString()}`);
            const res = data.data || data;
            const items = Array.isArray(res) ? res : res.content || res.items || [];
            setSubscribers(items.map((s: Record<string, unknown>) => ({
                id: String(s.id),
                email: String(s.email || ''),
                active: Boolean(s.active ?? true),
                subscribedAt: String(s.createdAt || s.subscribedAt || ''),
            })));
            setTotalPages(res.totalPages || Math.ceil((res.total || items.length) / size));
            setTotalItems(res.totalElements || res.total || items.length);
        } catch { toast.error('Không thể tải danh sách subscriber'); }
        finally { setLoading(false); }
    }, [search, page, size]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const columns = [
        { key: 'email', label: 'Email', render: (_: unknown, r: Subscriber) => <span className="font-medium">{r.email}</span> },
        {
            key: 'active', label: 'Trạng thái', render: (_: unknown, r: Subscriber) => (
                <span className={`px-2 py-1 text-xs rounded-full ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.active ? 'Đang đăng ký' : 'Đã hủy'}
                </span>
            )
        },
        { key: 'subscribedAt', label: 'Ngày đăng ký', render: (_: unknown, r: Subscriber) => r.subscribedAt ? new Date(r.subscribedAt).toLocaleDateString('vi-VN') : '—' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Newsletter" description={`${totalItems} subscriber`}
                breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Newsletter' }]} />
            <Card>
                <TableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Tìm email..." totalItems={totalItems} />
                {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={subscribers} emptyMessage="Chưa có subscriber nào" />}
                <TablePagination currentPage={page + 1} totalPages={totalPages} totalItems={totalItems} pageSize={size} onPageChange={(p) => setPage(p - 1)} onPageSizeChange={setSize} />
            </Card>
        </div>
    );
}
