'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, ConfirmDialog, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface BannerRow {
    id: string;
    title: string;
    imageUrl: string;
    link: string;
    position: string;
    status: string;
    order: number;
    createdAt: string;
}

interface BannerForm {
    title: string;
    imageUrl: string;
    link: string;
    position: string;
    status: string;
    order: number;
}

const defaultForm: BannerForm = { title: '', imageUrl: '', link: '', position: 'HOME_TOP', status: 'active', order: 0 };
const positions = [
    { value: 'HOME_TOP', label: 'Trang chủ - Đầu trang' },
    { value: 'HOME_MIDDLE', label: 'Trang chủ - Giữa trang' },
    { value: 'HOME_BOTTOM', label: 'Trang chủ - Cuối trang' },
    { value: 'CATEGORY', label: 'Trang danh mục' },
    { value: 'SIDEBAR', label: 'Thanh bên' },
];

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<BannerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: string; title?: string }>({ open: false });
    const [deleting, setDeleting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<BannerForm>(defaultForm);
    const [saving, setSaving] = useState(false);

    const fetchBanners = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);

            const { data } = await apiClient.get(`/banners?${params.toString()}`);
            const res = data.data || data;
            const rawList = Array.isArray(res) ? res : (res.content || []);
            const mapped = rawList.map((b: Record<string, unknown>) => ({
                ...b,
                status: b.active ? 'active' : 'inactive',
                position: b.position || '',
                order: b.sortOrder ?? b.order ?? 0,
            }));
            setBanners(mapped as BannerRow[]);
            setTotalPages(res.totalPages || (Array.isArray(res) ? Math.ceil(rawList.length / size) : 0));
            setTotalItems(res.totalElements || (Array.isArray(res) ? rawList.length : 0));
        } catch {
            toast.error('Không thể tải danh sách banner');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, sortField, sortDir]);

    useEffect(() => { fetchBanners(); }, [fetchBanners]);

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/banners/${deleteDialog.id}`);
            toast.success('Xóa banner thành công');
            setDeleteDialog({ open: false });
            fetchBanners();
        } catch {
            toast.error('Không thể xóa banner');
        } finally {
            setDeleting(false);
        }
    };

    const handleSave = async () => {
        if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề'); return; }
        setSaving(true);
        try {
            if (editingId) {
                await apiClient.put(`/banners/${editingId}`, form);
                toast.success('Cập nhật banner thành công');
            } else {
                await apiClient.post('/banners', form);
                toast.success('Tạo banner thành công');
            }
            setModalOpen(false);
            setEditingId(null);
            setForm(defaultForm);
            fetchBanners();
        } catch {
            toast.error('Không thể lưu banner');
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (row: BannerRow) => {
        setEditingId(row.id);
        setForm({ title: row.title, imageUrl: row.imageUrl, link: row.link, position: row.position, status: row.status, order: row.order });
        setModalOpen(true);
    };

    const handleSort = (field: string) => {
        if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const columns = [
        {
            key: 'imageUrl',
            label: 'Hình ảnh',
            render: (_: unknown, row: BannerRow) => (
                <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-100">
                    <img src={row.imageUrl || '/images/placeholder.png'} alt={row.title} className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.png'; }} />
                </div>
            )
        },
        { key: 'title', label: 'Tiêu đề', sortable: true, render: (_: unknown, row: BannerRow) => <span className="font-medium text-gray-900">{row.title}</span> },
        { key: 'position', label: 'Vị trí', render: (_: unknown, row: BannerRow) => <span className="text-gray-600">{positions.find(p => p.value === row.position)?.label || row.position}</span> },
        { key: 'link', label: 'Liên kết', render: (_: unknown, row: BannerRow) => <span className="text-sm text-blue-600 truncate max-w-[200px] block">{row.link || '—'}</span> },
        { key: 'status', label: 'Trạng thái', render: (_: unknown, row: BannerRow) => <StatusBadge status={row.status} /> },
        { key: 'order', label: 'Thứ tự', sortable: true, render: (_: unknown, row: BannerRow) => <span className="text-gray-700">{row.order}</span> },
        {
            key: 'createdAt', label: 'Ngày tạo', sortable: true,
            render: (_: unknown, row: BannerRow) => <span className="text-sm text-gray-500">{new Date(row.createdAt).toLocaleDateString('vi-VN')}</span>
        },
        {
            key: 'actions', label: '', align: 'right' as const,
            render: (_: unknown, row: BannerRow) => (
                <div className="flex items-center gap-2 justify-end">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(row); }}
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
                title="Quản lý banner"
                description={`Tổng cộng ${totalItems} banner`}
                breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Banner' }]}
                actions={
                    <button onClick={() => { setEditingId(null); setForm(defaultForm); setModalOpen(true); }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                        + Thêm banner
                    </button>
                }
            />

            <Card className="mt-6">
                <TableToolbar searchValue={search} onSearchChange={(val) => { setSearch(val); setPage(0); }} searchPlaceholder="Tìm kiếm banner..." />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : banners.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không tìm thấy banner</p>
                        <p className="text-sm mt-1">Thử thay đổi từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={banners} sortField={sortField} sortDirection={sortDir} onSort={handleSort} />
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingId ? 'Chỉnh sửa banner' : 'Thêm banner mới'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL hình ảnh</label>
                                <input type="text" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Liên kết</label>
                                <input type="text" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí</label>
                                <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                    {positions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                        <option value="active">Hoạt động</option>
                                        <option value="inactive">Không hoạt động</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự</label>
                                    <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
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

            <ConfirmDialog open={deleteDialog.open} title="Xóa banner"
                message={`Bạn có chắc chắn muốn xóa banner "${deleteDialog.title}"? Hành động này không thể hoàn tác.`}
                confirmLabel="Xóa" variant="danger" onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false })} loading={deleting} />
        </div>
    );
}
