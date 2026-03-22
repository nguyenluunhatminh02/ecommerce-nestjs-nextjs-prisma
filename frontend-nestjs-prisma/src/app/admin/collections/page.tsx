'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, ConfirmDialog, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface CollectionRow {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    productCount: number;
    status: string;
    createdAt: string;
}

export default function AdminCollectionsPage() {
    const [collections, setCollections] = useState<CollectionRow[]>([]);
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
    const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchCollections = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);

            const { data } = await apiClient.get(`/collections?${params.toString()}`);
            const res = data.data || data;
            const list = Array.isArray(res) ? res : (res.content || res.items || []);
            setCollections(list);
            setTotalPages(res.totalPages || (Array.isArray(res) ? Math.ceil(res.length / size) : 0));
            setTotalItems(res.totalElements || res.total || (Array.isArray(res) ? res.length : 0));
        } catch (err) {
            console.error('Failed to fetch collections:', err);
            toast.error('Không thể tải danh sách bộ sưu tập');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, sortField, sortDir]);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/collections/${deleteDialog.id}`);
            toast.success('Xóa bộ sưu tập thành công');
            setDeleteDialog({ open: false });
            fetchCollections();
        } catch (err) {
            console.error('Failed to delete collection:', err);
            toast.error('Không thể xóa bộ sưu tập');
        } finally {
            setDeleting(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên bộ sưu tập');
            return;
        }
        setSubmitting(true);
        try {
            await apiClient.post('/collections', formData);
            toast.success('Tạo bộ sưu tập thành công');
            setShowForm(false);
            setFormData({ name: '', slug: '', description: '' });
            fetchCollections();
        } catch (err) {
            console.error('Failed to create collection:', err);
            toast.error('Không thể tạo bộ sưu tập');
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

    const columns = [
        {
            key: 'name',
            label: 'Tên bộ sưu tập',
            sortable: true,
            render: (_: unknown, row: CollectionRow) => (
                <span className="font-medium text-gray-900">{row.name}</span>
            )
        },
        {
            key: 'slug',
            label: 'Slug',
            render: (_: unknown, row: CollectionRow) => (
                <span className="text-sm text-gray-500 font-mono">{row.slug}</span>
            )
        },
        {
            key: 'description',
            label: 'Mô tả',
            render: (_: unknown, row: CollectionRow) => (
                <span className="text-gray-600 truncate max-w-[200px] block">{row.description || '—'}</span>
            )
        },
        {
            key: 'productCount',
            label: 'Số sản phẩm',
            sortable: true,
            render: (_: unknown, row: CollectionRow) => (
                <span className="font-medium text-gray-700">{row.productCount ?? 0}</span>
            )
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (_: unknown, row: CollectionRow) => <StatusBadge status={row.status} />
        },
        {
            key: 'createdAt',
            label: 'Ngày tạo',
            sortable: true,
            render: (_: unknown, row: CollectionRow) => (
                <span className="text-sm text-gray-500">
                    {new Date(row.createdAt).toLocaleDateString('vi-VN')}
                </span>
            )
        },
        {
            key: 'actions',
            label: '',
            align: 'right' as const,
            render: (_: unknown, row: CollectionRow) => (
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
                title="Quản lý bộ sưu tập"
                description={`Tổng cộng ${totalItems} bộ sưu tập`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Bộ sưu tập' }
                ]}
            />

            <Card className="mt-6">
                <TableToolbar
                    searchValue={search}
                    onSearchChange={(val) => { setSearch(val); setPage(0); }}
                    searchPlaceholder="Tìm kiếm bộ sưu tập..."
                    filters={
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            + Thêm bộ sưu tập
                        </button>
                    }
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : collections.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không tìm thấy bộ sưu tập</p>
                        <p className="text-sm mt-1">Thử thay đổi từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={collections}
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
                        <h3 className="text-lg font-semibold mb-4">Thêm bộ sưu tập mới</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên bộ sưu tập</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="tu-dong-tao-neu-de-trong"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => { setShowForm(false); setFormData({ name: '', slug: '', description: '' }); }}
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
                title="Xóa bộ sưu tập"
                message={`Bạn có chắc chắn muốn xóa bộ sưu tập "${deleteDialog.name}"? Hành động này không thể hoàn tác.`}
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false })}
                loading={deleting}
            />
        </div>
    );
}
