'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, StatsCard, Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface AuditLog {
    id: number;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    userEmail: string;
    details: string;
    ipAddress: string;
    createdAt: string;
}

interface AuditStats {
    totalLogs: number;
    todayLogs: number;
    topActions: { action: string; count: number }[];
    topEntities: { entityType: string; count: number }[];
}

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filterAction, setFilterAction] = useState('');
    const [filterEntity, setFilterEntity] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, limit: 20 };
            if (filterAction) params.action = filterAction;
            if (filterEntity) params.entityType = filterEntity;

            const [logsRes, statsRes] = await Promise.all([
                apiClient.get('/admin/audit-logs', { params }).catch(() => null),
                apiClient.get('/admin/audit-logs/stats').catch(() => null),
            ]);

            if (logsRes) {
                const res = logsRes.data.data || logsRes.data;
                const items = Array.isArray(res) ? res : res.items || res.content || [];
                setLogs(items.map((l: Record<string, unknown>) => ({
                    id: Number(l.id), action: String(l.action || ''), entityType: String(l.entityType || ''),
                    entityId: String(l.entityId || ''), userId: String(l.userId || ''),
                    userEmail: String(l.userEmail || l.email || ''), details: String(l.details || ''),
                    ipAddress: String(l.ipAddress || ''), createdAt: String(l.createdAt || ''),
                })));
                setTotal(res.total || items.length);
            }
            if (statsRes) {
                const s = statsRes.data.data || statsRes.data;
                setStats({
                    totalLogs: s.totalLogs || 0, todayLogs: s.todayLogs || 0,
                    topActions: Array.isArray(s.topActions) ? s.topActions : [],
                    topEntities: Array.isArray(s.topEntities) ? s.topEntities : [],
                });
            }
        } catch { toast.error('Không thể tải audit logs'); }
        finally { setLoading(false); }
    }, [page, filterAction, filterEntity]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const actionColor = (action: string) => {
        switch (action.toUpperCase()) {
            case 'CREATE': return 'bg-green-100 text-green-800';
            case 'UPDATE': return 'bg-blue-100 text-blue-800';
            case 'DELETE': return 'bg-red-100 text-red-800';
            case 'LOGIN': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const columns = [
        { key: 'createdAt', label: 'Thời gian', render: (_: unknown, r: AuditLog) => <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString('vi-VN')}</span> },
        { key: 'action', label: 'Hành động', render: (_: unknown, r: AuditLog) => <span className={`px-2 py-1 rounded text-xs font-medium ${actionColor(r.action)}`}>{r.action}</span> },
        { key: 'entityType', label: 'Đối tượng', render: (_: unknown, r: AuditLog) => <span className="text-sm">{r.entityType}</span> },
        { key: 'entityId', label: 'ID', render: (_: unknown, r: AuditLog) => <span className="text-xs text-gray-500 font-mono">{r.entityId.slice(0, 8)}...</span> },
        { key: 'userEmail', label: 'Người thực hiện', render: (_: unknown, r: AuditLog) => <span className="text-sm">{r.userEmail || r.userId.slice(0, 8)}</span> },
        { key: 'details', label: 'Chi tiết', render: (_: unknown, r: AuditLog) => <span className="text-xs text-gray-500 truncate max-w-[200px] block">{r.details}</span> },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Audit Logs" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Audit Logs' }]} />

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatsCard title="Tổng logs" value={stats.totalLogs.toLocaleString()} icon="📋" iconBg="bg-blue-100" />
                    <StatsCard title="Hôm nay" value={stats.todayLogs} icon="📅" iconBg="bg-green-100" />
                    <StatsCard title="Top hành động" value={stats.topActions[0]?.action || '-'} icon="⚡" iconBg="bg-purple-100" />
                    <StatsCard title="Top đối tượng" value={stats.topEntities[0]?.entityType || '-'} icon="🎯" iconBg="bg-orange-100" />
                </div>
            )}

            <Card>
                <div className="flex gap-3 mb-4">
                    <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
                        <option value="">Tất cả hành động</option>
                        <option value="CREATE">CREATE</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                        <option value="LOGIN">LOGIN</option>
                    </select>
                    <select value={filterEntity} onChange={e => { setFilterEntity(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
                        <option value="">Tất cả đối tượng</option>
                        <option value="PRODUCT">PRODUCT</option>
                        <option value="ORDER">ORDER</option>
                        <option value="USER">USER</option>
                        <option value="CATEGORY">CATEGORY</option>
                    </select>
                </div>
                {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={logs} emptyMessage="Chưa có audit log nào" />}
                {total > 20 && (
                    <div className="flex justify-center gap-2 mt-4">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Trước</button>
                        <span className="px-3 py-1 text-sm">Trang {page} / {Math.ceil(total / 20)}</span>
                        <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Sau</button>
                    </div>
                )}
            </Card>
        </div>
    );
}
