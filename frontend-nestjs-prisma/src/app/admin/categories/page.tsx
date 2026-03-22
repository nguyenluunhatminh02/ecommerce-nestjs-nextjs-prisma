'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    Card, ConfirmDialog, LoadingSpinner, InputGroup
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface CategoryRow {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    iconUrl: string | null;
    bannerUrl: string | null;
    parentId: string | null;
    parentName: string | null;
    level: number | null;
    sortOrder: number;
    isActive: boolean;
    isFeatured: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    productCount: number;
    children: CategoryRow[] | null;
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<CategoryRow[]>([]);
    const [allCategories, setAllCategories] = useState<CategoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(50);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [search, setSearch] = useState('');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; cat?: CategoryRow }>({ open: false });
    const [formDialog, setFormDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; cat?: CategoryRow }>({ open: false, mode: 'create' });
    const [formData, setFormData] = useState({ name: '', description: '', parentId: '', isFeatured: false, sortOrder: 0 });
    const [actionLoading, setActionLoading] = useState(false);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/categories');
            const res = data.data || data;
            const list = Array.isArray(res) ? res : (res.content || []);
            setAllCategories(list);
            let filtered = list;
            if (search) {
                filtered = list.filter((c: CategoryRow) =>
                    c.name.toLowerCase().includes(search.toLowerCase()) ||
                    c.slug.toLowerCase().includes(search.toLowerCase())
                );
            }
            const start = page * size;
            const paged = filtered.slice(start, start + size);
            setCategories(paged);
            setTotalPages(Math.ceil(filtered.length / size) || 1);
            setTotalItems(filtered.length);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            toast.error('Không thể tải danh mục');
        } finally {
            setLoading(false);
        }
    }, [page, size, search]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleCreate = async () => {
        setActionLoading(true);
        try {
            await apiClient.post('/categories', {
                name: formData.name,
                description: formData.description || null,
                parentId: formData.parentId || null,
                isFeatured: formData.isFeatured,
                sortOrder: formData.sortOrder,
            });
            toast.success('Tạo danh mục thành công');
            setFormDialog({ open: false, mode: 'create' });
            fetchCategories();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Không thể tạo danh mục');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!formDialog.cat) return;
        setActionLoading(true);
        try {
            await apiClient.put(`/categories/${formDialog.cat.id}`, {
                name: formData.name,
                description: formData.description || null,
                parentId: formData.parentId || null,
                isFeatured: formData.isFeatured,
                sortOrder: formData.sortOrder,
            });
            toast.success('Cập nhật danh mục thành công');
            setFormDialog({ open: false, mode: 'edit' });
            fetchCategories();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Không thể cập nhật danh mục');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.cat) return;
        setActionLoading(true);
        try {
            await apiClient.delete(`/categories/${deleteDialog.cat.id}`);
            toast.success('Xóa danh mục thành công');
            setDeleteDialog({ open: false });
            fetchCategories();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Không thể xóa danh mục');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleFeatured = async (cat: CategoryRow) => {
        try {
            await apiClient.put(`/categories/${cat.id}/toggle-status`);
            toast.success(cat.isFeatured ? 'Đã bỏ nổi bật' : 'Đã đặt nổi bật');
            fetchCategories();
        } catch (err) {
            toast.error('Không thể thay đổi trạng thái');
        }
    };

    const openCreateForm = () => {
        setFormData({ name: '', description: '', parentId: '', isFeatured: false, sortOrder: 0 });
        setFormDialog({ open: true, mode: 'create' });
    };

    const openEditForm = (cat: CategoryRow) => {
        setFormData({
            name: cat.name,
            description: cat.description || '',
            parentId: cat.parentId || '',
            isFeatured: cat.isFeatured,
            sortOrder: cat.sortOrder,
        });
        setFormDialog({ open: true, mode: 'edit', cat });
    };

    const columns = [
        {
            key: 'name',
            label: 'Danh mục',
            render: (_: unknown, row: CategoryRow) => (
                <div className="flex items-center gap-3">
                    {row.imageUrl && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={row.imageUrl} alt={row.name} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div>
                        <p className="font-medium text-gray-900">{row.name}</p>
                        <p className="text-xs text-gray-400">{row.slug}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'parent',
            label: 'Danh mục cha',
            render: (_: unknown, row: CategoryRow) => (
                <span className="text-gray-600 text-sm">{row.parentName || '—'}</span>
            )
        },
        {
            key: 'productCount',
            label: 'Sản phẩm',
            render: (_: unknown, row: CategoryRow) => (
                <span className="font-medium text-gray-700">{row.productCount}</span>
            )
        },
        {
            key: 'featured',
            label: 'Nổi bật',
            render: (_: unknown, row: CategoryRow) => (
                <button
                    onClick={(e) => { e.stopPropagation(); handleToggleFeatured(row); }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        row.isFeatured ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
                    }`}
                >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                </button>
            )
        },
        {
            key: 'position',
            label: 'Vị trí',
            render: (_: unknown, row: CategoryRow) => (
                <span className="text-sm text-gray-500">{row.sortOrder}</span>
            )
        },
        {
            key: 'children',
            label: 'Danh mục con',
            render: (_: unknown, row: CategoryRow) => (
                <span className="text-sm text-gray-500">{row.children?.length || 0}</span>
            )
        },
        {
            key: 'actions',
            label: '',
            align: 'right' as const,
            render: (_: unknown, row: CategoryRow) => (
                <div className="flex items-center gap-1 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); openEditForm(row); }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Chỉnh sửa"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, cat: row }); }}
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
                title="Quản lý danh mục"
                description={`Tổng cộng ${totalItems} danh mục`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Danh mục' }
                ]}
                actions={
                    <button
                        onClick={openCreateForm}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Thêm danh mục
                    </button>
                }
            />

            <Card className="mt-6">
                <TableToolbar
                    searchValue={search}
                    onSearchChange={(val) => { setSearch(val); setPage(0); }}
                    searchPlaceholder="Tìm kiếm danh mục..."
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không tìm thấy danh mục</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={categories} />
                )}

                {totalPages > 1 && (
                    <div className="mt-4">
                        <TablePagination
                            currentPage={page + 1}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            pageSize={size}
                            onPageChange={(p) => setPage(p - 1)}
                        />
                    </div>
                )}
            </Card>

            {/* Create/Edit Form Dialog */}
            {formDialog.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setFormDialog({ ...formDialog, open: false })} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {formDialog.mode === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
                        </h3>
                        <div className="space-y-4">
                            <InputGroup
                                label="Tên danh mục"
                                name="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nhập tên danh mục"
                                required
                            />
                            <InputGroup
                                label="Mô tả"
                                name="description"
                                type="textarea"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Mô tả ngắn"
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục cha</label>
                                <select
                                    value={formData.parentId}
                                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                                >
                                    <option value="">— Không có (Danh mục gốc) —</option>
                                    {allCategories.filter(c => c.id !== formDialog.cat?.id).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-4">
                                <InputGroup
                                    label="Vị trí"
                                    name="position"
                                    type="number"
                                    value={formData.sortOrder}
                                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                    className="w-32"
                                />
                                <div className="flex items-center gap-2 mt-6">
                                    <input
                                        type="checkbox"
                                        id="featured"
                                        checked={formData.isFeatured}
                                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                        className="rounded border-gray-300 text-indigo-600"
                                    />
                                    <label htmlFor="featured" className="text-sm text-gray-700">Nổi bật</label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setFormDialog({ ...formDialog, open: false })}
                                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={formDialog.mode === 'create' ? handleCreate : handleUpdate}
                                disabled={actionLoading || !formData.name}
                                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Đang xử lý...' : formDialog.mode === 'create' ? 'Tạo' : 'Cập nhật'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Dialog */}
            <ConfirmDialog
                open={deleteDialog.open}
                title="Xóa danh mục"
                message={`Bạn có chắc chắn muốn xóa danh mục "${deleteDialog.cat?.name}"? Tất cả danh mục con cũng sẽ bị ảnh hưởng.`}
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false })}
                loading={actionLoading}
            />
        </div>
    );
}
