'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    Card, ConfirmDialog, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface AttributeRow {
    id: string;
    name: string;
    type: string;
    values: { id: string; value: string }[];
    createdAt: string;
}

export default function AdminAttributesPage() {
    const [attributes, setAttributes] = useState<AttributeRow[]>([]);
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
    const [formData, setFormData] = useState({ name: '', type: 'text' });
    const [submitting, setSubmitting] = useState(false);

    const fetchAttributes = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);

            const { data } = await apiClient.get(`/attributes?${params.toString()}`);
            const res = data.data || data;
            setAttributes(res.content || res.items || []);
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.totalElements || res.total || 0);
        } catch (err) {
            console.error('Failed to fetch attributes:', err);
            toast.error('Không thể tải danh sách thuộc tính');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, sortField, sortDir]);

    useEffect(() => {
        fetchAttributes();
    }, [fetchAttributes]);

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/attributes/${deleteDialog.id}`);
            toast.success('Xóa thuộc tính thành công');
            setDeleteDialog({ open: false });
            fetchAttributes();
        } catch (err) {
            console.error('Failed to delete attribute:', err);
            toast.error('Không thể xóa thuộc tính');
        } finally {
            setDeleting(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên thuộc tính');
            return;
        }
        setSubmitting(true);
        try {
            await apiClient.post('/attributes', formData);
            toast.success('Tạo thuộc tính thành công');
            setShowForm(false);
            setFormData({ name: '', type: 'text' });
            fetchAttributes();
        } catch (err) {
            console.error('Failed to create attribute:', err);
            toast.error('Không thể tạo thuộc tính');
        } finally {
            setSubmitting(false);
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

    const typeLabels: Record<string, string> = {
        text: 'Văn bản',
        select: 'Lựa chọn',
        color: 'Màu sắc',
    };

    const columns = [
        {
            key: 'name',
            label: 'Tên thuộc tính',
            sortable: true,
            render: (_: unknown, row: AttributeRow) => (
                <span className="font-medium text-gray-900">{row.name}</span>
            )
        },
        {
            key: 'type',
            label: 'Loại',
            render: (_: unknown, row: AttributeRow) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {typeLabels[row.type] || row.type}
                </span>
            )
        },
        {
            key: 'values',
            label: 'Số giá trị',
            render: (_: unknown, row: AttributeRow) => (
                <span className="font-medium text-gray-700">{row.values?.length ?? 0}</span>
            )
        },
        {
            key: 'createdAt',
            label: 'Ngày tạo',
            sortable: true,
            render: (_: unknown, row: AttributeRow) => (
                <span className="text-sm text-gray-500">
                    {new Date(row.createdAt).toLocaleDateString('vi-VN')}
                </span>
            )
        },
        {
            key: 'actions',
            label: '',
            align: 'right' as const,
            render: (_: unknown, row: AttributeRow) => (
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
                title="Quản lý thuộc tính"
                description={`Tổng cộng ${totalItems} thuộc tính`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Thuộc tính' }
                ]}
            />

            <Card className="mt-6">
                <TableToolbar
                    searchValue={search}
                    onSearchChange={(val) => { setSearch(val); setPage(0); }}
                    searchPlaceholder="Tìm kiếm thuộc tính..."
                    filters={
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            + Thêm thuộc tính
                        </button>
                    }
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : attributes.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không tìm thấy thuộc tính</p>
                        <p className="text-sm mt-1">Thử thay đổi từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={attributes}
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

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">Thêm thuộc tính mới</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên thuộc tính</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="VD: Kích thước, Màu sắc..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại thuộc tính</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="text">Văn bản</option>
                                    <option value="select">Lựa chọn</option>
                                    <option value="color">Màu sắc</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => { setShowForm(false); setFormData({ name: '', type: 'text' }); }}
                                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={submitting}
                                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {submitting ? 'Đang tạo...' : 'Tạo mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={deleteDialog.open}
                title="Xóa thuộc tính"
                message={`Bạn có chắc chắn muốn xóa thuộc tính "${deleteDialog.name}"? Hành động này không thể hoàn tác.`}
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false })}
                loading={deleting}
            />
        </div>
    );
}
