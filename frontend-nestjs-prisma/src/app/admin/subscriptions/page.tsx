'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface SubscriptionRow {
    id: string;
    userName: string;
    userEmail: string;
    plan: string | { name?: string };
    status: string;
    startDate: string;
    endDate: string;
    amount: number;
    price: number;
    name: string;
    billingCycle: string;
    active: boolean;
    createdAt: string;
}

export default function AdminSubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchSubscriptions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            if (statusFilter) params.append('status', statusFilter);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);

            const { data } = await apiClient.get(`/subscriptions/admin/all?${params.toString()}`);
            const res = data.data || data;
            setSubscriptions(Array.isArray(res) ? res : res.content || []);
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.totalElements || (Array.isArray(res) ? res.length : 0));
        } catch {
            toast.error('Không thể tải danh sách gói đăng ký');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, sortField, sortDir, statusFilter]);

    useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

    const handleSort = (field: string) => {
        if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

    const columns = [
        {
            key: 'name', label: 'Tên gói / Người dùng',
            render: (_: unknown, row: SubscriptionRow) => (
                <div>
                    <p className="font-medium text-gray-900">{row.name || row.userName || '—'}</p>
                    <p className="text-xs text-gray-500">{row.userEmail || row.billingCycle || ''}</p>
                </div>
            )
        },
        {
            key: 'plan', label: 'Gói', sortable: true,
            render: (_: unknown, row: SubscriptionRow) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                    {typeof row.plan === 'object' && row.plan ? row.plan.name || '—' : row.plan || row.name || '—'}
                </span>
            )
        },
        { key: 'status', label: 'Trạng thái', render: (_: unknown, row: SubscriptionRow) => <StatusBadge status={row.active !== undefined ? (row.active ? 'ACTIVE' : 'INACTIVE') : row.status} /> },
        {
            key: 'startDate', label: 'Ngày bắt đầu', sortable: true,
            render: (_: unknown, row: SubscriptionRow) => <span className="text-sm text-gray-600">{new Date(row.startDate).toLocaleDateString('vi-VN')}</span>
        },
        {
            key: 'endDate', label: 'Ngày kết thúc', sortable: true,
            render: (_: unknown, row: SubscriptionRow) => <span className="text-sm text-gray-600">{row.endDate ? new Date(row.endDate).toLocaleDateString('vi-VN') : '—'}</span>
        },
        {
            key: 'amount', label: 'Số tiền', sortable: true,
            render: (_: unknown, row: SubscriptionRow) => <span className="font-medium text-gray-900">{fmt(row.amount || row.price || 0)}</span>
        },
    ];

    return (
        <div>
            <PageHeader
                title="Quản lý gói đăng ký"
                description={`Tổng cộng ${totalItems} gói đăng ký`}
                breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Gói đăng ký' }]}
            />

            <Card className="mt-6">
                <TableToolbar searchValue={search} onSearchChange={(val) => { setSearch(val); setPage(0); }} searchPlaceholder="Tìm kiếm gói đăng ký..."
                    filters={
                        <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600"
                            value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                            <option value="">Tất cả trạng thái</option>
                            <option value="ACTIVE">Hoạt động</option>
                            <option value="CANCELLED">Đã hủy</option>
                            <option value="EXPIRED">Hết hạn</option>
                        </select>
                    }
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : subscriptions.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không tìm thấy gói đăng ký</p>
                        <p className="text-sm mt-1">Chưa có gói đăng ký nào được tạo</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={subscriptions} sortField={sortField} sortDirection={sortDir} onSort={handleSort} />
                )}

                {totalPages > 1 && (
                    <div className="mt-4">
                        <TablePagination currentPage={page + 1} totalPages={totalPages} totalItems={totalItems} pageSize={size}
                            onPageChange={(p) => setPage(p - 1)} onPageSizeChange={(s) => { setSize(s); setPage(0); }} />
                    </div>
                )}
            </Card>
        </div>
    );
}
