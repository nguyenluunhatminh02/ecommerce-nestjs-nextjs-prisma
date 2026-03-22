'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, Card, LoadingSpinner, InputGroup
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface TaxRule {
    id: string;
    name: string;
    rate: number;
    country: string;
    state: string;
    category: string;
    active: boolean;
}

export default function AdminTaxPage() {
    const [rules, setRules] = useState<TaxRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', rate: '', country: 'Vietnam', state: '', category: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/tax-rules');
            const res = data.data || data;
            setRules((Array.isArray(res) ? res : res.content || []).map((t: Record<string, unknown>) => ({
                id: String(t.id), name: String(t.name || ''), rate: Number(t.rate || 0),
                country: String(t.country || ''), state: String(t.state || ''), category: String(t.category || ''), active: Boolean(t.active ?? true),
            })));
        } catch { /* Tax rules endpoint might not exist */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { name: formData.name, rate: parseFloat(formData.rate), country: formData.country, state: formData.state, category: formData.category };
            if (editId) { await apiClient.put(`/tax-rules/${editId}`, payload); toast.success('Cập nhật thành công'); }
            else { await apiClient.post('/tax-rules', payload); toast.success('Tạo quy tắc thuế thành công'); }
            setShowForm(false); setEditId(null); setFormData({ name: '', rate: '', country: 'Vietnam', state: '', category: '' }); fetchData();
        } catch { toast.error('Thao tác thất bại'); }
        finally { setSaving(false); }
    };

    const openEdit = (t: TaxRule) => {
        setEditId(t.id); setFormData({ name: t.name, rate: String(t.rate), country: t.country, state: t.state, category: t.category }); setShowForm(true);
    };

    const columns = [
        { key: 'name', label: 'Tên quy tắc', render: (_: unknown, r: TaxRule) => <span className="font-medium">{r.name}</span> },
        { key: 'rate', label: 'Thuế suất', render: (_: unknown, r: TaxRule) => <span className="font-semibold text-indigo-600">{r.rate}%</span> },
        { key: 'country', label: 'Quốc gia', render: (_: unknown, r: TaxRule) => r.country },
        { key: 'state', label: 'Vùng', render: (_: unknown, r: TaxRule) => r.state || '—' },
        { key: 'category', label: 'Danh mục', render: (_: unknown, r: TaxRule) => r.category || 'Tất cả' },
        {
            key: 'active', label: 'Trạng thái', render: (_: unknown, r: TaxRule) => (
                <span className={`px-2 py-1 text-xs rounded-full ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.active ? 'Hoạt động' : 'Ẩn'}</span>
            )
        },
        { key: 'actions', label: '', render: (_: unknown, r: TaxRule) => <button onClick={() => openEdit(r)} className="text-indigo-600 text-sm hover:underline">Sửa</button> },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Quy tắc thuế" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Tax Rules' }]}
                actions={<button onClick={() => { setEditId(null); setFormData({ name: '', rate: '', country: 'Vietnam', state: '', category: '' }); setShowForm(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Thêm quy tắc</button>} />
            <Card>
                {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={rules} emptyMessage="Chưa có quy tắc thuế nào" />}
            </Card>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">{editId ? 'Sửa quy tắc' : 'Thêm quy tắc thuế'}</h3>
                        <div className="space-y-4">
                            <InputGroup label="Tên" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                            <InputGroup label="Thuế suất (%)" type="number" value={formData.rate} onChange={e => setFormData(p => ({ ...p, rate: e.target.value }))} required />
                            <div className="grid grid-cols-2 gap-3">
                                <InputGroup label="Quốc gia" value={formData.country} onChange={e => setFormData(p => ({ ...p, country: e.target.value }))} />
                                <InputGroup label="Vùng/Tỉnh" value={formData.state} onChange={e => setFormData(p => ({ ...p, state: e.target.value }))} />
                            </div>
                            <InputGroup label="Danh mục áp dụng" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} placeholder="Để trống = tất cả" />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Hủy</button>
                            <button onClick={handleSave} disabled={saving || !formData.name || !formData.rate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {saving ? 'Đang lưu...' : editId ? 'Cập nhật' : 'Tạo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
