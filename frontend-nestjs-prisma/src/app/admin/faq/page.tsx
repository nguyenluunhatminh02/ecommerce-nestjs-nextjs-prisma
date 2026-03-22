'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, Card, ConfirmDialog, LoadingSpinner, InputGroup
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface FaqRow {
    id: number;
    question: string;
    answer: string;
    category: string;
    sortOrder: number;
    active: boolean;
}

export default function AdminFaqPage() {
    const [faqs, setFaqs] = useState<FaqRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: number }>({ open: false });
    const [formData, setFormData] = useState({ question: '', answer: '', category: 'GENERAL', sortOrder: '0' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/faqs');
            const res = data.data || data;
            setFaqs((Array.isArray(res) ? res : res.content || []).map((f: Record<string, unknown>) => ({
                id: Number(f.id), question: String(f.question || ''), answer: String(f.answer || ''),
                category: String(f.category || 'GENERAL'), sortOrder: Number(f.sortOrder || f.sort_order || 0), active: Boolean(f.active ?? true),
            })));
        } catch { toast.error('Không thể tải FAQ'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { question: formData.question, answer: formData.answer, category: formData.category, sortOrder: parseInt(formData.sortOrder) };
            if (editId) { await apiClient.put(`/faqs/${editId}`, payload); toast.success('Cập nhật thành công'); }
            else { await apiClient.post('/faqs', payload); toast.success('Tạo FAQ thành công'); }
            setShowForm(false); setEditId(null); setFormData({ question: '', answer: '', category: 'GENERAL', sortOrder: '0' }); fetchData();
        } catch { toast.error('Thao tác thất bại'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        try { await apiClient.delete(`/faqs/${deleteDialog.id}`); toast.success('Đã xóa'); setDeleteDialog({ open: false }); fetchData(); }
        catch { toast.error('Không thể xóa'); }
    };

    const openEdit = (f: FaqRow) => {
        setEditId(f.id); setFormData({ question: f.question, answer: f.answer, category: f.category, sortOrder: String(f.sortOrder) }); setShowForm(true);
    };

    const columns = [
        { key: 'question', label: 'Câu hỏi', render: (_: unknown, r: FaqRow) => <span className="font-medium">{r.question}</span> },
        { key: 'answer', label: 'Trả lời', render: (_: unknown, r: FaqRow) => <span className="text-gray-600 text-sm line-clamp-2">{r.answer}</span> },
        { key: 'category', label: 'Danh mục', render: (_: unknown, r: FaqRow) => <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">{r.category}</span> },
        { key: 'sortOrder', label: 'Thứ tự', render: (_: unknown, r: FaqRow) => r.sortOrder },
        {
            key: 'actions', label: '', render: (_: unknown, r: FaqRow) => (
                <div className="flex gap-2">
                    <button onClick={() => openEdit(r)} className="text-indigo-600 text-sm hover:underline">Sửa</button>
                    <button onClick={() => setDeleteDialog({ open: true, id: r.id })} className="text-red-600 text-sm hover:underline">Xóa</button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="FAQ" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'FAQ' }]}
                actions={<button onClick={() => { setEditId(null); setFormData({ question: '', answer: '', category: 'GENERAL', sortOrder: '0' }); setShowForm(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Thêm FAQ</button>} />
            <Card>
                {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={faqs} emptyMessage="Chưa có FAQ nào" />}
            </Card>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">{editId ? 'Sửa FAQ' : 'Thêm FAQ'}</h3>
                        <div className="space-y-4">
                            <InputGroup label="Câu hỏi" value={formData.question} onChange={e => setFormData(p => ({ ...p, question: e.target.value }))} required />
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Trả lời</label>
                                <textarea value={formData.answer} onChange={e => setFormData(p => ({ ...p, answer: e.target.value }))} rows={4} className="w-full border rounded-lg px-3 py-2" required /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                                <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} className="w-full border rounded-lg px-3 py-2">
                                    <option value="GENERAL">Chung</option><option value="SHIPPING">Vận chuyển</option><option value="PAYMENT">Thanh toán</option><option value="RETURNS">Đổi trả</option><option value="ACCOUNT">Tài khoản</option>
                                </select></div>
                            <InputGroup label="Thứ tự" type="number" value={formData.sortOrder} onChange={e => setFormData(p => ({ ...p, sortOrder: e.target.value }))} />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Hủy</button>
                            <button onClick={handleSave} disabled={saving || !formData.question || !formData.answer} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {saving ? 'Đang lưu...' : editId ? 'Cập nhật' : 'Tạo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmDialog open={deleteDialog.open} title="Xóa FAQ" message="Bạn có chắc muốn xóa câu hỏi này?"
                confirmLabel="Xóa" onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false })} variant="danger" />
        </div>
    );
}
