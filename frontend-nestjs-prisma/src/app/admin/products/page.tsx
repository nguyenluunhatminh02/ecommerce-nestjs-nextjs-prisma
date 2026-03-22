'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, ConfirmDialog, Avatar, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface ProductRow {
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    price: number;
    compareAtPrice: number | null;
    stockQuantity: number;
    totalSold: number;
    status: string;
    isFeatured: boolean;
    averageRating: number;
    totalReviews: number;
    categoryName: string | null;
    brandName: string | null;
    shopName: string | null;
    images: { url: string; isPrimary: boolean }[];
    createdAt: string;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<ProductRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: string; name?: string }>({ open: false });
    const [deleting, setDeleting] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);

            const { data } = await apiClient.get(`/products/filter?${params.toString()}`);
            const res = data.data || data;
            setProducts(res.content || []);
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.totalElements || 0);
        } catch (err) {
            console.error('Failed to fetch products:', err);
            toast.error('Không thể tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, sortField, sortDir]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/products/${deleteDialog.id}`);
            toast.success('Xóa sản phẩm thành công');
            setDeleteDialog({ open: false });
            fetchProducts();
        } catch (err) {
            console.error('Failed to delete product:', err);
            toast.error('Không thể xóa sản phẩm');
        } finally {
            setDeleting(false);
        }
    };

    const handleTogglePublish = async (id: string) => {
        try {
            await apiClient.put(`/products/${id}/publish`);
            toast.success('Cập nhật trạng thái thành công');
            fetchProducts();
        } catch (err) {
            console.error('Failed to toggle publish:', err);
            toast.error('Không thể cập nhật trạng thái');
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
            label: 'Sản phẩm',
            sortable: true,
            render: (_: unknown, row: ProductRow) => (
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                            src={row.images?.find(i => i.isPrimary)?.url || row.images?.[0]?.url || '/images/placeholder.png'}
                            alt={row.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.png'; }}
                        />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[250px]">{row.name}</p>
                        <p className="text-xs text-gray-500">SKU: {row.sku || 'N/A'}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'price',
            label: 'Giá',
            sortable: true,
            render: (_: unknown, row: ProductRow) => (
                <div>
                    <span className="font-medium text-gray-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.price)}
                    </span>
                    {row.compareAtPrice && row.compareAtPrice > row.price && (
                        <span className="block text-xs text-gray-400 line-through">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.compareAtPrice)}
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'stockQuantity',
            label: 'Tồn kho',
            sortable: true,
            render: (_: unknown, row: ProductRow) => (
                <span className={`font-medium ${row.stockQuantity <= 5 ? 'text-red-600' : row.stockQuantity <= 20 ? 'text-amber-600' : 'text-green-600'}`}>
                    {row.stockQuantity}
                </span>
            )
        },
        {
            key: 'totalSold',
            label: 'Đã bán',
            sortable: true,
            render: (_: unknown, row: ProductRow) => <span className="text-gray-700">{row.totalSold}</span>
        },
        {
            key: 'categoryName',
            label: 'Danh mục',
            render: (_: unknown, row: ProductRow) => <span className="text-gray-600">{row.categoryName || '—'}</span>
        },
        {
            key: 'averageRating',
            label: 'Đánh giá',
            sortable: true,
            render: (_: unknown, row: ProductRow) => (
                <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                    <span className="text-sm font-medium">{row.averageRating?.toFixed(1) || '0.0'}</span>
                    <span className="text-xs text-gray-400">({row.totalReviews || 0})</span>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (_: unknown, row: ProductRow) => <StatusBadge status={row.status} />
        },
        {
            key: 'actions',
            label: '',
            align: 'right' as const,
            render: (_: unknown, row: ProductRow) => (
                <div className="flex items-center gap-2 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleTogglePublish(row.id); }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                        title={row.status === 'ACTIVE' ? 'Ngừng hiển thị' : 'Kích hoạt'}
                    >
                        {row.status === 'ACTIVE' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
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

    return (
        <div>
            <PageHeader
                title="Quản lý sản phẩm"
                description={`Tổng cộng ${totalItems} sản phẩm`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Sản phẩm' }
                ]}
            />

            <Card className="mt-6">
                <TableToolbar
                    searchValue={search}
                    onSearchChange={(val) => { setSearch(val); setPage(0); }}
                    searchPlaceholder="Tìm kiếm sản phẩm..."
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
                                <option value="price">Giá</option>
                                <option value="totalSold">Bán chạy</option>
                                <option value="stockQuantity">Tồn kho</option>
                                <option value="averageRating">Đánh giá</option>
                            </select>
                        </div>
                    }
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        <p className="text-lg font-medium">Không tìm thấy sản phẩm</p>
                        <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={products}
                        sortField={sortField}
                        sortDirection={sortDir}
                        onSort={handleSort}
                        onRowClick={(row) => window.open(`/products/${row.slug}`, '_blank')}
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
                open={deleteDialog.open}
                title="Xóa sản phẩm"
                message={`Bạn có chắc chắn muốn xóa sản phẩm "${deleteDialog.name}"? Hành động này không thể hoàn tác.`}
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false })}
                loading={deleting}
            />
        </div>
    );
}
