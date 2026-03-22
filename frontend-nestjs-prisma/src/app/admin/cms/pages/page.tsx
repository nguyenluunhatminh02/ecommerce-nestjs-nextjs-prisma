'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface CmsPage {
    id: string;
    title: string;
    slug: string;
    published: boolean;
    createdAt: string;
}

export default function AdminCmsPagesPage() {
    const [pages, setPages] = useState<CmsPage[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/cms/pages');
            const res = data.data || data;
            setPages((Array.isArray(res) ? res : res.content || []).map((p: Record<string, unknown>) => ({
                id: String(p.id), title: String(p.title || ''), slug: String(p.slug || ''),
                published: Boolean(p.published ?? p.active ?? true), createdAt: String(p.createdAt || ''),
            })));
        } catch { toast.error('Không thể tải danh sách trang'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa trang này?')) return;
        try { await apiClient.delete(`/cms/pages/${id}`); toast.success('Đã xóa'); fetchData(); }
        catch { toast.error('Không thể xóa'); }
    };

    const columns = [
        { key: 'title', label: 'Tiêu đề', render: (_: unknown, r: CmsPage) => <span className="font-medium">{r.title}</span> },
        { key: 'slug', label: 'Slug', render: (_: unknown, r: CmsPage) => <span className="font-mono text-sm text-gray-500">/{r.slug}</span> },
        {
            key: 'published', label: 'Trạng thái', render: (_: unknown, r: CmsPage) => (
                <span className={`px-2 py-1 text-xs rounded-full ${r.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.published ? 'Xuất bản' : 'Nháp'}</span>
            )
        },
        { key: 'createdAt', label: 'Ngày tạo', render: (_: unknown, r: CmsPage) => r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—' },
        {
            key: 'actions', label: '', render: (_: unknown, r: CmsPage) => (
                <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800 text-sm">Xóa</button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Trang CMS" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'CMS', href: '/admin/cms' }, { label: 'Trang' }]} />
            <Card>
                {loading ? <LoadingSpinner /> : <DataTable columns={columns} data={pages} emptyMessage="Chưa có trang CMS nào" />}
            </Card>
        </div>
    );
}
