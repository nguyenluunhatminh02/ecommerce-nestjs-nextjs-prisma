'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, ConfirmDialog, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface FlashSaleRow {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    productCount: number;
    status: string;
    createdAt: string;
}

export default function AdminFlashSalesPage() {
    const [flashSales, setFlashSales] = useState<FlashSaleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [statusFilter, setStatusFilter] = useState('');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: string; name?: string }>({ open: false });
    const [deleting, setDeleting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        startTime: '',
        endTime: '',
        description: '',
    });

    const computeStatus = (startTime: string, endTime: string) => {
        const now = new Date();
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (now < start) return 'UPCOMING';
        if (now > end) return 'ENDED';
        return 'ACTIVE';
    };

    const fetchFlashSales = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);
            if (statusFilter) params.append('status', statusFilter);

            const { data } = await apiClient.get(`/flash-sales?${params.toString()}`);
            const res = data.data || data;
            const items = Array.isArray(res) ? res : (res.content || res.items || []);
            const mapped: FlashSaleRow[] = items.map((f: Record<string, unknown>) => ({
                id: String(f.id),
                name: String(f.name || f.title || ''),
                startTime: String(f.startTime || f.startDate || ''),
                endTime: String(f.endTime || f.endDate || ''),
                productCount: Number(f.productCount || (f as Record<string, unknown[]>).products?.length || (f as Record<string, unknown[]>).items?.length || 0),
                status: String(f.status || '') || computeStatus(String(f.startTime || f.startDate), String(f.endTime || f.endDate)),
                createdAt: String(f.createdAt),
            }));
            setFlashSales(mapped);
            setTotalPages(res.totalPages || (Array.isArray(res) ? Math.ceil(res.length / size) : 0));
            setTotalItems(res.totalElements || res.total || (Array.isArray(res) ? res.length : 0));
        } catch (err) {
            console.error('Failed to fetch flash sales:', err);
            toast.error('Không thể tải danh sách flash sale');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, sortField, sortDir, statusFilter]);

    useEffect(() => {
        fetchFlashSales();
    }, [fetchFlashSales]);

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên flash sale');
            return;
        }
        if (!formData.startTime || !formData.endTime) {
            toast.error('Vui lòng chọn thời gian bắt đầu và kết thúc');
            return;
        }
        if (new Date(formData.endTime) <= new Date(formData.startTime)) {
            toast.error('Thời gian kết thúc phải sau thời gian bắt đầu');
            return;
        }
        setSaving(true);
        try {
            await apiClient.post('/flash-sales', {
                name: formData.name.trim(),
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
                description: formData.description,
            });
            toast.success('Tạo flash sale thành công');
            setShowForm(false);
            setFormData({ name: '', startTime: '', endTime: '', description: '' });
            fetchFlashSales();
        } catch (err) {
            console.error('Failed to create flash sale:', err);
            toast.error('Không thể tạo flash sale');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/flash-sales/${deleteDialog.id}`);
            toast.success('Xóa flash sale thành công');
            setDeleteDialog({ open: false });
            fetchFlashSales();
        } catch (err) {
            console.error('Failed to delete flash sale:', err);
            toast.error('Không thể xóa flash sale');
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

    const formatDateTime = (d: string) => {
        if (!d) return '—';
        return new Date(d).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const columns = [
        {
            key: 'name',
            label: 'Tên flash sale',
            sortable: true,
            render: (_: unknown, row: FlashSaleRow) => (
                <span className="font-medium text-gray-900">{row.name}</span>
            )
        },
        {
            key: 'startTime',
            label: 'Bắt đầu',
            sortable: true,
            render: (_: unknown, row: FlashSaleRow) => (
                <span className="text-sm text-gray-600">{formatDateTime(row.startTime)}</span>
            )
        },
        {
            key: 'endTime',
            label: 'Kết thúc',
            sortable: true,
            render: (_: unknown, row: FlashSaleRow) => (
                <span className="text-sm text-gray-600">{formatDateTime(row.endTime)}</span>
            )
        },
        {
            key: 'productCount',
            label: 'Sản phẩm',
            render: (_: unknown, row: FlashSaleRow) => (
                <span className="text-gray-700">{row.productCount}</span>
            )
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (_: unknown, row: FlashSaleRow) => <StatusBadge status={row.status} />
        },
        {
            key: 'actions',
            label: '',
            align: 'right' as const,
            render: (_: unknown, row: FlashSaleRow) => (
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
                title="Quản lý flash sale"
                description={`Tổng cộng ${totalItems} flash sale`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Flash Sale' }
                ]}
                actions={
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Tạo flash sale
                    </button>
                }
            />

            <Card className="mt-6">
                <TableToolbar
                    searchValue={search}
                    onSearchChange={(val) => { setSearch(val); setPage(0); }}
                    searchPlaceholder="Tìm kiếm flash sale..."
                    filters={
                        <div className="flex items-center gap-2">
                            <select
                                className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="UPCOMING">Sắp diễn ra</option>
                                <option value="ACTIVE">Đang diễn ra</option>
                                <option value="ENDED">Đã kết thúc</option>
                            </select>
                        </div>
                    }
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : flashSales.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không tìm thấy flash sale</p>
                        <p className="text-sm mt-1">Tạo flash sale đầu tiên</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={flashSales}
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

            {/* Create Flash Sale Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tạo flash sale mới</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên flash sale</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="VD: Flash Sale cuối tuần"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    rows={2}
                                    placeholder="Mô tả flash sale"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData(p => ({ ...p, startTime: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian kết thúc</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData(p => ({ ...p, endTime: e.target.value }))}
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
                                {saving ? 'Đang tạo...' : 'Tạo flash sale'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={deleteDialog.open}
                title="Xóa flash sale"
                message={`Bạn có chắc chắn muốn xóa flash sale "${deleteDialog.name}"? Hành động này không thể hoàn tác.`}
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false })}
                loading={deleting}
            />
        </div>
    );
}
