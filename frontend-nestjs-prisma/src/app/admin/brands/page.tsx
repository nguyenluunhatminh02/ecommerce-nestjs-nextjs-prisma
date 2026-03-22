'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, ConfirmDialog, Avatar, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface Brand {
    id: string;
    name: string;
    slug: string;
    description: string;
    logoUrl: string;
    productCount: number;
    status: string;
    createdAt: string;
}

export default function AdminBrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
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
    const [createDialog, setCreateDialog] = useState(false);
    const [editDialog, setEditDialog] = useState<{ open: boolean; brand?: Brand }>({ open: false });
    const [formData, setFormData] = useState({ name: '', slug: '', description: '', logoUrl: '' });
    const [saving, setSaving] = useState(false);

    const fetchBrands = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);

            const { data } = await apiClient.get(`/brands?${params.toString()}`);
            const res = data.data || data;
            const rawList = Array.isArray(res) ? res : (res.content || res.data || []);
            const list = rawList.map((b: Record<string, unknown>) => ({
                ...b,
                status: b.status || (b.active ? 'active' : 'inactive'),
                productCount: b.productCount ?? 0,
            }));
            setBrands(list);
            setTotalPages(res.totalPages || Math.ceil(list.length / size) || 1);
            setTotalItems(res.totalElements || res.total || list.length);
        } catch (err) {
            console.error('Failed to fetch brands:', err);
            toast.error('Không thể tải danh sách thương hiệu');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, sortField, sortDir]);

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/brands/${deleteDialog.id}`);
            toast.success('Xóa thương hiệu thành công');
            setDeleteDialog({ open: false });
            fetchBrands();
        } catch (err) {
            console.error('Failed to delete brand:', err);
            toast.error('Không thể xóa thương hiệu');
        } finally {
            setDeleting(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên thương hiệu');
            return;
        }
        setSaving(true);
        try {
            await apiClient.post('/brands', {
                name: formData.name,
                slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
                description: formData.description,
                logoUrl: formData.logoUrl,
            });
            toast.success('Tạo thương hiệu thành công');
            setCreateDialog(false);
            setFormData({ name: '', slug: '', description: '', logoUrl: '' });
            fetchBrands();
        } catch (err) {
            console.error('Failed to create brand:', err);
            toast.error('Không thể tạo thương hiệu');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = async () => {
        if (!editDialog.brand || !formData.name.trim()) return;
        setSaving(true);
        try {
            await apiClient.put(`/brands/${editDialog.brand.id}`, {
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                logoUrl: formData.logoUrl,
            });
            toast.success('Cập nhật thương hiệu thành công');
            setEditDialog({ open: false });
            setFormData({ name: '', slug: '', description: '', logoUrl: '' });
            fetchBrands();
        } catch (err) {
            console.error('Failed to update brand:', err);
            toast.error('Không thể cập nhật thương hiệu');
        } finally {
            setSaving(false);
        }
    };

    const openEditDialog = (brand: Brand) => {
        setFormData({
            name: brand.name,
            slug: brand.slug,
            description: brand.description || '',
            logoUrl: brand.logoUrl || '',
        });
        setEditDialog({ open: true, brand });
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
            label: 'Thương hiệu',
            sortable: true,
            render: (_: unknown, row: Brand) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        src={row.logoUrl || ''}
                        name={row.name}
                        size="md"
                    />
                    <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[250px]">{row.name}</p>
                        <p className="text-xs text-gray-500">{row.description || '—'}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'slug',
            label: 'Slug',
            render: (_: unknown, row: Brand) => (
                <span className="text-sm text-gray-600 font-mono">{row.slug}</span>
            )
        },
        {
            key: 'productCount',
            label: 'Số sản phẩm',
            sortable: true,
            render: (_: unknown, row: Brand) => (
                <span className="font-medium text-gray-700">{row.productCount ?? 0}</span>
            )
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (_: unknown, row: Brand) => <StatusBadge status={row.status} />
        },
        {
            key: 'createdAt',
            label: 'Ngày tạo',
            sortable: true,
            render: (_: unknown, row: Brand) => (
                <span className="text-sm text-gray-600">
                    {new Date(row.createdAt).toLocaleDateString('vi-VN')}
                </span>
            )
        },
        {
            key: 'actions',
            label: '',
            align: 'right' as const,
            render: (_: unknown, row: Brand) => (
                <div className="flex items-center gap-2 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); openEditDialog(row); }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Chỉnh sửa"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
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

    const brandFormFields = (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên thương hiệu *</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Nhập tên thương hiệu"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="tu-dong-tao-tu-ten"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                    placeholder="Nhập mô tả thương hiệu"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="https://example.com/logo.png"
                />
            </div>
        </div>
    );

    return (
        <div>
            <PageHeader
                title="Quản lý thương hiệu"
                description={`Tổng cộng ${totalItems} thương hiệu`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Thương hiệu' }
                ]}
                actions={
                    <button
                        onClick={() => { setFormData({ name: '', slug: '', description: '', logoUrl: '' }); setCreateDialog(true); }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Thêm thương hiệu
                    </button>
                }
            />

            <Card className="mt-6">
                <TableToolbar
                    searchValue={search}
                    onSearchChange={(val) => { setSearch(val); setPage(0); }}
                    searchPlaceholder="Tìm kiếm thương hiệu..."
                    filters={
                        <div className="flex items-center gap-2">
                            <select
                                className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600"
                                onChange={(e) => {
                                    setSortField(e.target.value);
                                    setPage(0);
                                }}
                                value={sortField}
                            >
                                <option value="createdAt">Mới nhất</option>
                                <option value="name">Tên</option>
                                <option value="productCount">Số sản phẩm</option>
                            </select>
                        </div>
                    }
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : brands.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        <p className="text-lg font-medium">Không tìm thấy thương hiệu</p>
                        <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={brands}
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

            {/* Create Dialog */}
            <ConfirmDialog
                open={createDialog}
                title="Thêm thương hiệu mới"
                message={brandFormFields}
                confirmLabel="Tạo"
                variant="primary"
                onConfirm={handleCreate}
                onCancel={() => { setCreateDialog(false); setFormData({ name: '', slug: '', description: '', logoUrl: '' }); }}
                loading={saving}
            />

            {/* Edit Dialog */}
            <ConfirmDialog
                open={editDialog.open}
                title="Chỉnh sửa thương hiệu"
                message={brandFormFields}
                confirmLabel="Cập nhật"
                variant="primary"
                onConfirm={handleEdit}
                onCancel={() => { setEditDialog({ open: false }); setFormData({ name: '', slug: '', description: '', logoUrl: '' }); }}
                loading={saving}
            />

            {/* Delete Dialog */}
            <ConfirmDialog
                open={deleteDialog.open}
                title="Xóa thương hiệu"
                message={`Bạn có chắc chắn muốn xóa thương hiệu "${deleteDialog.name}"? Hành động này không thể hoàn tác.`}
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false })}
                loading={deleting}
            />
        </div>
    );
}
