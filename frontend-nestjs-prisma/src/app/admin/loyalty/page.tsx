'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface LoyaltyStats {
    totalMembers: number;
    totalPointsIssued: number;
    totalRedeemed: number;
    activePrograms: number;
}

interface LoyaltyTransaction {
    id: string;
    userName: string;
    userEmail: string;
    points: number;
    type: string;
    description: string;
    createdAt: string;
}

export default function AdminLoyaltyPage() {
    const [stats, setStats] = useState<LoyaltyStats>({ totalMembers: 0, totalPointsIssued: 0, totalRedeemed: 0, activePrograms: 0 });
    const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [typeFilter, setTypeFilter] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            if (typeFilter) params.append('type', typeFilter);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);

            const [loyaltyRes, txRes] = await Promise.all([
                apiClient.get('/loyalty').catch(() => null),
                apiClient.get(`/loyalty/transactions?${params.toString()}`).catch(() => null),
            ]);

            if (loyaltyRes) {
                const d = loyaltyRes.data.data || loyaltyRes.data;
                setStats({
                    totalMembers: d.totalMembers || d.membersCount || 0,
                    totalPointsIssued: d.totalPointsIssued || d.pointsIssued || 0,
                    totalRedeemed: d.totalRedeemed || d.pointsRedeemed || 0,
                    activePrograms: d.activePrograms || d.programsCount || 0,
                });
            }
            if (txRes) {
                const res = txRes.data.data || txRes.data;
                setTransactions(Array.isArray(res) ? res : res.content || []);
                setTotalPages(res.totalPages || 0);
                setTotalItems(res.totalElements || (Array.isArray(res) ? res.length : 0));
            }
        } catch {
            toast.error('Không thể tải dữ liệu chương trình khách hàng thân thiết');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, sortField, sortDir, typeFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSort = (field: string) => {
        if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const statCards = [
        { title: 'Tổng thành viên', value: stats.totalMembers, color: 'bg-blue-50 text-blue-600', icon: '👥' },
        { title: 'Tổng điểm phát hành', value: stats.totalPointsIssued.toLocaleString('vi-VN'), color: 'bg-green-50 text-green-600', icon: '🎯' },
        { title: 'Tổng điểm đã đổi', value: stats.totalRedeemed.toLocaleString('vi-VN'), color: 'bg-amber-50 text-amber-600', icon: '🎁' },
        { title: 'Chương trình hoạt động', value: stats.activePrograms, color: 'bg-purple-50 text-purple-600', icon: '🏆' },
    ];

    const columns = [
        {
            key: 'userName', label: 'Người dùng',
            render: (_: unknown, row: LoyaltyTransaction) => (
                <div>
                    <p className="font-medium text-gray-900">{row.userName || '—'}</p>
                    <p className="text-xs text-gray-500">{row.userEmail || ''}</p>
                </div>
            )
        },
        {
            key: 'points', label: 'Điểm', sortable: true,
            render: (_: unknown, row: LoyaltyTransaction) => (
                <span className={`font-semibold ${row.type === 'EARN' ? 'text-green-600' : 'text-red-600'}`}>
                    {row.type === 'EARN' ? '+' : '-'}{row.points.toLocaleString('vi-VN')}
                </span>
            )
        },
        {
            key: 'type', label: 'Loại',
            render: (_: unknown, row: LoyaltyTransaction) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.type === 'EARN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.type === 'EARN' ? 'Tích điểm' : 'Đổi điểm'}
                </span>
            )
        },
        { key: 'description', label: 'Mô tả', render: (_: unknown, row: LoyaltyTransaction) => <span className="text-gray-600 text-sm">{row.description || '—'}</span> },
        {
            key: 'createdAt', label: 'Ngày', sortable: true,
            render: (_: unknown, row: LoyaltyTransaction) => <span className="text-sm text-gray-500">{new Date(row.createdAt).toLocaleDateString('vi-VN')}</span>
        },
    ];

    return (
        <div>
            <PageHeader
                title="Chương trình khách hàng thân thiết"
                description="Quản lý điểm thưởng và chương trình loyalty"
                breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Loyalty' }]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {statCards.map((card) => (
                    <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${card.color}`}>{card.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            <Card className="mt-6">
                <TableToolbar searchValue={search} onSearchChange={(val) => { setSearch(val); setPage(0); }} searchPlaceholder="Tìm kiếm giao dịch..."
                    filters={
                        <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600"
                            value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}>
                            <option value="">Tất cả loại</option>
                            <option value="EARN">Tích điểm</option>
                            <option value="REDEEM">Đổi điểm</option>
                        </select>
                    }
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không có giao dịch nào</p>
                        <p className="text-sm mt-1">Chưa có giao dịch điểm thưởng nào được ghi nhận</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={transactions} sortField={sortField} sortDirection={sortDir} onSort={handleSort} />
                )}

                {totalPages > 1 && (
                    <div className="mt-4">
                        <TablePagination currentPage={page + 1} totalPages={totalPages} totalItems={totalItems} pageSize={size}
                            onPageChange={(p) => setPage(p - 1)} onPageSizeChange={(s) => { setSize(s); setPage(0); }} />
                    </div>
                )}
            </Card>
        </div>
    );
}
