'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, StatsCard, LoadingSpinner, InputGroup
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface AffiliateRow {
    id: string;
    userName: string;
    userEmail: string;
    referralCode: string;
    totalEarnings: number;
    totalClicks: number;
    totalConversions: number;
    status: string;
    createdAt: string;
}

interface AffiliateProgram {
    id: string;
    name: string;
    commissionRate: number;
    active: boolean;
}

export default function AdminAffiliatesPage() {
    const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
    const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
    const [summary, setSummary] = useState({ totalAffiliates: 0, totalEarnings: 0, totalClicks: 0, totalConversions: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [tab, setTab] = useState<'affiliates' | 'programs'>('affiliates');
    const [showProgramForm, setShowProgramForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [programForm, setProgramForm] = useState({ name: '', commissionRate: '10', description: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            if (statusFilter) params.append('status', statusFilter);
            params.append('page', page.toString());
            params.append('size', size.toString());

            const [affRes, sumRes, progRes] = await Promise.all([
                apiClient.get(`/affiliates/admin/all?${params.toString()}`).catch(() => null),
                apiClient.get('/affiliates/admin/summary').catch(() => null),
                apiClient.get('/affiliates/programs/all').catch(() => null),
            ]);

            if (affRes) {
                const res = affRes.data.data || affRes.data;
                const items = Array.isArray(res) ? res : res.content || res.items || [];
                setAffiliates(items.map((a: Record<string, unknown>) => ({
                    id: String(a.id),
                    userName: String((a as Record<string, Record<string, unknown>>).user?.fullName || a.userName || ''),
                    userEmail: String((a as Record<string, Record<string, unknown>>).user?.email || a.userEmail || ''),
                    referralCode: String(a.referralCode || ''),
                    totalEarnings: Number(a.totalEarnings || 0),
                    totalClicks: Number(a.totalClicks || 0),
                    totalConversions: Number(a.totalConversions || 0),
                    status: String(a.status || 'PENDING'),
                    createdAt: String(a.createdAt || ''),
                })));
                setTotalPages(res.totalPages || 0);
                setTotalItems(res.totalElements || res.total || items.length);
            }
            if (sumRes) {
                const s = sumRes.data.data || sumRes.data;
                setSummary({
                    totalAffiliates: s.totalAffiliates || 0,
                    totalEarnings: s.totalEarnings || 0,
                    totalClicks: s.totalClicks || 0,
                    totalConversions: s.totalConversions || 0,
                });
            }
            if (progRes) {
                const res = progRes.data.data || progRes.data;
                setPrograms(Array.isArray(res) ? res : res.content || []);
            }
        } catch { toast.error('Không thể tải dữ liệu affiliate'); }
        finally { setLoading(false); }
    }, [search, page, size, statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleApprove = async (id: string) => {
        try { await apiClient.put(`/affiliates/admin/${id}/approve`); toast.success('Đã duyệt'); fetchData(); }
        catch { toast.error('Thao tác thất bại'); }
    };
    const handleSuspend = async (id: string) => {
        try { await apiClient.put(`/affiliates/admin/${id}/suspend`); toast.success('Đã tạm ngưng'); fetchData(); }
        catch { toast.error('Thao tác thất bại'); }
    };
    const handleCreateProgram = async () => {
        setSaving(true);
        try {
            await apiClient.post('/affiliates/admin/programs', {
                name: programForm.name, commissionRate: parseFloat(programForm.commissionRate), description: programForm.description,
            });
            toast.success('Tạo chương trình thành công');
            setShowProgramForm(false);
            setProgramForm({ name: '', commissionRate: '10', description: '' });
            fetchData();
        } catch { toast.error('Không thể tạo chương trình'); }
        finally { setSaving(false); }
    };

    const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

    const affColumns = [
        { key: 'userName', label: 'Affiliate', render: (_: unknown, r: AffiliateRow) => (<div><div className="font-medium">{r.userName}</div><div className="text-xs text-gray-500">{r.userEmail}</div></div>) },
        { key: 'referralCode', label: 'Mã giới thiệu', render: (_: unknown, r: AffiliateRow) => <span className="font-mono text-sm">{r.referralCode}</span> },
        { key: 'totalClicks', label: 'Clicks', render: (_: unknown, r: AffiliateRow) => r.totalClicks.toLocaleString() },
        { key: 'totalConversions', label: 'Conversions', render: (_: unknown, r: AffiliateRow) => r.totalConversions.toLocaleString() },
        { key: 'totalEarnings', label: 'Thu nhập', render: (_: unknown, r: AffiliateRow) => fmt(r.totalEarnings) },
        { key: 'status', label: 'Trạng thái', render: (_: unknown, r: AffiliateRow) => <StatusBadge status={r.status} /> },
        { key: 'actions', label: '', render: (_: unknown, r: AffiliateRow) => (
            <div className="flex gap-2">
                {r.status !== 'APPROVED' && <button onClick={() => handleApprove(r.id)} className="text-green-600 text-sm hover:underline">Duyệt</button>}
                {r.status !== 'SUSPENDED' && <button onClick={() => handleSuspend(r.id)} className="text-red-600 text-sm hover:underline">Tạm ngưng</button>}
            </div>
        )},
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Quản lý Affiliate" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Affiliates' }]} />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard title="Tổng Affiliate" value={summary.totalAffiliates} icon="👥" iconBg="bg-blue-100" />
                <StatsCard title="Tổng thu nhập" value={fmt(summary.totalEarnings)} icon="💰" iconBg="bg-green-100" />
                <StatsCard title="Tổng clicks" value={summary.totalClicks} icon="🔗" iconBg="bg-purple-100" />
                <StatsCard title="Tổng conversions" value={summary.totalConversions} icon="✅" iconBg="bg-orange-100" />
            </div>

            <div className="flex gap-2 border-b">
                <button onClick={() => setTab('affiliates')} className={`px-4 py-2 font-medium ${tab === 'affiliates' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Affiliates</button>
                <button onClick={() => setTab('programs')} className={`px-4 py-2 font-medium ${tab === 'programs' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Chương trình</button>
            </div>

            {tab === 'affiliates' ? (
                <Card>
                    <TableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Tìm affiliate..." totalItems={totalItems}
                        filters={<select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                            <option value="">Tất cả trạng thái</option><option value="PENDING">Chờ duyệt</option><option value="APPROVED">Đã duyệt</option><option value="SUSPENDED">Tạm ngưng</option>
                        </select>} />
                    {loading ? <LoadingSpinner /> : <DataTable columns={affColumns} data={affiliates} emptyMessage="Chưa có affiliate nào" />}
                    <TablePagination currentPage={page + 1} totalPages={totalPages} totalItems={totalItems} pageSize={size} onPageChange={(p) => setPage(p - 1)} onPageSizeChange={setSize} />
                </Card>
            ) : (
                <Card title="Chương trình Affiliate" actions={<button onClick={() => setShowProgramForm(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">Tạo chương trình</button>}>
                    {programs.length === 0 ? <p className="text-gray-500 text-center py-8">Chưa có chương trình nào</p> : (
                        <div className="space-y-3">
                            {programs.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div><div className="font-medium">{p.name}</div><div className="text-sm text-gray-500">Hoa hồng: {p.commissionRate}%</div></div>
                                    <StatusBadge status={p.active ? 'ACTIVE' : 'INACTIVE'} />
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {showProgramForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowProgramForm(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Tạo chương trình Affiliate</h3>
                        <div className="space-y-4">
                            <InputGroup label="Tên chương trình" value={programForm.name} onChange={e => setProgramForm(p => ({ ...p, name: e.target.value }))} required />
                            <InputGroup label="Tỷ lệ hoa hồng (%)" type="number" value={programForm.commissionRate} onChange={e => setProgramForm(p => ({ ...p, commissionRate: e.target.value }))} />
                            <InputGroup label="Mô tả" value={programForm.description} onChange={e => setProgramForm(p => ({ ...p, description: e.target.value }))} />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowProgramForm(false)} className="px-4 py-2 border rounded-lg">Hủy</button>
                            <button onClick={handleCreateProgram} disabled={saving || !programForm.name} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                {saving ? 'Đang tạo...' : 'Tạo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
