'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, ConfirmDialog, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface CouponRow {
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    minOrderAmount: number | null;
    usageCount: number;
    usageLimit: number | null;
    startDate: string | null;
    endDate: string | null;
    status: string;
    createdAt: string;
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<CouponRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: string; code?: string }>({ open: false });
    const [deleting, setDeleting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        minOrderAmount: 0,
        usageLimit: 0,
        startDate: '',
        endDate: '',
    });

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);

            const { data } = await apiClient.get(`/coupons?${params.toString()}`);
            const res = data.data || data;
            const items = res.content || res.items || [];
            const mapped: CouponRow[] = items.map((c: Record<string, unknown>) => ({
                id: c.id,
                code: c.code,
                discountType: String(c.discountType || c.type || 'PERCENTAGE'),
                discountValue: Number(c.discountValue || c.value || 0),
                minOrderAmount: c.minOrderAmount != null ? Number(c.minOrderAmount) : null,
                usageCount: Number(c.usageCount || c.timesUsed || 0),
                usageLimit: c.usageLimit != null ? Number(c.usageLimit) : null,
                startDate: c.startDate ? String(c.startDate) : null,
                endDate: c.endDate ? String(c.endDate) : null,
                status: String(c.status || (c.isActive ? 'ACTIVE' : 'INACTIVE')),
                createdAt: String(c.createdAt),
            }));
            setCoupons(mapped);
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.totalElements || res.total || 0);
        } catch (err) {
            console.error('Failed to fetch coupons:', err);
            toast.error('Không thể tải danh sách mã giảm giá');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, sortField, sortDir]);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const handleCreate = async () => {
        if (!formData.code.trim()) {
            toast.error('Vui lòng nhập mã giảm giá');
            return;
        }
        if (formData.discountValue <= 0) {
            toast.error('Giá trị giảm giá phải lớn hơn 0');
            return;
        }
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                code: formData.code.toUpperCase().trim(),
                discountType: formData.discountType,
                discountValue: formData.discountValue,
            };
            if (formData.minOrderAmount > 0) payload.minOrderAmount = formData.minOrderAmount;
            if (formData.usageLimit > 0) payload.usageLimit = formData.usageLimit;
            if (formData.startDate) payload.startDate = new Date(formData.startDate).toISOString();
            if (formData.endDate) payload.endDate = new Date(formData.endDate).toISOString();

            await apiClient.post('/coupons', payload);
            toast.success('Tạo mã giảm giá thành công');
            setShowForm(false);
            setFormData({ code: '', discountType: 'PERCENTAGE', discountValue: 0, minOrderAmount: 0, usageLimit: 0, startDate: '', endDate: '' });
            fetchCoupons();
        } catch (err) {
            console.error('Failed to create coupon:', err);
            toast.error('Không thể tạo mã giảm giá');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/coupons/${deleteDialog.id}`);
            toast.success('Xóa mã giảm giá thành công');
            setDeleteDialog({ open: false });
            fetchCoupons();
        } catch (err) {
            console.error('Failed to delete coupon:', err);
            toast.error('Không thể xóa mã giảm giá');
        } finally {
            setDeleting(false);
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

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

    const columns = [
        {
            key: 'code',
            label: 'Mã giảm giá',
            sortable: true,
            render: (_: unknown, row: CouponRow) => (
                <span className="font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{row.code}</span>
            )
        },
        {
            key: 'discountType',
            label: 'Loại',
            render: (_: unknown, row: CouponRow) => (
                <span className="text-gray-700">
                    {row.discountType === 'PERCENTAGE' ? 'Phần trăm (%)' : 'Cố định (₫)'}
                </span>
            )
        },
        {
            key: 'discountValue',
            label: 'Giá trị',
            sortable: true,
            render: (_: unknown, row: CouponRow) => (
                <span className="font-medium text-gray-900">
                    {row.discountType === 'PERCENTAGE' ? `${row.discountValue}%` : formatCurrency(row.discountValue)}
                </span>
            )
        },
        {
            key: 'minOrderAmount',
            label: 'Đơn tối thiểu',
            render: (_: unknown, row: CouponRow) => (
                <span className="text-gray-600">
                    {row.minOrderAmount ? formatCurrency(row.minOrderAmount) : '—'}
                </span>
            )
        },
        {
            key: 'usageCount',
            label: 'Sử dụng',
            render: (_: unknown, row: CouponRow) => (
                <span className="text-gray-700">
                    {row.usageCount}{row.usageLimit ? ` / ${row.usageLimit}` : ''}
                </span>
            )
        },
        {
            key: 'endDate',
            label: 'Hạn sử dụng',
            sortable: true,
            render: (_: unknown, row: CouponRow) => (
                <span className={`text-sm ${row.endDate && new Date(row.endDate) < new Date() ? 'text-red-500' : 'text-gray-600'}`}>
                    {row.endDate ? new Date(row.endDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (_: unknown, row: CouponRow) => <StatusBadge status={row.status} />
        },
        {
            key: 'actions',
            label: '',
            align: 'right' as const,
            render: (_: unknown, row: CouponRow) => (
                <div className="flex items-center gap-2 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id: row.id, code: row.code }); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Xóa"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            )
        }
    ];

    return (
        <div>
            <PageHeader
                title="Quản lý mã giảm giá"
                description={`Tổng cộng ${totalItems} mã giảm giá`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Mã giảm giá' }
                ]}
                actions={
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Tạo mã giảm giá
                    </button>
                }
            />

            <Card className="mt-6">
                <TableToolbar
                    searchValue={search}
                    onSearchChange={(val) => { setSearch(val); setPage(0); }}
                    searchPlaceholder="Tìm kiếm mã giảm giá..."
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : coupons.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không tìm thấy mã giảm giá</p>
                        <p className="text-sm mt-1">Tạo mã giảm giá đầu tiên</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={coupons}
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

            {/* Create Coupon Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tạo mã giảm giá mới</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mã giảm giá</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono uppercase"
                                    placeholder="VD: SALE20"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
                                    <select
                                        value={formData.discountType}
                                        onChange={(e) => setFormData(p => ({ ...p, discountType: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="PERCENTAGE">Phần trăm (%)</option>
                                        <option value="FIXED">Cố định (₫)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị</label>
                                    <input
                                        type="number"
                                        value={formData.discountValue || ''}
                                        onChange={(e) => setFormData(p => ({ ...p, discountValue: Number(e.target.value) }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder={formData.discountType === 'PERCENTAGE' ? 'VD: 20' : 'VD: 50000'}
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (₫)</label>
                                    <input
                                        type="number"
                                        value={formData.minOrderAmount || ''}
                                        onChange={(e) => setFormData(p => ({ ...p, minOrderAmount: Number(e.target.value) }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0 = không giới hạn"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn sử dụng</label>
                                    <input
                                        type="number"
                                        value={formData.usageLimit || ''}
                                        onChange={(e) => setFormData(p => ({ ...p, usageLimit: Number(e.target.value) }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0 = không giới hạn"
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={saving}
                                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {saving ? 'Đang tạo...' : 'Tạo mã'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={deleteDialog.open}
                title="Xóa mã giảm giá"
                message={`Bạn có chắc chắn muốn xóa mã "${deleteDialog.code}"? Hành động này không thể hoàn tác.`}
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false })}
                loading={deleting}
            />
        </div>
    );
}
