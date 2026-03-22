'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, ConfirmDialog, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface CmsPage {
    id: string;
    title: string;
    slug: string;
    status: string;
    updatedAt: string;
    createdAt: string;
}

interface CmsForm {
    title: string;
    slug: string;
    content: string;
    status: string;
}

const defaultForm: CmsForm = { title: '', slug: '', content: '', status: 'DRAFT' };

export default function AdminCmsPage() {
    const [pages, setPages] = useState<CmsPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState('updatedAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: string; title?: string }>({ open: false });
    const [deleting, setDeleting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CmsForm>(defaultForm);
    const [saving, setSaving] = useState(false);

    const fetchPages = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);

            const { data } = await apiClient.get(`/cms/pages?${params.toString()}`);
            const res = data.data || data;
            setPages(Array.isArray(res) ? res : res.content || []);
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.totalElements || (Array.isArray(res) ? res.length : 0));
        } catch {
            toast.error('Không thể tải danh sách trang');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, sortField, sortDir]);

    useEffect(() => { fetchPages(); }, [fetchPages]);

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/cms/pages/${deleteDialog.id}`);
            toast.success('Xóa trang thành công');
            setDeleteDialog({ open: false });
            fetchPages();
        } catch {
            toast.error('Không thể xóa trang');
        } finally {
            setDeleting(false);
        }
    };

    const handleSave = async () => {
        if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
        setSaving(true);
        try {
            const payload = {
                ...form,
                slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            };
            if (editingId) {
                await apiClient.put(`/cms/pages/${editingId}`, payload);
                toast.success('Cập nhật trang thành công');
            } else {
                await apiClient.post('/cms/pages', payload);
                toast.success('Tạo trang thành công');
            }
            setModalOpen(false);
            setEditingId(null);
            setForm(defaultForm);
            fetchPages();
        } catch {
            toast.error('Không thể lưu trang');
        } finally {
            setSaving(false);
        }
    };

    const handleSort = (field: string) => {
        if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const columns = [
        { key: 'title', label: 'Tiêu đề', sortable: true, render: (_: unknown, row: CmsPage) => <span className="font-medium text-gray-900">{row.title}</span> },
        { key: 'slug', label: 'Slug', render: (_: unknown, row: CmsPage) => <span className="text-sm text-gray-500 font-mono">/{row.slug}</span> },
        { key: 'status', label: 'Trạng thái', render: (_: unknown, row: CmsPage) => <StatusBadge status={row.status} /> },
        {
            key: 'updatedAt', label: 'Cập nhật lần cuối', sortable: true,
            render: (_: unknown, row: CmsPage) => <span className="text-sm text-gray-500">{new Date(row.updatedAt || row.createdAt).toLocaleDateString('vi-VN')}</span>
        },
        {
            key: 'actions', label: '', align: 'right' as const,
            render: (_: unknown, row: CmsPage) => (
                <div className="flex items-center gap-2 justify-end">
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(row.id); setForm({ title: row.title, slug: row.slug, content: '', status: row.status }); setModalOpen(true); }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors" title="Sửa">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id: row.id, title: row.title }); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Xóa">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            )
        }
    ];

    return (
        <div>
            <PageHeader
                title="Quản lý trang nội dung"
                description={`Tổng cộng ${totalItems} trang`}
                breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'CMS' }]}
                actions={
                    <button onClick={() => { setEditingId(null); setForm(defaultForm); setModalOpen(true); }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                        + Thêm trang
                    </button>
                }
            />

            <Card className="mt-6">
                <TableToolbar searchValue={search} onSearchChange={(val) => { setSearch(val); setPage(0); }} searchPlaceholder="Tìm kiếm trang..." />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : pages.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không tìm thấy trang nào</p>
                        <p className="text-sm mt-1">Thử thay đổi từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={pages} sortField={sortField} sortDirection={sortDir} onSort={handleSort} />
                )}

                {totalPages > 1 && (
                    <div className="mt-4">
                        <TablePagination currentPage={page + 1} totalPages={totalPages} totalItems={totalItems} pageSize={size}
                            onPageChange={(p) => setPage(p - 1)} onPageSizeChange={(s) => { setSize(s); setPage(0); }} />
                    </div>
                )}
            </Card>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingId ? 'Chỉnh sửa trang' : 'Thêm trang mới'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                    placeholder="Tự động tạo từ tiêu đề nếu để trống"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                                <textarea rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="DRAFT">Bản nháp</option>
                                    <option value="PUBLISHED">Xuất bản</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => { setModalOpen(false); setEditingId(null); }}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                                {saving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog open={deleteDialog.open} title="Xóa trang"
                message={`Bạn có chắc chắn muốn xóa trang "${deleteDialog.title}"? Hành động này không thể hoàn tác.`}
                confirmLabel="Xóa" variant="danger" onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false })} loading={deleting} />
        </div>
    );
}
