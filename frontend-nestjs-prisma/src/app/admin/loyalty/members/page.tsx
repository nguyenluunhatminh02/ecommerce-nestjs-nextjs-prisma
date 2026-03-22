'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    Card, ConfirmDialog, LoadingSpinner, InputGroup
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface LoyaltyMember {
    id: string;
    userName: string;
    userEmail: string;
    points: number;
    tier: string;
    totalPointsEarned: number;
    totalPointsSpent: number;
    joinedAt: string;
}

export default function AdminLoyaltyMembersPage() {
    const [members, setMembers] = useState<LoyaltyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());
            const { data } = await apiClient.get(`/loyalty/admin/members?${params.toString()}`);
            const res = data.data || data;
            const items = Array.isArray(res) ? res : res.content || res.items || [];
            setMembers(items.map((m: Record<string, unknown>) => ({
                id: String(m.id),
                userName: String((m as Record<string, Record<string, unknown>>).user?.fullName || m.userName || ''),
                userEmail: String((m as Record<string, Record<string, unknown>>).user?.email || m.userEmail || ''),
                points: Number(m.points || m.currentPoints || 0),
                tier: String(m.tier || m.membershipTier || 'BRONZE'),
                totalPointsEarned: Number(m.totalPointsEarned || 0),
                totalPointsSpent: Number(m.totalPointsSpent || 0),
                joinedAt: String(m.joinedAt || m.createdAt || ''),
            })));
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.totalElements || res.total || items.length);
        } catch { toast.error('Không thể tải danh sách thành viên'); }
        finally { setLoading(false); }
    }, [search, page, size]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const tierColors: Record<string, string> = {
        BRONZE: 'bg-orange-100 text-orange-700',
        SILVER: 'bg-gray-100 text-gray-700',
        GOLD: 'bg-yellow-100 text-yellow-700',
        PLATINUM: 'bg-purple-100 text-purple-700',
        DIAMOND: 'bg-blue-100 text-blue-700',
    };

    const columns = [
        { key: 'userName', label: 'Thành viên', render: (_: unknown, r: LoyaltyMember) => (<div><div className="font-medium">{r.userName}</div><div className="text-xs text-gray-500">{r.userEmail}</div></div>) },
        { key: 'points', label: 'Điểm hiện tại', render: (_: unknown, r: LoyaltyMember) => <span className="font-semibold text-indigo-600">{r.points.toLocaleString()}</span> },
        { key: 'tier', label: 'Hạng', render: (_: unknown, r: LoyaltyMember) => <span className={`px-2 py-1 text-xs rounded-full font-medium ${tierColors[r.tier] || 'bg-gray-100'}`}>{r.tier}</span> },
        { key: 'totalPointsEarned', label: 'Tổng tích', render: (_: unknown, r: LoyaltyMember) => r.totalPointsEarned.toLocaleString() },
        { key: 'totalPointsSpent', label: 'Tổng dùng', render: (_: unknown, r: LoyaltyMember) => r.totalPointsSpent.toLocaleString() },
        { key: 'joinedAt', label: 'Ngày tham gia', render: (_: unknown, r: LoyaltyMember) => r.joinedAt ? new Date(r.joinedAt).toLocaleDateString('vi-VN') : '—' },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Thành viên Loyalty" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Loyalty', href: '/admin/loyalty' }, { label: 'Thành viên' }]} />
            <Card>
                <TableToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Tìm thành viên..." />
                {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={members} emptyMessage="Chưa có thành viên nào" />}
                <TablePagination currentPage={page + 1} totalPages={totalPages} totalItems={totalItems} pageSize={size} onPageChange={(p) => setPage(p - 1)} onPageSizeChange={(s) => { setSize(s); setPage(0); }} />
            </Card>
        </div>
    );
}
