'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface Ticket {
    id: string;
    subject: string;
    userName: string;
    userEmail: string;
    priority: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [reply, setReply] = useState('');
    const [replying, setReplying] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            if (statusFilter) params.append('status', statusFilter);
            params.append('page', page.toString());
            params.append('size', size.toString());
            const { data } = await apiClient.get(`/support/tickets?${params.toString()}`);
            const res = data.data || data;
            const items = Array.isArray(res) ? res : res.content || res.items || [];
            setTickets(items.map((t: Record<string, unknown>) => ({
                id: String(t.id), subject: String(t.subject || t.title || ''),
                userName: String((t as Record<string, Record<string, unknown>>).user?.fullName || t.userName || ''),
                userEmail: String((t as Record<string, Record<string, unknown>>).user?.email || t.userEmail || ''),
                priority: String(t.priority || 'MEDIUM'), status: String(t.status || 'OPEN'),
                createdAt: String(t.createdAt || ''), updatedAt: String(t.updatedAt || ''),
            })));
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.totalElements || res.total || items.length);
        } catch { toast.error('Không thể tải tickets'); }
        finally { setLoading(false); }
    }, [search, page, size, statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleStatusChange = async (id: string, status: string) => {
        try { await apiClient.put(`/support/tickets/${id}/status`, { status }); toast.success('Cập nhật trạng thái thành công'); fetchData(); }
        catch { toast.error('Thao tác thất bại'); }
    };

    const handleReply = async () => {
        if (!selectedTicket || !reply.trim()) return;
        setReplying(true);
        try {
            await apiClient.post(`/support/tickets/${selectedTicket.id}/reply`, { content: reply });
            toast.success('Đã gửi phản hồi');
            setReply('');
            setSelectedTicket(null);
            fetchData();
        } catch { toast.error('Không thể gửi phản hồi'); }
        finally { setReplying(false); }
    };

    const priorityColors: Record<string, string> = { LOW: 'bg-gray-100 text-gray-700', MEDIUM: 'bg-blue-100 text-blue-700', HIGH: 'bg-orange-100 text-orange-700', URGENT: 'bg-red-100 text-red-700' };

    const columns = [
        { key: 'subject', label: 'Tiêu đề', render: (_: unknown, r: Ticket) => <span className="font-medium">{r.subject}</span> },
        { key: 'userName', label: 'Khách hàng', render: (_: unknown, r: Ticket) => (<div><div className="text-sm">{r.userName}</div><div className="text-xs text-gray-500">{r.userEmail}</div></div>) },
        { key: 'priority', label: 'Ưu tiên', render: (_: unknown, r: Ticket) => <span className={`px-2 py-1 text-xs rounded-full font-medium ${priorityColors[r.priority] || 'bg-gray-100'}`}>{r.priority}</span> },
        { key: 'status', label: 'Trạng thái', render: (_: unknown, r: Ticket) => <StatusBadge status={r.status} /> },
        { key: 'createdAt', label: 'Ngày tạo', render: (_: unknown, r: Ticket) => new Date(r.createdAt).toLocaleDateString('vi-VN') },
        {
            key: 'actions', label: '', render: (_: unknown, r: Ticket) => (
                <div className="flex gap-2">
                    <button onClick={() => setSelectedTicket(r)} className="text-indigo-600 text-sm hover:underline">Phản hồi</button>
                    {r.status !== 'CLOSED' && <button onClick={() => handleStatusChange(r.id, 'CLOSED')} className="text-red-600 text-sm hover:underline">Đóng</button>}
                </div>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Hỗ trợ khách hàng" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Support' }]} />
            <Card>
                <TableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Tìm ticket..." totalItems={totalItems}
                    filters={<select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                        <option value="">Tất cả</option><option value="OPEN">Đang mở</option><option value="IN_PROGRESS">Đang xử lý</option><option value="RESOLVED">Đã giải quyết</option><option value="CLOSED">Đã đóng</option>
                    </select>} />
                {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={tickets} emptyMessage="Chưa có ticket nào" />}
                <TablePagination currentPage={page + 1} totalPages={totalPages} totalItems={totalItems} pageSize={size} onPageChange={(p) => setPage(p - 1)} onPageSizeChange={setSize} />
            </Card>

            {selectedTicket && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedTicket(null)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-2">Phản hồi ticket</h3>
                        <p className="text-sm text-gray-500 mb-4">{selectedTicket.subject} — {selectedTicket.userName}</p>
                        <textarea value={reply} onChange={e => setReply(e.target.value)} rows={4} className="w-full border rounded-lg px-3 py-2 mb-4" placeholder="Nhập nội dung phản hồi..." />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setSelectedTicket(null)} className="px-4 py-2 border rounded-lg">Hủy</button>
                            <button onClick={handleReply} disabled={replying || !reply.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {replying ? 'Đang gửi...' : 'Gửi phản hồi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
