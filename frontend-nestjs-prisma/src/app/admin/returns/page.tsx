'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface ReturnRow {
    id: string;
    orderId: string;
    customerName: string;
    customerEmail: string;
    reason: string;
    status: string;
    createdAt: string;
}

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'REJECTED', label: 'Từ chối' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
];

export default function AdminReturnsPage() {
    const [returns, setReturns] = useState<ReturnRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchReturns = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            if (statusFilter) params.append('status', statusFilter);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);

            const { data } = await apiClient.get(`/returns?${params.toString()}`);
            const res = data.data || data;
            setReturns(res.content || res.items || []);
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.totalElements || res.total || 0);
        } catch (err) {
            console.error('Failed to fetch returns:', err);
            toast.error('Không thể tải danh sách hoàn trả');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, page, size, sortField, sortDir]);

    useEffect(() => {
        fetchReturns();
    }, [fetchReturns]);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            await apiClient.put(`/returns/${id}/status`, { status: newStatus });
            toast.success('Cập nhật trạng thái thành công');
            fetchReturns();
        } catch (err) {
            console.error('Failed to update return status:', err);
            toast.error('Không thể cập nhật trạng thái');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const columns = [
        {
            key: 'id',
            label: 'Mã hoàn trả',
            render: (_: unknown, row: ReturnRow) => (
                <span className="font-mono text-sm text-gray-900">#{String(row.id).slice(-8).toUpperCase()}</span>
            )
        },
        {
            key: 'orderId',
            label: 'Mã đơn hàng',
            render: (_: unknown, row: ReturnRow) => (
                <span className="font-mono text-sm text-indigo-600">#{String(row.orderId).slice(-8).toUpperCase()}</span>
            )
        },
        {
            key: 'customerName',
            label: 'Khách hàng',
            render: (_: unknown, row: ReturnRow) => (
                <div>
                    <p className="font-medium text-gray-900">{row.customerName || '—'}</p>
                    <p className="text-xs text-gray-500">{row.customerEmail || ''}</p>
                </div>
            )
        },
        {
            key: 'reason',
            label: 'Lý do',
            render: (_: unknown, row: ReturnRow) => (
                <span className="text-gray-600 truncate max-w-[200px] block">{row.reason || '—'}</span>
            )
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (_: unknown, row: ReturnRow) => <StatusBadge status={row.status} />
        },
        {
            key: 'createdAt',
            label: 'Ngày tạo',
            sortable: true,
            render: (_: unknown, row: ReturnRow) => (
                <span className="text-sm text-gray-500">
                    {new Date(row.createdAt).toLocaleDateString('vi-VN')}
                </span>
            )
        },
        {
            key: 'actions',
            label: '',
            align: 'right' as const,
            render: (_: unknown, row: ReturnRow) => (
                <div className="flex items-center gap-1 justify-end">
                    {row.status === 'PENDING' && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(row.id, 'APPROVED'); }}
                                disabled={updatingId === row.id}
                                className="px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                                title="Duyệt"
                            >
                                Duyệt
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(row.id, 'REJECTED'); }}
                                disabled={updatingId === row.id}
                                className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                title="Từ chối"
                            >
                                Từ chối
                            </button>
                        </>
                    )}
                    {row.status === 'APPROVED' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(row.id, 'COMPLETED'); }}
                            disabled={updatingId === row.id}
                            className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                            title="Hoàn thành"
                        >
                            Hoàn thành
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div>
            <PageHeader
                title="Quản lý hoàn trả"
                description={`Tổng cộng ${totalItems} yêu cầu hoàn trả`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Hoàn trả' }
                ]}
            />

            <Card className="mt-6">
                <TableToolbar
                    searchValue={search}
                    onSearchChange={(val) => { setSearch(val); setPage(0); }}
                    searchPlaceholder="Tìm kiếm theo mã đơn, khách hàng..."
                    filters={
                        <select
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    }
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : returns.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không tìm thấy yêu cầu hoàn trả</p>
                        <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={returns}
                        sortField={sortField}
                        sortDirection={sortDir}
                        onSort={handleSort}
                    />
                )}

                {totalPages > 1 && (
                    <div className="mt-4">
                        <TablePagination
                            currentPage={page + 1}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            pageSize={size}
                            onPageChange={(p) => setPage(p - 1)}
                            onPageSizeChange={(s) => { setSize(s); setPage(0); }}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
