'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, DataTable, TableToolbar, TablePagination,
    StatusBadge, Card, ConfirmDialog, Avatar, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface UserRow {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isActive: boolean;
    twoFactorEnabled: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

const ROLES = [
    { label: 'Customer', value: 'ROLE_CUSTOMER' },
    { label: 'Seller', value: 'ROLE_SELLER' },
    { label: 'Admin', value: 'ROLE_ADMIN' },
    { label: 'Super Admin', value: 'ROLE_SUPER_ADMIN' },
];

export default function AdminCustomersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [roleFilter, setRoleFilter] = useState('');
    const [toggleDialog, setToggleDialog] = useState<{ open: boolean; user?: UserRow }>({ open: false });
    const [roleDialog, setRoleDialog] = useState<{ open: boolean; user?: UserRow; newRole?: string }>({ open: false });
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user?: UserRow }>({ open: false });
    const [actionLoading, setActionLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            let url = '/users';
            const params: Record<string, string | number> = { page, size };
            if (search) {
                url = '/users/search';
                params.keyword = search;
            }
            const { data } = await apiClient.get(url, { params });
            const res = data.data || data;
            let userList = (res.content || []).map((u: Record<string, unknown>) => ({
                ...u,
                role: (() => {
                    const roles = u.userRoles as Array<{ roles?: { name?: string } }> | undefined;
                    const roleName = roles?.[0]?.roles?.name || '';
                    const map: Record<string, string> = { USER: 'CUSTOMER', ADMIN: 'ADMIN', SELLER: 'SELLER', SUPER_ADMIN: 'SUPER_ADMIN' };
                    return map[roleName] || roleName;
                })(),
                isActive: u.isActive ?? u.active ?? true,
                isEmailVerified: u.isEmailVerified ?? u.emailVerified ?? false,
                isPhoneVerified: u.isPhoneVerified ?? u.phoneVerified ?? false,
                twoFactorEnabled: u.twoFactorEnabled ?? u.twoFactorEnabled ?? false,
            }));
            if (roleFilter) {
                userList = userList.filter((u: UserRow) => u.role === roleFilter || u.role === `ROLE_${roleFilter}`);
            }
            setUsers(userList as UserRow[]);
            setTotalPages(res.totalPages || 0);
            setTotalItems(res.totalElements || 0);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    }, [search, page, size, roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleToggleStatus = async () => {
        if (!toggleDialog.user) return;
        setActionLoading(true);
        try {
            await apiClient.put(`/users/${toggleDialog.user.id}/toggle-status`);
            toast.success(toggleDialog.user.isActive ? 'Đã vô hiệu hóa tài khoản' : 'Đã kích hoạt tài khoản');
            setToggleDialog({ open: false });
            fetchUsers();
        } catch (err) {
            toast.error('Không thể thay đổi trạng thái');
        } finally {
            setActionLoading(false);
        }
    };

    const handleChangeRole = async () => {
        if (!roleDialog.user || !roleDialog.newRole) return;
        setActionLoading(true);
        try {
            await apiClient.put(`/users/${roleDialog.user.id}/role?role=${roleDialog.newRole}`);
            toast.success(`Đã đổi vai trò thành ${roleDialog.newRole}`);
            setRoleDialog({ open: false });
            fetchUsers();
        } catch (err) {
            toast.error('Không thể thay đổi vai trò');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.user) return;
        setActionLoading(true);
        try {
            await apiClient.delete(`/users/${deleteDialog.user.id}`);
            toast.success('Đã xóa tài khoản');
            setDeleteDialog({ open: false });
            fetchUsers();
        } catch (err) {
            toast.error('Không thể xóa tài khoản');
        } finally {
            setActionLoading(false);
        }
    };

    const getRoleBadge = (role: string) => {
        const cleanRole = (role || '').replace('ROLE_', '');
        const colors: Record<string, string> = {
            ADMIN: 'bg-purple-100 text-purple-700',
            SELLER: 'bg-blue-100 text-blue-700',
            CUSTOMER: 'bg-gray-100 text-gray-700',
            SUPER_ADMIN: 'bg-red-100 text-red-700',
        };
        return (
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${colors[cleanRole] || 'bg-gray-100 text-gray-600'}`}>
                {cleanRole}
            </span>
        );
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const columns = [
        {
            key: 'user',
            label: 'Người dùng',
            render: (_: unknown, row: UserRow) => (
                <div className="flex items-center gap-3">
                    <Avatar name={row.fullName || row.email} src={row.avatarUrl || undefined} size="md" />
                    <div>
                        <p className="font-medium text-gray-900">{row.fullName || `${row.firstName} ${row.lastName}`}</p>
                        <p className="text-xs text-gray-500">{row.email}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'phone',
            label: 'Số điện thoại',
            render: (_: unknown, row: UserRow) => (
                <span className="text-gray-600">{row.phone || '—'}</span>
            )
        },
        {
            key: 'role',
            label: 'Vai trò',
            render: (_: unknown, row: UserRow) => getRoleBadge(row.role)
        },
        {
            key: 'emailVerified',
            label: 'Email',
            render: (_: unknown, row: UserRow) => (
                <span className={`text-xs font-medium ${row.isEmailVerified ? 'text-green-600' : 'text-gray-400'}`}>
                    {row.isEmailVerified ? '✓ Đã xác thực' : '✗ Chưa xác thực'}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (_: unknown, row: UserRow) => (
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${row.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={`text-sm ${row.isActive ? 'text-green-700' : 'text-red-700'}`}>
                        {row.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                </div>
            )
        },
        {
            key: 'createdAt',
            label: 'Ngày tạo',
            render: (_: unknown, row: UserRow) => (
                <span className="text-sm text-gray-500">{formatDate(row.createdAt)}</span>
            )
        },
        {
            key: 'actions',
            label: '',
            align: 'right' as const,
            render: (_: unknown, row: UserRow) => (
                <div className="flex items-center gap-1 justify-end">
                    {/* Change Role */}
                    <select
                        onClick={(e) => e.stopPropagation()}
                        value={row.role}
                        onChange={(e) => {
                            e.stopPropagation();
                            setRoleDialog({ open: true, user: row, newRole: e.target.value });
                        }}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 cursor-pointer"
                    >
                        {ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>

                    {/* Toggle Status */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setToggleDialog({ open: true, user: row }); }}
                        className={`p-1.5 rounded-lg transition-colors ${
                            row.isActive
                                ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                                : 'text-green-500 hover:text-green-700 hover:bg-green-50'
                        }`}
                        title={row.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    >
                        {row.isActive ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                    </button>

                    {/* Delete */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, user: row }); }}
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
                title="Quản lý người dùng"
                description={`Tổng cộng ${totalItems} người dùng`}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Người dùng' }
                ]}
            />

            {/* Role filter */}
            <div className="flex items-center gap-2 mt-6 mb-4">
                {[{ label: 'Tất cả', value: '' }, ...ROLES].map(r => (
                    <button
                        key={r.value}
                        onClick={() => { setRoleFilter(r.value); setPage(0); }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                            roleFilter === r.value
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            <Card>
                <TableToolbar
                    searchValue={search}
                    onSearchChange={(val) => { setSearch(val); setPage(0); }}
                    searchPlaceholder="Tìm kiếm theo tên, email..."
                />

                {loading ? (
                    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
                ) : users.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        <p className="text-lg font-medium">Không tìm thấy người dùng</p>
                    </div>
                ) : (
                    <DataTable columns={columns} data={users} />
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

            {/* Toggle Status Dialog */}
            <ConfirmDialog
                open={toggleDialog.open}
                title={toggleDialog.user?.isActive ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
                message={`Bạn có chắc chắn muốn ${toggleDialog.user?.isActive ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản "${toggleDialog.user?.fullName}"?`}
                confirmLabel="Xác nhận"
                variant={toggleDialog.user?.isActive ? 'warning' : 'info'}
                onConfirm={handleToggleStatus}
                onCancel={() => setToggleDialog({ open: false })}
                loading={actionLoading}
            />

            {/* Change Role Dialog */}
            <ConfirmDialog
                open={roleDialog.open}
                title="Thay đổi vai trò"
                message={`Đổi vai trò của "${roleDialog.user?.fullName}" từ ${roleDialog.user?.role} sang ${roleDialog.newRole}?`}
                confirmLabel="Xác nhận"
                variant="warning"
                onConfirm={handleChangeRole}
                onCancel={() => setRoleDialog({ open: false })}
                loading={actionLoading}
            />

            {/* Delete Dialog */}
            <ConfirmDialog
                open={deleteDialog.open}
                title="Xóa tài khoản"
                message={`Bạn có chắc chắn muốn xóa tài khoản "${deleteDialog.user?.fullName}"? Hành động này không thể hoàn tác.`}
                confirmLabel="Xóa"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false })}
                loading={actionLoading}
            />
        </div>
    );
}
