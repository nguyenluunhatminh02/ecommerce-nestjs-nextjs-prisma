'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, ConfirmDialog, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface OrderRow {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    subtotal: number;
    shippingFee: number;
    tax: number;
    discount: number;
    totalAmount: number;
    note: string | null;
    items: { id: string; productName: string; quantity: number; price: number; shopName: string }[];
    shippingFullName: string | null;
    shippingPhone: string | null;
    shippingCity: string | null;
    createdAt: string;
}

const ORDER_STATUSES = [
    { label: 'Tất cả', value: '' },
    { label: 'Chờ xác nhận', value: 'PENDING' },
    { label: 'Đã xác nhận', value: 'CONFIRMED' },
    { label: 'Đang xử lý', value: 'PROCESSING' },
    { label: 'Đã bàn giao vận chuyển', value: 'SHIPPED' },
    { label: 'Đang vận chuyển', value: 'IN_TRANSIT' },
    { label: 'Đang giao tới khách', value: 'OUT_FOR_DELIVERY' },
    { label: 'Đã giao', value: 'DELIVERED' },
    { label: 'Đã hủy', value: 'CANCELLED' },
    { label: 'Hoàn trả', value: 'RETURNED' },
];

const NEXT_STATUS_MAP: Record<string, { label: string; value: string }[]> = {
    PENDING: [{ label: 'Xác nhận', value: 'CONFIRMED' }, { label: 'Hủy đơn', value: 'CANCELLED' }],
    CONFIRMED: [{ label: 'Xử lý', value: 'PROCESSING' }, { label: 'Hủy đơn', value: 'CANCELLED' }],
    PROCESSING: [{ label: 'Bàn giao vận chuyển', value: 'SHIPPED' }, { label: 'Hủy đơn', value: 'CANCELLED' }],
    SHIPPED: [{ label: 'Đang vận chuyển', value: 'IN_TRANSIT' }],
    IN_TRANSIT: [{ label: 'Đang giao tới khách', value: 'OUT_FOR_DELIVERY' }],
    OUT_FOR_DELIVERY: [{ label: 'Đã giao', value: 'DELIVERED' }],
    DELIVERED: [{ label: 'Hoàn trả', value: 'RETURNED' }],
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [statusDialog, setStatusDialog] = useState<{ open: boolean; orderId?: string; orderNumber?: string; newStatus?: string }>({ open: false });
    const [updating, setUpdating] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/orders/admin/all', {
                params: { page, limit: size, status: statusFilter || undefined }
            });
            const res = data.data || data;
            const orderList = res.items || res.content || [];
            setOrders(orderList);
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.total || res.totalElements || 0);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            toast.error('Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    }, [page, size, statusFilter]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleUpdateStatus = async () => {
        if (!statusDialog.orderId || !statusDialog.newStatus) return;
        setUpdating(true);
        try {
            await apiClient.patch(`/orders/${statusDialog.orderId}/status`, { status: statusDialog.newStatus });
            toast.success(`Cập nhật trạng thái đơn hàng thành công`);
            setStatusDialog({ open: false });
            fetchOrders();
        } catch (err) {
            console.error('Failed to update order status:', err);
            toast.error('Không thể cập nhật trạng thái');
        } finally {
            setUpdating(false);
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const columns = [
        {
            key: 'orderNumber',
            label: 'Mã đơn hàng',
            render: (_: unknown, row: OrderRow) => (
                <div>
                    <span className="font-medium text-indigo-600">{row.orderNumber}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(row.createdAt)}</p>
                </div>
            )
        },
        {
            key: 'customer',
            label: 'Khách hàng',
            render: (_: unknown, row: OrderRow) => (
                <div>
                    <p className="font-medium text-gray-900">{row.shippingFullName || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{row.shippingPhone || ''}</p>
                </div>
            )
        },
        {
            key: 'items',
            label: 'Sản phẩm',
            render: (_: unknown, row: OrderRow) => (
                <div className="text-sm">
                    <span className="text-gray-700">{row.items?.length || 0} sản phẩm</span>
                    {row.items?.length > 0 && (
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">
                            {row.items.map(i => i.productName).join(', ')}
                        </p>
                    )}
                </div>
            )
        },
        {
            key: 'total',
            label: 'Tổng tiền',
            render: (_: unknown, row: OrderRow) => (
                <span className="font-semibold text-gray-900">{formatCurrency(row.totalAmount)}</span>
            )
        },
        {
            key: 'paymentMethod',
            label: 'Thanh toán',
            render: (_: unknown, row: OrderRow) => (
                <div>
                    <StatusBadge status={row.paymentStatus} size="sm" />
                    <p className="text-xs text-gray-400 mt-0.5">{row.paymentMethod}</p>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (_: unknown, row: OrderRow) => <StatusBadge status={row.status} />
        },
        {
            key: 'actions',
            label: 'Thao tác',
            align: 'right' as const,
            render: (_: unknown, row: OrderRow) => {
                const nextStatuses = NEXT_STATUS_MAP[row.status] || [];
                if (nextStatuses.length === 0) return <span className="text-xs text-gray-400">—</span>;
                return (
                    <div className="flex items-center gap-1 justify-end">
                        {nextStatuses.map(ns => (
                            <button
                                key={ns.value}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setStatusDialog({ open: true, orderId: row.id, orderNumber: row.orderNumber, newStatus: ns.value });
                                }}
                                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                                    ns.value === 'CANCELLED'
                                        ? 'text-red-700 bg-red-50 hover:bg-red-100'
                                        : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                                }`}
                            >
                                {ns.label}
                            </button>
                        ))}
                    </div>
                );
            }
        }
    ];

    return (
        <div>
            <PageHeader
                title="Quản lý đơn hàng"
                description={`Tổng cộng ${totalItems} đơn hàng`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Đơn hàng' }
                ]}
            />

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 mt-6 mb-4 overflow-x-auto pb-2">
                {ORDER_STATUSES.map(s => (
                    <button
                        key={s.value}
                        onClick={() => { setStatusFilter(s.value); setPage(0); }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                            statusFilter === s.value
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <Card>
                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        <p className="text-lg font-medium">Không tìm thấy đơn hàng</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={orders}
                        onRowClick={(row) => setExpandedOrder(expandedOrder === row.id ? null : row.id)}
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

            <ConfirmDialog
                open={statusDialog.open}
                title="Cập nhật trạng thái đơn hàng"
                message={`Bạn có chắc chắn muốn chuyển đơn hàng ${statusDialog.orderNumber} sang trạng thái "${
                    ORDER_STATUSES.find(s => s.value === statusDialog.newStatus)?.label || statusDialog.newStatus
                }"?`}
                confirmLabel="Xác nhận"
                variant={statusDialog.newStatus === 'CANCELLED' ? 'danger' : 'info'}
                onConfirm={handleUpdateStatus}
                onCancel={() => setStatusDialog({ open: false })}
                loading={updating}
            />
        </div>
    );
}
