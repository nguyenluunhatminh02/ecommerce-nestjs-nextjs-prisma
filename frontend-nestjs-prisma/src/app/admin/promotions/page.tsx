'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, ConfirmDialog, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface PromotionRow {
    id: string;
    name: string;
    type: string;
    discountType: string;
    discountValue: number;
    startDate: string;
    endDate: string;
    status: string;
    productCount: number;
    createdAt: string;
}

export default function AdminPromotionsPage() {
    const [promotions, setPromotions] = useState<PromotionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: string; name?: string }>({ open: false });
    const [deleting, setDeleting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'DISCOUNT',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        startDate: '',
        endDate: '',
        description: '',
    });

    const fetchPromotions = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);

            const { data } = await apiClient.get(`/promotions?${params.toString()}`);
            const res = data.data || data;
            const items = res.content || res.items || [];
            const mapped: PromotionRow[] = items.map((p: Record<string, unknown>) => {
                const now = new Date();
                const start = p.startDate ? new Date(String(p.startDate)) : null;
                const end = p.endDate ? new Date(String(p.endDate)) : null;
                let status = String(p.status || '');
                if (!status || status === 'undefined') {
                    if (end && end < now) status = 'ENDED';
                    else if (start && start > now) status = 'UPCOMING';
                    else status = 'ACTIVE';
                }
                return {
                    id: String(p.id),
                    name: String(p.name || ''),
                    type: String(p.type || 'DISCOUNT'),
                    discountType: String(p.discountType || 'PERCENTAGE'),
                    discountValue: Number(p.discountValue || p.value || 0),
                    startDate: String(p.startDate || ''),
                    endDate: String(p.endDate || ''),
                    status,
                    productCount: Number(p.productCount || (p as Record<string, unknown[]>).products?.length || 0),
                    createdAt: String(p.createdAt),
                };
            });
            setPromotions(mapped);
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.totalElements || res.total || 0);
        } catch (err) {
            console.error('Failed to fetch promotions:', err);
            toast.error('Không thể tải danh sách khuyến mãi');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, sortField, sortDir]);

    useEffect(() => {
        fetchPromotions();
    }, [fetchPromotions]);

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên khuyến mãi');
            return;
        }
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                name: formData.name.trim(),
                type: formData.type,
                discountType: formData.discountType,
                discountValue: formData.discountValue,
                description: formData.description,
            };
            if (formData.startDate) payload.startDate = new Date(formData.startDate).toISOString();
            if (formData.endDate) payload.endDate = new Date(formData.endDate).toISOString();

            await apiClient.post('/promotions', payload);
            toast.success('Tạo khuyến mãi thành công');
            setShowForm(false);
            setFormData({ name: '', type: 'DISCOUNT', discountType: 'PERCENTAGE', discountValue: 0, startDate: '', endDate: '', description: '' });
            fetchPromotions();
        } catch (err) {
            console.error('Failed to create promotion:', err);
            toast.error('Không thể tạo khuyến mãi');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/promotions/${deleteDialog.id}`);
            toast.success('Xóa khuyến mãi thành công');
            setDeleteDialog({ open: false });
            fetchPromotions();
        } catch (err) {
            console.error('Failed to delete promotion:', err);
            toast.error('Không thể xóa khuyến mãi');
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
            key: 'name',
            label: 'Tên khuyến mãi',
            sortable: true,
            render: (_: unknown, row: PromotionRow) => (
                <span className="font-medium text-gray-900">{row.name}</span>
            )
        },
        {
            key: 'type',
            label: 'Loại',
            render: (_: unknown, row: PromotionRow) => (
                <span className="text-sm text-gray-600 capitalize">{row.type.toLowerCase()}</span>
            )
        },
        {
            key: 'discountValue',
            label: 'Giảm giá',
            sortable: true,
            render: (_: unknown, row: PromotionRow) => (
                <span className="font-medium text-gray-900">
                    {row.discountType === 'PERCENTAGE' ? `${row.discountValue}%` : formatCurrency(row.discountValue)}
                </span>
            )
        },
        {
            key: 'startDate',
            label: 'Bắt đầu',
            sortable: true,
            render: (_: unknown, row: PromotionRow) => (
                <span className="text-sm text-gray-600">
                    {row.startDate ? new Date(row.startDate).toLocaleDateString('vi-VN') : '—'}
                </span>
            )
        },
        {
            key: 'endDate',
            label: 'Kết thúc',
            sortable: true,
            render: (_: unknown, row: PromotionRow) => (
                <span className="text-sm text-gray-600">
                    {row.endDate ? new Date(row.endDate).toLocaleDateString('vi-VN') : '—'}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (_: unknown, row: PromotionRow) => <StatusBadge status={row.status} />
        },
        {
            key: 'productCount',
            label: 'Sản phẩm',
            render: (_: unknown, row: PromotionRow) => (
                <span className="text-gray-700">{row.productCount}</span>
            )
        },
        {
            key: 'actions',
            label: '',
            align: 'right' as const,
            render: (_: unknown, row: PromotionRow) => (
                <div className="flex items-center gap-2 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id: row.id, name: row.name }); }}
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
                title="Quản lý khuyến mãi"
                description={`Tổng cộng ${totalItems} khuyến mãi`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Khuyến mãi' }
                ]}
                actions={
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Tạo khuyến mãi
                    </button>
                }
            />

            <Card className="mt-6">
                <TableToolbar
                    searchValue={search}
                    onSearchChange={(val) => { setSearch(val); setPage(0); }}
                    searchPlaceholder="Tìm kiếm khuyến mãi..."
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : promotions.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không tìm thấy khuyến mãi</p>
                        <p className="text-sm mt-1">Tạo khuyến mãi đầu tiên</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={promotions}
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

            {/* Create Promotion Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tạo khuyến mãi mới</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khuyến mãi</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="VD: Giảm giá mùa hè"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    rows={2}
                                    placeholder="Mô tả khuyến mãi"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="DISCOUNT">Giảm giá</option>
                                        <option value="BUY_X_GET_Y">Mua X tặng Y</option>
                                        <option value="FREE_SHIPPING">Miễn phí vận chuyển</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm</label>
                                    <select
                                        value={formData.discountType}
                                        onChange={(e) => setFormData(p => ({ ...p, discountType: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="PERCENTAGE">%</option>
                                        <option value="FIXED">₫</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị</label>
                                    <input
                                        type="number"
                                        value={formData.discountValue || ''}
                                        onChange={(e) => setFormData(p => ({ ...p, discountValue: Number(e.target.value) }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc</label>
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
                                {saving ? 'Đang tạo...' : 'Tạo khuyến mãi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={deleteDialog.open}
                title="Xóa khuyến mãi"
                message={`Bạn có chắc chắn muốn xóa khuyến mãi "${deleteDialog.name}"? Hành động này không thể hoàn tác.`}
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false })}
                loading={deleting}
            />
        </div>
    );
}
