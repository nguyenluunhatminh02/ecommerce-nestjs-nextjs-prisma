'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, StatsCard, StatusBadge, Card, ConfirmDialog, LoadingSpinner, InputGroup
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface Warehouse {
    id: string;
    name: string;
    address: string;
    city: string;
    country: string;
    active: boolean;
    totalProducts: number;
    totalStock: number;
    createdAt: string;
}

export default function AdminWarehousesPage() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [summary, setSummary] = useState({ total: 0, activeCount: 0, totalStock: 0, lowStockCount: 0 });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: string; name?: string }>({ open: false });
    const [formData, setFormData] = useState({ name: '', address: '', city: '', state: '', country: 'Vietnam', postalCode: '', phone: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [whRes, sumRes] = await Promise.all([
                apiClient.get('/warehouses').catch(() => null),
                apiClient.get('/warehouses/summary').catch(() => null),
            ]);
            if (whRes) {
                const res = whRes.data.data || whRes.data;
                setWarehouses((Array.isArray(res) ? res : res.content || []).map((w: Record<string, unknown>) => ({
                    id: String(w.id), name: String(w.name || ''), address: String(w.address || ''),
                    city: String(w.city || ''), country: String(w.country || ''), active: Boolean(w.active ?? true),
                    totalProducts: Number(w.totalProducts || 0), totalStock: Number(w.totalStock || 0), createdAt: String(w.createdAt || ''),
                })));
            }
            if (sumRes) {
                const s = sumRes.data.data || sumRes.data;
                setSummary({ total: s.totalWarehouses || s.total || 0, activeCount: s.activeWarehouses || 0, totalStock: s.totalStock || 0, lowStockCount: s.lowStockProducts || 0 });
            }
        } catch { toast.error('Không thể tải dữ liệu kho'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editId) { await apiClient.put(`/warehouses/${editId}`, formData); toast.success('Cập nhật thành công'); }
            else { await apiClient.post('/warehouses', formData); toast.success('Tạo kho thành công'); }
            setShowForm(false); setEditId(null); setFormData({ name: '', address: '', city: '', state: '', country: 'Vietnam', postalCode: '', phone: '' }); fetchData();
        } catch { toast.error('Thao tác thất bại'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        try { await apiClient.delete(`/warehouses/${deleteDialog.id}`); toast.success('Đã vô hiệu hóa'); setDeleteDialog({ open: false }); fetchData(); }
        catch { toast.error('Không thể xóa'); }
    };

    const openEdit = (w: Warehouse) => {
        setEditId(w.id); setFormData({ name: w.name, address: w.address, city: w.city, state: '', country: w.country, postalCode: '', phone: '' }); setShowForm(true);
    };

    const columns = [
        { key: 'name', label: 'Tên kho', render: (_: unknown, r: Warehouse) => <span className="font-medium">{r.name}</span> },
        { key: 'address', label: 'Địa chỉ', render: (_: unknown, r: Warehouse) => <span className="text-gray-600 text-sm">{r.address}, {r.city}</span> },
        { key: 'totalProducts', label: 'Sản phẩm', render: (_: unknown, r: Warehouse) => r.totalProducts },
        { key: 'totalStock', label: 'Tổng tồn kho', render: (_: unknown, r: Warehouse) => r.totalStock.toLocaleString() },
        { key: 'active', label: 'Trạng thái', render: (_: unknown, r: Warehouse) => <StatusBadge status={r.active ? 'ACTIVE' : 'INACTIVE'} /> },
        {
            key: 'actions', label: '', render: (_: unknown, r: Warehouse) => (
                <div className="flex gap-2">
                    <button onClick={() => openEdit(r)} className="text-indigo-600 text-sm hover:underline">Sửa</button>
                    <button onClick={() => setDeleteDialog({ open: true, id: r.id, name: r.name })} className="text-red-600 text-sm hover:underline">Xóa</button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Quản lý Kho hàng" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Warehouses' }]}
                actions={<button onClick={() => { setEditId(null); setFormData({ name: '', address: '', city: '', state: '', country: 'Vietnam', postalCode: '', phone: '' }); setShowForm(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Thêm kho</button>} />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard title="Tổng kho" value={summary.total} icon="🏭" iconBg="bg-blue-100" />
                <StatsCard title="Đang hoạt động" value={summary.activeCount} icon="✅" iconBg="bg-green-100" />
                <StatsCard title="Tổng tồn kho" value={summary.totalStock.toLocaleString()} icon="📦" iconBg="bg-purple-100" />
                <StatsCard title="Sắp hết hàng" value={summary.lowStockCount} icon="⚠️" iconBg="bg-orange-100" />
            </div>
            <Card>
                {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={warehouses} emptyMessage="Chưa có kho nào" />}
            </Card>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">{editId ? 'Sửa kho' : 'Thêm kho mới'}</h3>
                        <div className="space-y-4">
                            <InputGroup label="Tên kho" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                            <InputGroup label="Địa chỉ" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} required />
                            <div className="grid grid-cols-2 gap-3">
                                <InputGroup label="Thành phố" value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} />
                                <InputGroup label="Quốc gia" value={formData.country} onChange={e => setFormData(p => ({ ...p, country: e.target.value }))} />
                            </div>
                            <InputGroup label="Số điện thoại" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Hủy</button>
                            <button onClick={handleSave} disabled={saving || !formData.name} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {saving ? 'Đang lưu...' : editId ? 'Cập nhật' : 'Tạo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmDialog open={deleteDialog.open} title="Xóa kho" message={`Bạn có chắc muốn vô hiệu hóa kho "${deleteDialog.name}"?`}
                confirmLabel="Vô hiệu hóa" onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false })} variant="danger" />
        </div>
    );
}
