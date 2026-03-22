'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, ConfirmDialog, Avatar, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface ReviewRow {
    id: string;
    productName: string;
    productImage: string;
    customerName: string;
    customerAvatar: string;
    rating: number;
    comment: string;
    status: string;
    createdAt: string;
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<ReviewRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [statusFilter, setStatusFilter] = useState('');
    const [ratingFilter, setRatingFilter] = useState('');
    const [actionDialog, setActionDialog] = useState<{ open: boolean; id?: string; action?: 'approve' | 'reject' }>({ open: false });
    const [acting, setActing] = useState(false);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);
            if (statusFilter) params.append('status', statusFilter);
            if (ratingFilter) params.append('rating', ratingFilter);

            const { data } = await apiClient.get(`/reviews/pending?${params.toString()}`);
            const res = data.data || data;
            const rawItems = Array.isArray(res) ? res : (res.content || res.items || []);
            const items = rawItems;
            const mapped: ReviewRow[] = items.map((r: Record<string, unknown>) => ({
                id: r.id,
                productName: (r as Record<string, Record<string, string>>).product?.name || (r as Record<string, string>).productName || 'N/A',
                productImage: (r as Record<string, Record<string, string>>).product?.image || '',
                customerName: (r as Record<string, Record<string, string>>).user?.name || (r as Record<string, string>).customerName || 'Ẩn danh',
                customerAvatar: (r as Record<string, Record<string, string>>).user?.avatar || '',
                rating: Number(r.rating) || 0,
                comment: String(r.comment || r.content || ''),
                status: String(r.status || 'PENDING'),
                createdAt: String(r.createdAt),
            }));
            setReviews(mapped);
            setTotalPages(res.totalPages || (Array.isArray(res) ? Math.ceil(res.length / size) : 0));
            setTotalItems(res.totalElements || res.total || (Array.isArray(res) ? res.length : 0));
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
            toast.error('Không thể tải danh sách đánh giá');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, sortField, sortDir, statusFilter, ratingFilter]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleAction = async () => {
        if (!actionDialog.id || !actionDialog.action) return;
        setActing(true);
        try {
            const endpoint = actionDialog.action === 'approve' ? 'approve' : 'reject';
            await apiClient.put(`/reviews/${actionDialog.id}/${endpoint}`);
            toast.success(actionDialog.action === 'approve' ? 'Đã duyệt đánh giá' : 'Đã từ chối đánh giá');
            setActionDialog({ open: false });
            fetchReviews();
        } catch (err) {
            console.error('Failed to update review:', err);
            toast.error('Không thể cập nhật đánh giá');
        } finally {
            setActing(false);
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

    const renderStars = (rating: number) => (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
                <svg
                    key={star}
                    className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
            ))}
        </div>
    );

    const columns = [
        {
            key: 'productName',
            label: 'Sản phẩm',
            render: (_: unknown, row: ReviewRow) => (
                <div className="flex items-center gap-3">
                    {row.productImage && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={row.productImage} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                    )}
                    <span className="font-medium text-gray-900 truncate max-w-[200px]">{row.productName}</span>
                </div>
            )
        },
        {
            key: 'customerName',
            label: 'Khách hàng',
            render: (_: unknown, row: ReviewRow) => (
                <div className="flex items-center gap-2">
                    <Avatar src={row.customerAvatar} name={row.customerName} size="sm" />
                    <span className="text-gray-700">{row.customerName}</span>
                </div>
            )
        },
        {
            key: 'rating',
            label: 'Đánh giá',
            sortable: true,
            render: (_: unknown, row: ReviewRow) => renderStars(row.rating)
        },
        {
            key: 'comment',
            label: 'Nội dung',
            render: (_: unknown, row: ReviewRow) => (
                <p className="text-sm text-gray-600 truncate max-w-[250px]" title={row.comment}>
                    {row.comment || '—'}
                </p>
            )
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (_: unknown, row: ReviewRow) => <StatusBadge status={row.status} />
        },
        {
            key: 'createdAt',
            label: 'Ngày',
            sortable: true,
            render: (_: unknown, row: ReviewRow) => (
                <span className="text-sm text-gray-600">
                    {new Date(row.createdAt).toLocaleDateString('vi-VN')}
                </span>
            )
        },
        {
            key: 'actions',
            label: '',
            align: 'right' as const,
            render: (_: unknown, row: ReviewRow) => (
                <div className="flex items-center gap-2 justify-end">
                    {row.status === 'PENDING' && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActionDialog({ open: true, id: row.id, action: 'approve' }); }}
                                className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                                title="Duyệt"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActionDialog({ open: true, id: row.id, action: 'reject' }); }}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                title="Từ chối"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <div>
            <PageHeader
                title="Quản lý đánh giá"
                description={`Tổng cộng ${totalItems} đánh giá`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Đánh giá' }
                ]}
            />

            <Card className="mt-6">
                <TableToolbar
                    searchValue={search}
                    onSearchChange={(val) => { setSearch(val); setPage(0); }}
                    searchPlaceholder="Tìm kiếm đánh giá..."
                    filters={
                        <div className="flex items-center gap-2">
                            <select
                                className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="PENDING">Chờ duyệt</option>
                                <option value="APPROVED">Đã duyệt</option>
                                <option value="REJECTED">Đã từ chối</option>
                            </select>
                            <select
                                className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600"
                                value={ratingFilter}
                                onChange={(e) => { setRatingFilter(e.target.value); setPage(0); }}
                            >
                                <option value="">Tất cả sao</option>
                                <option value="5">5 sao</option>
                                <option value="4">4 sao</option>
                                <option value="3">3 sao</option>
                                <option value="2">2 sao</option>
                                <option value="1">1 sao</option>
                            </select>
                        </div>
                    }
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không tìm thấy đánh giá</p>
                        <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={reviews}
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

            <ConfirmDialog
                open={actionDialog.open}
                title={actionDialog.action === 'approve' ? 'Duyệt đánh giá' : 'Từ chối đánh giá'}
                message={actionDialog.action === 'approve'
                    ? 'Bạn có chắc chắn muốn duyệt đánh giá này?'
                    : 'Bạn có chắc chắn muốn từ chối đánh giá này?'
                }
                confirmLabel={actionDialog.action === 'approve' ? 'Duyệt' : 'Từ chối'}
                variant={actionDialog.action === 'approve' ? 'primary' : 'danger'}
                onConfirm={handleAction}
                onCancel={() => setActionDialog({ open: false })}
                loading={acting}
            />
        </div>
    );
}
