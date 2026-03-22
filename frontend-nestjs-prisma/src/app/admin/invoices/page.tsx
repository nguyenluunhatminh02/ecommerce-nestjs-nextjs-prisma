'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface InvoiceRow {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    status: string;
    createdAt: string;
}

export default function AdminInvoicesPage() {
    const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);
            if (statusFilter) params.append('paymentStatus', statusFilter);

            const { data } = await apiClient.get(`/orders?${params.toString()}`);
            const res = data.data || data;
            const orders = res.content || res.items || [];
            const mapped: InvoiceRow[] = orders.map((o: Record<string, unknown>) => ({
                id: o.id,
                orderNumber: o.orderNumber || `INV-${String(o.id).slice(0, 8).toUpperCase()}`,
                customerName: (o as Record<string, Record<string, string>>).user?.name || (o as Record<string, string>).customerName || 'N/A',
                customerEmail: (o as Record<string, Record<string, string>>).user?.email || (o as Record<string, string>).customerEmail || '',
                totalAmount: Number(o.totalAmount) || 0,
                status: (o as Record<string, string>).paymentStatus || ((o as Record<string, string>).status === 'COMPLETED' ? 'PAID' : 'UNPAID'),
                createdAt: String(o.createdAt),
            }));
            setInvoices(mapped);
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.totalElements || res.total || 0);
        } catch (err) {
            console.error('Failed to fetch invoices:', err);
            toast.error('Không thể tải danh sách hóa đơn');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, sortField, sortDir, statusFilter]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

    const columns = [
        {
            key: 'orderNumber',
            label: 'Mã hóa đơn',
            sortable: true,
            render: (_: unknown, row: InvoiceRow) => (
                <span className="font-medium text-indigo-600">{row.orderNumber}</span>
            )
        },
        {
            key: 'id',
            label: 'Order ID',
            render: (_: unknown, row: InvoiceRow) => (
                <span className="text-xs text-gray-500 font-mono">{String(row.id).slice(0, 8)}...</span>
            )
        },
        {
            key: 'customerName',
            label: 'Khách hàng',
            render: (_: unknown, row: InvoiceRow) => (
                <div>
                    <p className="font-medium text-gray-900">{row.customerName}</p>
                    <p className="text-xs text-gray-500">{row.customerEmail}</p>
                </div>
            )
        },
        {
            key: 'totalAmount',
            label: 'Số tiền',
            sortable: true,
            render: (_: unknown, row: InvoiceRow) => (
                <span className="font-medium text-gray-900">{formatCurrency(row.totalAmount)}</span>
            )
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (_: unknown, row: InvoiceRow) => <StatusBadge status={row.status} />
        },
        {
            key: 'createdAt',
            label: 'Ngày tạo',
            sortable: true,
            render: (_: unknown, row: InvoiceRow) => (
                <span className="text-sm text-gray-600">
                    {new Date(row.createdAt).toLocaleDateString('vi-VN')}
                </span>
            )
        },
    ];

    return (
        <div>
            <PageHeader
                title="Quản lý hóa đơn"
                description={`Tổng cộng ${totalItems} hóa đơn`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Hóa đơn' }
                ]}
            />

            <Card className="mt-6">
                <TableToolbar
                    searchValue={search}
                    onSearchChange={(val) => { setSearch(val); setPage(0); }}
                    searchPlaceholder="Tìm kiếm hóa đơn..."
                    filters={
                        <div className="flex items-center gap-2">
                            <select
                                className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="PAID">Đã thanh toán</option>
                                <option value="UNPAID">Chưa thanh toán</option>
                            </select>
                        </div>
                    }
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : invoices.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không tìm thấy hóa đơn</p>
                        <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={invoices}
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
