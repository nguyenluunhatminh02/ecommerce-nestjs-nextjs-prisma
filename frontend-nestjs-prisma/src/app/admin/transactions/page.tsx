'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface TransactionRow {
    id: string;
    orderId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    status: string;
    createdAt: string;
}

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<TransactionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);

            const { data } = await apiClient.get(`/payment/transactions?${params.toString()}`);
            const res = data.data || data;
            setTransactions(res.content || res.items || []);
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.totalElements || res.total || 0);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
            toast.error('Không thể tải danh sách giao dịch');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, sortField, sortDir]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const methodLabels: Record<string, string> = {
        COD: 'Thanh toán khi nhận hàng',
        BANK_TRANSFER: 'Chuyển khoản',
        CREDIT_CARD: 'Thẻ tín dụng',
        MOMO: 'MoMo',
        VNPAY: 'VNPay',
        ZALOPAY: 'ZaloPay',
    };

    const columns = [
        {
            key: 'id',
            label: 'Mã giao dịch',
            render: (_: unknown, row: TransactionRow) => (
                <span className="font-mono text-sm text-gray-900">#{row.id.slice(-8).toUpperCase()}</span>
            )
        },
        {
            key: 'orderId',
            label: 'Mã đơn hàng',
            render: (_: unknown, row: TransactionRow) => (
                <span className="font-mono text-sm text-indigo-600">#{row.orderId.slice(-8).toUpperCase()}</span>
            )
        },
        {
            key: 'amount',
            label: 'Số tiền',
            sortable: true,
            render: (_: unknown, row: TransactionRow) => (
                <span className="font-medium text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: row.currency || 'VND' }).format(row.amount)}
                </span>
            )
        },
        {
            key: 'paymentMethod',
            label: 'Phương thức',
            render: (_: unknown, row: TransactionRow) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {methodLabels[row.paymentMethod] || row.paymentMethod}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (_: unknown, row: TransactionRow) => <StatusBadge status={row.status} />
        },
        {
            key: 'createdAt',
            label: 'Ngày giao dịch',
            sortable: true,
            render: (_: unknown, row: TransactionRow) => (
                <span className="text-sm text-gray-500">
                    {new Date(row.createdAt).toLocaleString('vi-VN')}
                </span>
            )
        }
    ];

    return (
        <div>
            <PageHeader
                title="Giao dịch thanh toán"
                description={`Tổng cộng ${totalItems} giao dịch`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Giao dịch' }
                ]}
            />

            <Card className="mt-6">
                <TableToolbar
                    searchValue={search}
                    onSearchChange={(val) => { setSearch(val); setPage(0); }}
                    searchPlaceholder="Tìm kiếm theo mã giao dịch, đơn hàng..."
                    filters={
                        <select
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600"
                            onChange={(e) => {
                                setSortField(e.target.value);
                                setPage(0);
                            }}
                            value={sortField}
                        >
                            <option value="createdAt">Mới nhất</option>
                            <option value="amount">Số tiền</option>
                        </select>
                    }
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không tìm thấy giao dịch</p>
                        <p className="text-sm mt-1">Thử thay đổi từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={transactions}
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
