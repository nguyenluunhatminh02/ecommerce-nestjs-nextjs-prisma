'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface Question {
    id: string;
    productName: string;
    userName: string;
    question: string;
    answer: string | null;
    createdAt: string;
}

export default function AdminQuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [answerDialog, setAnswerDialog] = useState<{ open: boolean; id?: string; question?: string }>({ open: false });
    const [answer, setAnswer] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('size', size.toString());
            const { data } = await apiClient.get(`/product-questions/pending?${params.toString()}`);
            const res = data.data || data;
            const items = Array.isArray(res) ? res : res.content || res.items || [];
            setQuestions(items.map((q: Record<string, unknown>) => ({
                id: String(q.id),
                productName: String((q as Record<string, Record<string, unknown>>).product?.name || q.productName || ''),
                userName: String((q as Record<string, Record<string, unknown>>).user?.fullName || q.userName || ''),
                question: String(q.question || ''),
                answer: q.answer ? String(q.answer) : null,
                createdAt: String(q.createdAt || ''),
            })));
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.totalElements || res.total || items.length);
        } catch { toast.error('Không thể tải câu hỏi'); }
        finally { setLoading(false); }
    }, [page, size]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAnswer = async () => {
        if (!answerDialog.id || !answer.trim()) return;
        setSaving(true);
        try {
            await apiClient.put(`/product-questions/${answerDialog.id}/answer`, { answer });
            toast.success('Đã trả lời');
            setAnswerDialog({ open: false });
            setAnswer('');
            fetchData();
        } catch { toast.error('Không thể trả lời'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa câu hỏi này?')) return;
        try { await apiClient.delete(`/product-questions/${id}`); toast.success('Đã xóa'); fetchData(); }
        catch { toast.error('Không thể xóa'); }
    };

    const columns = [
        { key: 'productName', label: 'Sản phẩm', render: (_: unknown, r: Question) => <span className="font-medium text-sm">{r.productName}</span> },
        { key: 'userName', label: 'Người hỏi', render: (_: unknown, r: Question) => <span className="text-sm">{r.userName}</span> },
        { key: 'question', label: 'Câu hỏi', render: (_: unknown, r: Question) => <span className="text-sm">{r.question}</span> },
        {
            key: 'answer', label: 'Trả lời', render: (_: unknown, r: Question) => r.answer
                ? <span className="text-sm text-green-600">{r.answer}</span>
                : <span className="text-sm text-orange-500 italic">Chưa trả lời</span>
        },
        { key: 'createdAt', label: 'Ngày', render: (_: unknown, r: Question) => new Date(r.createdAt).toLocaleDateString('vi-VN') },
        {
            key: 'actions', label: '', render: (_: unknown, r: Question) => (
                <div className="flex gap-2">
                    <button onClick={() => { setAnswerDialog({ open: true, id: r.id, question: r.question }); setAnswer(r.answer || ''); }} className="text-indigo-600 text-sm hover:underline">Trả lời</button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-600 text-sm hover:underline">Xóa</button>
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Câu hỏi sản phẩm" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Questions' }]} />
            <Card>
                <TableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Tìm câu hỏi..." totalItems={totalItems} />
                {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={questions} emptyMessage="Chưa có câu hỏi nào" />}
                <TablePagination currentPage={page + 1} totalPages={totalPages} totalItems={totalItems} pageSize={size} onPageChange={(p) => setPage(p - 1)} onPageSizeChange={setSize} />
            </Card>

            {answerDialog.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setAnswerDialog({ open: false })}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-2">Trả lời câu hỏi</h3>
                        <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">&ldquo;{answerDialog.question}&rdquo;</p>
                        <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={4} className="w-full border rounded-lg px-3 py-2 mb-4" placeholder="Nhập câu trả lời..." />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setAnswerDialog({ open: false })} className="px-4 py-2 border rounded-lg">Hủy</button>
                            <button onClick={handleAnswer} disabled={saving || !answer.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {saving ? 'Đang gửi...' : 'Gửi trả lời'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
