'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, Card, LoadingSpinner, InputGroup
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface Reward {
    id: string;
    name: string;
    description: string;
    pointsCost: number;
    type: string;
    active: boolean;
    createdAt: string;
}

export default function AdminLoyaltyRewardsPage() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', pointsCost: '', type: 'DISCOUNT' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/loyalty/rewards');
            const res = data.data || data;
            setRewards(Array.isArray(res) ? res : res.content || []);
        } catch { toast.error('Không thể tải danh sách phần thưởng'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async () => {
        setSaving(true);
        try {
            await apiClient.post('/loyalty/rewards', { ...formData, pointsCost: parseInt(formData.pointsCost) });
            toast.success('Tạo phần thưởng thành công');
            setShowForm(false);
            setFormData({ name: '', description: '', pointsCost: '', type: 'DISCOUNT' });
            fetchData();
        } catch { toast.error('Không thể tạo phần thưởng'); }
        finally { setSaving(false); }
    };

    const columns = [
        { key: 'name', label: 'Tên phần thưởng', render: (_: unknown, r: Reward) => <span className="font-medium">{r.name}</span> },
        { key: 'description', label: 'Mô tả', render: (_: unknown, r: Reward) => <span className="text-gray-600 text-sm">{r.description}</span> },
        { key: 'pointsCost', label: 'Điểm cần', render: (_: unknown, r: Reward) => <span className="font-semibold text-indigo-600">{r.pointsCost?.toLocaleString()}</span> },
        { key: 'type', label: 'Loại', render: (_: unknown, r: Reward) => <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">{r.type}</span> },
        {
            key: 'active', label: 'Trạng thái', render: (_: unknown, r: Reward) => (
                <span className={`px-2 py-1 text-xs rounded-full ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.active ? 'Hoạt động' : 'Ẩn'}</span>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Phần thưởng Loyalty" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Loyalty', href: '/admin/loyalty' }, { label: 'Phần thưởng' }]}
                actions={<button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Tạo phần thưởng</button>} />
            <Card>
                {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={rewards} emptyMessage="Chưa có phần thưởng nào" />}
            </Card>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Tạo phần thưởng</h3>
                        <div className="space-y-4">
                            <InputGroup label="Tên" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                            <InputGroup label="Mô tả" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
                            <InputGroup label="Điểm cần thiết" type="number" value={formData.pointsCost} onChange={e => setFormData(p => ({ ...p, pointsCost: e.target.value }))} required />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                                <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                                    <option value="DISCOUNT">Giảm giá</option><option value="FREE_SHIPPING">Miễn phí vận chuyển</option><option value="GIFT">Quà tặng</option><option value="VOUCHER">Voucher</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Hủy</button>
                            <button onClick={handleCreate} disabled={saving || !formData.name || !formData.pointsCost} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {saving ? 'Đang tạo...' : 'Tạo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
