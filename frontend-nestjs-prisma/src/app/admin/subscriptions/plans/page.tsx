'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TablePagination, StatusBadge, Card, LoadingSpinner, InputGroup
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: string;
    features: string[];
    active: boolean;
    subscriberCount: number;
    createdAt: string;
}

export default function AdminSubscriptionPlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', price: '', interval: 'MONTHLY', features: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/subscriptions/plans');
            const res = data.data || data;
            const items = Array.isArray(res) ? res : res.content || [];
            setPlans(items.map((p: Record<string, unknown>) => ({
                id: String(p.id),
                name: String(p.name || ''),
                description: String(p.description || ''),
                price: Number(p.price || 0),
                interval: String(p.interval || p.billingCycle || 'MONTHLY'),
                features: Array.isArray(p.features) ? p.features.map(String) : typeof p.features === 'string' ? (p.features as string).split(',') : [],
                active: Boolean(p.active ?? true),
                subscriberCount: Number(p.subscriberCount || 0),
                createdAt: String(p.createdAt || ''),
            })));
        } catch { toast.error('Không thể tải danh sách gói'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { name: formData.name, description: formData.description, price: parseFloat(formData.price), interval: formData.interval, features: formData.features.split('\n').filter(Boolean) };
            if (editId) {
                await apiClient.put(`/subscriptions/admin/plans/${editId}`, payload);
                toast.success('Cập nhật gói thành công');
            } else {
                await apiClient.post('/subscriptions/admin/plans', payload);
                toast.success('Tạo gói thành công');
            }
            setShowForm(false);
            setEditId(null);
            setFormData({ name: '', description: '', price: '', interval: 'MONTHLY', features: '' });
            fetchData();
        } catch { toast.error('Thao tác thất bại'); }
        finally { setSaving(false); }
    };

    const openEdit = (p: Plan) => {
        setEditId(p.id);
        setFormData({ name: p.name, description: p.description, price: String(p.price), interval: p.interval, features: p.features.join('\n') });
        setShowForm(true);
    };

    const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

    return (
        <div className="space-y-6">
            <PageHeader title="Gói Subscription" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Subscriptions', href: '/admin/subscriptions' }, { label: 'Gói' }]}
                actions={<button onClick={() => { setEditId(null); setFormData({ name: '', description: '', price: '', interval: 'MONTHLY', features: '' }); setShowForm(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Tạo gói mới</button>} />

            {loading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.length === 0 ? <p className="col-span-3 text-gray-500 text-center py-12">Chưa có gói nào</p> : plans.map(p => (
                        <Card key={p.id}>
                            <div className="flex justify-between items-start mb-3">
                                <div><h3 className="text-lg font-semibold">{p.name}</h3><p className="text-sm text-gray-500">{p.description}</p></div>
                                <StatusBadge status={p.active ? 'ACTIVE' : 'INACTIVE'} />
                            </div>
                            <div className="text-3xl font-bold text-indigo-600 mb-1">{fmt(p.price)}<span className="text-sm font-normal text-gray-500">/{p.interval === 'YEARLY' ? 'năm' : 'tháng'}</span></div>
                            <div className="text-sm text-gray-500 mb-4">{p.subscriberCount} subscribers</div>
                            {p.features.length > 0 && (
                                <ul className="space-y-1 mb-4">{p.features.map((f, i) => <li key={i} className="text-sm text-gray-600 flex items-center gap-2"><span className="text-green-500">✓</span>{f}</li>)}</ul>
                            )}
                            <button onClick={() => openEdit(p)} className="w-full text-center py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm">Chỉnh sửa</button>
                        </Card>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">{editId ? 'Chỉnh sửa gói' : 'Tạo gói mới'}</h3>
                        <div className="space-y-4">
                            <InputGroup label="Tên gói" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                            <InputGroup label="Mô tả" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
                            <InputGroup label="Giá (VND)" type="number" value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} required />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chu kỳ</label>
                                <select value={formData.interval} onChange={e => setFormData(p => ({ ...p, interval: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                                    <option value="MONTHLY">Hàng tháng</option><option value="YEARLY">Hàng năm</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tính năng (mỗi dòng 1 tính năng)</label>
                                <textarea value={formData.features} onChange={e => setFormData(p => ({ ...p, features: e.target.value }))} rows={4} className="w-full border rounded-lg px-3 py-2" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Hủy</button>
                            <button onClick={handleSave} disabled={saving || !formData.name || !formData.price} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {saving ? 'Đang lưu...' : editId ? 'Cập nhật' : 'Tạo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
