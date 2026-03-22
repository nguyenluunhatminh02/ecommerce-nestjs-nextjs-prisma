'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface WalletStats {
    totalBalance: number;
    totalUsers: number;
    totalTransactions: number;
}

interface WalletRow {
    id: string;
    userName: string;
    userEmail: string;
    balance: number;
    lastTransaction: string | null;
    status: string;
    createdAt: string;
}

export default function AdminWalletsPage() {
    const [stats, setStats] = useState<WalletStats>({ totalBalance: 0, totalUsers: 0, totalTransactions: 0 });
    const [wallets, setWallets] = useState<WalletRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            params.append('sortBy', sortField);
            params.append('sortDirection', sortDir);

            const { data } = await apiClient.get(`/wallet/admin/all?${params.toString()}`);
            const res = data.data || data;

            if (res.stats) {
                setStats({
                    totalBalance: res.stats.totalBalance || 0,
                    totalUsers: res.stats.totalWallets || res.stats.activeWallets || 0,
                    totalTransactions: res.stats.totalTransactions || 0,
                });
            } else {
                setStats({
                    totalBalance: res.totalBalance || 0,
                    totalUsers: res.totalUsers || res.totalElements || 0,
                    totalTransactions: res.totalTransactions || 0,
                });
            }

            setWallets(Array.isArray(res) ? res : res.content || res.wallets || []);
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.totalElements || (Array.isArray(res) ? res.length : 0));
        } catch {
            toast.error('Không thể tải dữ liệu ví');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, sortField, sortDir]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSort = (field: string) => {
        if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

    const statCards = [
        { title: 'Tổng số dư', value: fmt(stats.totalBalance), color: 'bg-green-50 text-green-600', icon: '💰' },
        { title: 'Tổng người dùng', value: stats.totalUsers, color: 'bg-blue-50 text-blue-600', icon: '👤' },
        { title: 'Tổng giao dịch', value: stats.totalTransactions, color: 'bg-purple-50 text-purple-600', icon: '📊' },
    ];

    const columns = [
        {
            key: 'userName', label: 'Người dùng',
            render: (_: unknown, row: WalletRow) => (
                <div>
                    <p className="font-medium text-gray-900">{row.userName || '—'}</p>
                    <p className="text-xs text-gray-500">{row.userEmail || ''}</p>
                </div>
            )
        },
        {
            key: 'balance', label: 'Số dư', sortable: true,
            render: (_: unknown, row: WalletRow) => <span className="font-semibold text-gray-900">{fmt(row.balance)}</span>
        },
        {
            key: 'lastTransaction', label: 'Giao dịch cuối',
            render: (_: unknown, row: WalletRow) => (
                <span className="text-sm text-gray-500">
                    {row.lastTransaction ? new Date(row.lastTransaction).toLocaleDateString('vi-VN') : '—'}
                </span>
            )
        },
        { key: 'status', label: 'Trạng thái', render: (_: unknown, row: WalletRow) => <StatusBadge status={row.status} /> },
    ];

    return (
        <div>
            <PageHeader
                title="Quản lý ví"
                description={`Tổng cộng ${totalItems} ví`}
                breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Ví' }]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
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
                <TableToolbar searchValue={search} onSearchChange={(val) => { setSearch(val); setPage(0); }} searchPlaceholder="Tìm kiếm ví..." />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : wallets.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không tìm thấy ví nào</p>
                        <p className="text-sm mt-1">Chưa có người dùng nào có ví</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={wallets} sortField={sortField} sortDirection={sortDir} onSort={handleSort} />
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
