'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, ConfirmDialog, LoadingSpinner, InputGroup
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface GiftCardRow {
    id: string;
    code: string;
    initialBalance: number;
    currentBalance: number;
    isActive: boolean;
    expiresAt: string | null;
    createdAt: string;
}

export default function AdminGiftCardsPage() {
    const [cards, setCards] = useState<GiftCardRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: string; code?: string }>({ open: false });
    const [deleting, setDeleting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ amount: '', validityDays: '365', quantity: '1' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            const { data } = await apiClient.get(`/gift-cards?${params.toString()}`);
            const res = data.data || data;
            const items = Array.isArray(res) ? res : res.content || res.items || [];
            setCards(items.map((g: Record<string, unknown>) => ({
                id: String(g.id),
                code: String(g.code || ''),
                initialBalance: Number(g.initialBalance || g.amount || 0),
                currentBalance: Number(g.currentBalance || g.balance || 0),
                isActive: Boolean(g.isActive ?? g.active ?? true),
                expiresAt: g.expiresAt ? String(g.expiresAt) : null,
                createdAt: String(g.createdAt || ''),
            })));
            setTotalPages(res.totalPages || Math.ceil((res.total || items.length) / size));
            setTotalItems(res.totalElements || res.total || items.length);
        } catch { toast.error('Không thể tải danh sách gift card'); }
        finally { setLoading(false); }
    }, [search, page, size]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async () => {
        setSaving(true);
        try {
            const qty = parseInt(formData.quantity);
            if (qty > 1) {
                await apiClient.post('/gift-cards/batch', {
                    amount: parseFloat(formData.amount),
                    validityDays: parseInt(formData.validityDays),
                    quantity: qty,
                });
            } else {
                await apiClient.post('/gift-cards', {
                    amount: parseFloat(formData.amount),
                    validityDays: parseInt(formData.validityDays),
                });
            }
            toast.success('Tạo gift card thành công');
            setShowForm(false);
            setFormData({ amount: '', validityDays: '365', quantity: '1' });
            fetchData();
        } catch { toast.error('Không thể tạo gift card'); }
        finally { setSaving(false); }
    };

    const handleDeactivate = async () => {
        if (!deleteDialog.id) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/gift-cards/${deleteDialog.id}`);
            toast.success('Đã vô hiệu hóa gift card');
            setDeleteDialog({ open: false });
            fetchData();
        } catch { toast.error('Không thể vô hiệu hóa'); }
        finally { setDeleting(false); }
    };

    const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

    const columns = [
        { key: 'code', label: 'Mã', render: (_: unknown, r: GiftCardRow) => <span className="font-mono font-semibold text-indigo-600">{r.code}</span> },
        { key: 'initialBalance', label: 'Giá trị ban đầu', render: (_: unknown, r: GiftCardRow) => fmt(r.initialBalance) },
        { key: 'currentBalance', label: 'Số dư hiện tại', render: (_: unknown, r: GiftCardRow) => <span className="font-semibold">{fmt(r.currentBalance)}</span> },
        { key: 'isActive', label: 'Trạng thái', render: (_: unknown, r: GiftCardRow) => <StatusBadge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
        { key: 'expiresAt', label: 'Hết hạn', render: (_: unknown, r: GiftCardRow) => r.expiresAt ? new Date(r.expiresAt).toLocaleDateString('vi-VN') : '—' },
        { key: 'createdAt', label: 'Ngày tạo', render: (_: unknown, r: GiftCardRow) => new Date(r.createdAt).toLocaleDateString('vi-VN') },
        {
            key: 'actions', label: '', render: (_: unknown, r: GiftCardRow) => (
                <button onClick={() => setDeleteDialog({ open: true, id: r.id, code: r.code })} className="text-red-600 hover:text-red-800 text-sm">Vô hiệu hóa</button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Quản lý Gift Card" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Gift Cards' }]}
                actions={<button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Tạo Gift Card</button>} />
            <Card>
                <TableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Tìm theo mã..." totalItems={totalItems} />
                {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={cards} emptyMessage="Chưa có gift card nào" />}
                <TablePagination currentPage={page + 1} totalPages={totalPages} totalItems={totalItems} pageSize={size} onPageChange={(p) => setPage(p - 1)} onPageSizeChange={setSize} />
            </Card>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Tạo Gift Card</h3>
                        <div className="space-y-4">
                            <InputGroup label="Giá trị (VND)" type="number" value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} required />
                            <InputGroup label="Số ngày có hiệu lực" type="number" value={formData.validityDays} onChange={e => setFormData(p => ({ ...p, validityDays: e.target.value }))} />
                            <InputGroup label="Số lượng" type="number" value={formData.quantity} onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))} />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Hủy</button>
                            <button onClick={handleCreate} disabled={saving || !formData.amount} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {saving ? 'Đang tạo...' : 'Tạo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog open={deleteDialog.open} title="Vô hiệu hóa Gift Card" message={`Bạn có chắc muốn vô hiệu hóa gift card "${deleteDialog.code}"?`}
                confirmLabel={deleting ? 'Đang xử lý...' : 'Vô hiệu hóa'} onConfirm={handleDeactivate} onCancel={() => setDeleteDialog({ open: false })} variant="danger" />
        </div>
    );
}
