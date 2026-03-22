'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, StatusBadge, Card, ConfirmDialog, LoadingSpinner, InputGroup
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface ShippingMethod {
    id: string;
    name: string;
    description: string;
    baseCost: number;
    freeShippingThreshold: number | null;
    estimatedDays: string;
    active: boolean;
}

export default function AdminShippingPage() {
    const [methods, setMethods] = useState<ShippingMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', baseCost: '', freeShippingThreshold: '', estimatedDays: '', active: true });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/shipping/methods');
            const res = data.data || data;
            setMethods((Array.isArray(res) ? res : res.content || []).map((m: Record<string, unknown>) => ({
                id: String(m.id), name: String(m.name || ''), description: String(m.description || ''),
                baseCost: Number(m.baseCost || m.base_cost || 0), freeShippingThreshold: m.freeShippingThreshold != null ? Number(m.freeShippingThreshold) : null,
                estimatedDays: String(m.estimatedDays || m.estimated_days || ''), active: Boolean(m.active ?? true),
            })));
        } catch { toast.error('Không thể tải phương thức vận chuyển'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { name: formData.name, description: formData.description, baseCost: parseFloat(formData.baseCost), freeShippingThreshold: formData.freeShippingThreshold ? parseFloat(formData.freeShippingThreshold) : null, estimatedDays: formData.estimatedDays, active: formData.active };
            if (editId) { await apiClient.put(`/shipping/methods/${editId}`, payload); toast.success('Cập nhật thành công'); }
            else { await apiClient.post('/shipping/methods', payload); toast.success('Tạo phương thức thành công'); }
            setShowForm(false); setEditId(null); setFormData({ name: '', description: '', baseCost: '', freeShippingThreshold: '', estimatedDays: '', active: true }); fetchData();
        } catch { toast.error('Thao tác thất bại'); }
        finally { setSaving(false); }
    };

    const openEdit = (m: ShippingMethod) => {
        setEditId(m.id); setFormData({ name: m.name, description: m.description, baseCost: String(m.baseCost), freeShippingThreshold: m.freeShippingThreshold != null ? String(m.freeShippingThreshold) : '', estimatedDays: m.estimatedDays, active: m.active }); setShowForm(true);
    };

    const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

    const columns = [
        { key: 'name', label: 'Tên', render: (_: unknown, r: ShippingMethod) => <span className="font-medium">{r.name}</span> },
        { key: 'description', label: 'Mô tả', render: (_: unknown, r: ShippingMethod) => <span className="text-gray-600 text-sm">{r.description}</span> },
        { key: 'baseCost', label: 'Phí cơ bản', render: (_: unknown, r: ShippingMethod) => fmt(r.baseCost) },
        { key: 'freeShippingThreshold', label: 'Miễn phí từ', render: (_: unknown, r: ShippingMethod) => r.freeShippingThreshold != null ? fmt(r.freeShippingThreshold) : '—' },
        { key: 'estimatedDays', label: 'Thời gian', render: (_: unknown, r: ShippingMethod) => r.estimatedDays || '—' },
        { key: 'active', label: 'Trạng thái', render: (_: unknown, r: ShippingMethod) => <StatusBadge status={r.active ? 'ACTIVE' : 'INACTIVE'} /> },
        {
            key: 'actions', label: '', render: (_: unknown, r: ShippingMethod) => (
                <button onClick={() => openEdit(r)} className="text-indigo-600 text-sm hover:underline">Sửa</button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Phương thức vận chuyển" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Shipping' }]}
                actions={<button onClick={() => { setEditId(null); setFormData({ name: '', description: '', baseCost: '', freeShippingThreshold: '', estimatedDays: '', active: true }); setShowForm(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Thêm phương thức</button>} />
            <Card>
                {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={methods} emptyMessage="Chưa có phương thức vận chuyển nào" />}
            </Card>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">{editId ? 'Sửa phương thức' : 'Thêm phương thức'}</h3>
                        <div className="space-y-4">
                            <InputGroup label="Tên" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                            <InputGroup label="Mô tả" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
                            <div className="grid grid-cols-2 gap-3">
                                <InputGroup label="Phí cơ bản (VND)" type="number" value={formData.baseCost} onChange={e => setFormData(p => ({ ...p, baseCost: e.target.value }))} />
                                <InputGroup label="Miễn phí từ (VND)" type="number" value={formData.freeShippingThreshold} onChange={e => setFormData(p => ({ ...p, freeShippingThreshold: e.target.value }))} />
                            </div>
                            <InputGroup label="Thời gian ước tính" value={formData.estimatedDays} onChange={e => setFormData(p => ({ ...p, estimatedDays: e.target.value }))} placeholder="VD: 3-5 ngày" />
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
        </div>
    );
}
