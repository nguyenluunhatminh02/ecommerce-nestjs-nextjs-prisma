'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    Card, ConfirmDialog, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface CustomerGroup {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    createdAt: string;
}

export default function AdminCustomerGroupsPage() {
    const [groups, setGroups] = useState<CustomerGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: string; name?: string }>({ open: false });
    const [deleting, setDeleting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [saving, setSaving] = useState(false);

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('keyword', search);
            params.append('page', page.toString());
            params.append('size', size.toString());

            const { data } = await apiClient.get(`/customer-groups?${params.toString()}`);
            const res = data.data || data;
            setGroups(res.content || res.items || []);
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.totalElements || res.total || 0);
        } catch (err) {
            console.error('Failed to fetch customer groups:', err);
            toast.error('Không thể tải danh sách nhóm khách hàng');
        } finally {
            setLoading(false);
        }
    }, [search, page, size]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên nhóm');
            return;
        }
        setSaving(true);
        try {
            if (editingGroup) {
                await apiClient.put(`/customer-groups/${editingGroup.id}`, formData);
                toast.success('Cập nhật nhóm thành công');
            } else {
                await apiClient.post('/customer-groups', formData);
                toast.success('Tạo nhóm thành công');
            }
            setShowForm(false);
            setEditingGroup(null);
            setFormData({ name: '', description: '' });
            fetchGroups();
        } catch (err) {
            console.error('Failed to save customer group:', err);
            toast.error('Không thể lưu nhóm khách hàng');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/customer-groups/${deleteDialog.id}`);
            toast.success('Xóa nhóm thành công');
            setDeleteDialog({ open: false });
            fetchGroups();
        } catch (err) {
            console.error('Failed to delete customer group:', err);
            toast.error('Không thể xóa nhóm khách hàng');
        } finally {
            setDeleting(false);
        }
    };

    const openEdit = (group: CustomerGroup) => {
        setEditingGroup(group);
        setFormData({ name: group.name, description: group.description });
        setShowForm(true);
    };

    const openCreate = () => {
        setEditingGroup(null);
        setFormData({ name: '', description: '' });
        setShowForm(true);
    };

    const columns = [
        {
            key: 'name',
            label: 'Tên nhóm',
            sortable: true,
            render: (_: unknown, row: CustomerGroup) => (
                <span className="font-medium text-gray-900">{row.name}</span>
            )
        },
        {
            key: 'description',
            label: 'Mô tả',
            render: (_: unknown, row: CustomerGroup) => (
                <span className="text-gray-600 truncate max-w-[300px] block">{row.description || '—'}</span>
            )
        },
        {
            key: 'memberCount',
            label: 'Số thành viên',
            sortable: true,
            render: (_: unknown, row: CustomerGroup) => (
                <span className="font-medium text-gray-700">{row.memberCount ?? 0}</span>
            )
        },
        {
            key: 'createdAt',
            label: 'Ngày tạo',
            sortable: true,
            render: (_: unknown, row: CustomerGroup) => (
                <span className="text-sm text-gray-600">
                    {new Date(row.createdAt).toLocaleDateString('vi-VN')}
                </span>
            )
        },
        {
            key: 'actions',
            label: '',
            align: 'right' as const,
            render: (_: unknown, row: CustomerGroup) => (
                <div className="flex items-center gap-2 justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Chỉnh sửa"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id: row.id, name: row.name }); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Xóa"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            )
        }
    ];

    return (
        <div>
            <PageHeader
                title="Nhóm khách hàng"
                description={`Tổng cộng ${totalItems} nhóm`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Nhóm khách hàng' }
                ]}
                actions={
                    <button
                        onClick={openCreate}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Thêm nhóm
                    </button>
                }
            />

            <Card className="mt-6">
                <TableToolbar
                    searchValue={search}
                    onSearchChange={(val) => { setSearch(val); setPage(0); }}
                    searchPlaceholder="Tìm kiếm nhóm..."
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : groups.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg font-medium">Không tìm thấy nhóm nào</p>
                        <p className="text-sm mt-1">Tạo nhóm khách hàng đầu tiên</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={groups} />
                )}

                {totalPages > 1 && (
                    <div className="mt-4">
                        <TablePagination
                            currentPage={page + 1}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            pageSize={size}
                            onPageChange={(p) => setPage(p - 1)}
                            onPageSizeChange={(s) => { setSize(s); setPage(0); }}
                        />
                    </div>
                )}
            </Card>

            {/* Create/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {editingGroup ? 'Chỉnh sửa nhóm' : 'Thêm nhóm mới'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhóm</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="VD: Khách hàng VIP"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    rows={3}
                                    placeholder="Mô tả nhóm khách hàng"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => { setShowForm(false); setEditingGroup(null); }}
                                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {saving ? 'Đang lưu...' : editingGroup ? 'Cập nhật' : 'Tạo nhóm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={deleteDialog.open}
                title="Xóa nhóm khách hàng"
                message={`Bạn có chắc chắn muốn xóa nhóm "${deleteDialog.name}"? Hành động này không thể hoàn tác.`}
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false })}
                loading={deleting}
            />
        </div>
    );
}
