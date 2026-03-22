'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';

// ==================== Stats Card ====================
interface StatsCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: React.ReactNode;
    iconBg: string;
    href?: string;
}

export function StatsCard({ title, value, change, changeLabel, icon, iconBg, href }: StatsCardProps) {
    const content = (
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                    {change !== undefined && (
                        <div className="flex items-center gap-1 mt-2">
                            <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                            </span>
                            <span className="text-xs text-gray-500">{changeLabel || 'vs last period'}</span>
                        </div>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    if (href) return <Link href={href}>{content}</Link>;
    return content;
}

// ==================== Data Table ====================
interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (field: string) => void;
    selectable?: boolean;
    selectedIds?: Set<number>;
    onSelectAll?: () => void;
    onSelectRow?: (id: number) => void;
    idField?: string;
    onRowClick?: (row: T) => void;
    stickyHeader?: boolean;
    striped?: boolean;
}

export function DataTable<T extends object>({
    columns, data, loading, emptyMessage = 'No data found',
    sortField, sortDirection, onSort, selectable, selectedIds,
    onSelectAll, onSelectRow, idField = 'id', onRowClick,
    stickyHeader = false, striped = false
}: DataTableProps<T>) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="animate-pulse">
                    <div className="h-12 bg-gray-100 border-b" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-14 border-b border-gray-100 flex items-center px-6 gap-4">
                            {columns.map((_, j) => (
                                <div key={j} className="h-4 bg-gray-200 rounded flex-1" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const allSelected = data.length > 0 && selectedIds?.size === data.length;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className={`bg-gray-50 border-b border-gray-200 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
                            {selectable && (
                                <th className="w-12 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={onSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </th>
                            )}
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
                                        ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                                        ${col.sortable ? 'cursor-pointer hover:text-gray-700 select-none' : ''}`}
                                    style={col.width ? { width: col.width } : undefined}
                                    onClick={() => col.sortable && onSort?.(col.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        {col.sortable && sortField === col.key && (
                                            <span className="text-indigo-600">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center">
                                        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <p className="text-gray-500 text-sm">{emptyMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, index) => {
                                const rowData = row as Record<string, unknown>;
                                const rowId = Number(rowData[idField]);
                                const isSelected = selectedIds?.has(rowId);
                                return (
                                    <tr
                                        key={rowId || index}
                                        className={`transition-colors
                                            ${onRowClick ? 'cursor-pointer' : ''}
                                            ${isSelected ? 'bg-indigo-50' : striped && index % 2 ? 'bg-gray-50' : 'bg-white'}
                                            hover:bg-gray-50`}
                                        onClick={() => onRowClick?.(row)}
                                    >
                                        {selectable && (
                                            <td className="w-12 px-4 py-3" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected || false}
                                                    onChange={() => onSelectRow?.(rowId)}
                                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </td>
                                        )}
                                        {columns.map(col => (
                                            <td
                                                key={String(col.key)}
                                                className={`px-6 py-4 text-sm text-gray-900 whitespace-nowrap
                                                    ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                                            >
                                                {col.render
                                                    ? col.render(rowData[col.key], row, index)
                                                    : String(rowData[col.key] ?? '')}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ==================== Status Badge ====================
const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    DRAFT: 'bg-gray-100 text-gray-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-gray-100 text-gray-600',
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
    SUSPENDED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-600',
    TRIAL: 'bg-blue-100 text-blue-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    UPCOMING: 'bg-blue-100 text-blue-800',
    ENDED: 'bg-gray-100 text-gray-600',
    RECEIVED: 'bg-teal-100 text-teal-800',
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
};

interface StatusBadgeProps {
    status: string;
    size?: 'sm' | 'md';
    dot?: boolean;
}

export function StatusBadge({ status, size = 'sm', dot = false }: StatusBadgeProps) {
    const safeStatus = status || 'unknown';
    const colorClass = statusColors[safeStatus] || 'bg-gray-100 text-gray-800';
    const label = safeStatus.replace(/_/g, ' ');

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium capitalize
            ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
            ${colorClass}`}>
            {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
            {label}
        </span>
    );
}

// ==================== Page Header ====================
interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: { label: string; href?: string }[];
    actions?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
    return (
        <div className="mb-6">
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Link href="/admin" className="hover:text-gray-700">Dashboard</Link>
                    {breadcrumbs.map((crumb, i) => (
                        <React.Fragment key={i}>
                            <span>/</span>
                            {crumb.href ? (
                                <Link href={crumb.href} className="hover:text-gray-700">{crumb.label}</Link>
                            ) : (
                                <span className="text-gray-900 font-medium">{crumb.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                </div>
                {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
        </div>
    );
}

// ==================== Table Toolbar ====================
interface TableToolbarProps {
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    totalItems?: number;
    filters?: React.ReactNode;
    actions?: React.ReactNode;
    selectedCount?: number;
    bulkActions?: React.ReactNode;
}

export function TableToolbar({
    searchValue, onSearchChange, searchPlaceholder = 'Search...',
    totalItems, filters, actions, selectedCount, bulkActions
}: TableToolbarProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            {selectedCount && selectedCount > 0 ? (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">{selectedCount}</span> item(s) selected
                    </p>
                    <div className="flex items-center gap-2">{bulkActions}</div>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                        {onSearchChange && (
                            <div className="relative flex-1 max-w-md">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    value={searchValue || ''}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        )}
                        {filters}
                    </div>
                    <div className="flex items-center gap-3">
                        {typeof totalItems === 'number' && (
                            <span className="text-xs text-gray-500">{totalItems} item(s)</span>
                        )}
                        {actions && <div className="flex items-center gap-2">{actions}</div>}
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== Table Pagination ====================
interface TablePaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
}

export function TablePagination({
    currentPage, totalPages, totalItems, pageSize,
    onPageChange, onPageSizeChange, pageSizeOptions = [10, 20, 50, 100]
}: TablePaginationProps) {
    const safeTotal = totalItems || 0;
    const safeTotalPages = totalPages || 1;
    const startItem = safeTotal > 0 ? (currentPage - 1) * pageSize + 1 : 0;
    const endItem = Math.min(currentPage * pageSize, safeTotal);

    const pageNumbers = useMemo(() => {
        const pages: (number | 'ellipsis')[] = [];
        if (safeTotalPages <= 7) {
            for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('ellipsis');
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(safeTotalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }
            if (currentPage < safeTotalPages - 2) pages.push('ellipsis');
            pages.push(safeTotalPages);
        }
        return pages;
    }, [currentPage, safeTotalPages]);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
            <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>
                    Showing {startItem} to {endItem} of {safeTotal.toLocaleString()} results
                </span>
                {onPageSizeChange && (
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="border border-gray-300 rounded-md text-sm py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {pageSizeOptions.map(size => (
                            <option key={size} value={size}>{size} per page</option>
                        ))}
                    </select>
                )}
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                {pageNumbers.map((page, i) =>
                    page === 'ellipsis' ? (
                        <span key={`e${i}`} className="px-2 py-1 text-sm text-gray-400">...</span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`px-3 py-1.5 text-sm rounded-md border transition-colors
                                ${currentPage === page
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'border-gray-300 hover:bg-gray-50'}`}
                        >
                            {page}
                        </button>
                    )
                )}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

// ==================== Confirm Dialog ====================
interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export function ConfirmDialog({
    open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
    variant = 'danger', onConfirm, onCancel, loading
}: ConfirmDialogProps) {
    if (!open) return null;

    const variantStyles = {
        danger: 'bg-red-600 hover:bg-red-700',
        warning: 'bg-yellow-600 hover:bg-yellow-700',
        info: 'bg-blue-600 hover:bg-blue-700',
        primary: 'bg-indigo-600 hover:bg-indigo-700',
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <div className="text-sm text-gray-600 mt-2">{message}</div>
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        disabled={loading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${variantStyles[variant]} disabled:opacity-50`}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==================== Dropdown Menu ====================
interface DropdownItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger';
    disabled?: boolean;
}

interface DropdownMenuProps {
    trigger: React.ReactNode;
    items: DropdownItem[];
    align?: 'left' | 'right';
}

export function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative" onClick={e => e.stopPropagation()}>
            <div onClick={() => setOpen(!open)}>{trigger}</div>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className={`absolute z-50 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1
                        ${align === 'right' ? 'right-0' : 'left-0'}`}>
                        {items.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => { item.onClick(); setOpen(false); }}
                                disabled={item.disabled}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors
                                    ${item.variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}
                                    ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ==================== Tabs ====================
interface Tab {
    key: string;
    label: string;
    count?: number;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (key: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
    return (
        <div className="border-b border-gray-200 mb-6">
            <nav className="flex gap-6 -mb-px">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors
                            ${activeTab === tab.key
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs
                                ${activeTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </nav>
        </div>
    );
}

// ==================== Empty State ====================
interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            {icon || (
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
            )}
            <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
            {description && <p className="text-sm text-gray-500 mb-4 text-center max-w-md">{description}</p>}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

// ==================== Loading Spinner ====================
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
    return (
        <div className="flex items-center justify-center py-8">
            <div className={`${sizes[size]} border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin`} />
        </div>
    );
}

// ==================== Card ====================
interface CardProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export function Card({ children, title, description, actions, className = '', noPadding }: CardProps) {
    return (
        <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
            {(title || actions) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div>
                        {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
                        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
                    </div>
                    {actions}
                </div>
            )}
            <div className={noPadding ? '' : 'p-6'}>
                {children}
            </div>
        </div>
    );
}

// ==================== Form Components ====================
interface InputGroupProps {
    label: string;
    name?: string;
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    helpText?: string;
    disabled?: boolean;
    className?: string;
}

export function InputGroup({
    label, name, type = 'text', value, onChange,
    placeholder, required, error, helpText, disabled, className = ''
}: InputGroupProps) {
    const inputName = name || label.toLowerCase().replace(/\s+/g, '-');
    return (
        <div className={className}>
            <label htmlFor={inputName} className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {type === 'textarea' ? (
                <textarea
                    id={inputName}
                    name={inputName}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                        ${error ? 'border-red-300' : 'border-gray-300'}
                        ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                />
            ) : (
                <input
                    id={inputName}
                    name={inputName}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                        ${error ? 'border-red-300' : 'border-gray-300'}
                        ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                />
            )}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            {helpText && !error && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
        </div>
    );
}

interface SelectGroupProps {
    label: string;
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { label: string; value: string | number }[];
    placeholder?: string;
    required?: boolean;
    error?: string;
    disabled?: boolean;
    className?: string;
}

export function SelectGroup({
    label, name, value, onChange, options,
    placeholder, required, error, disabled, className = ''
}: SelectGroupProps) {
    return (
        <div className={className}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                    ${error ? 'border-red-300' : 'border-gray-300'}
                    ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    );
}

// ==================== Toggle Switch ====================
interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    description?: string;
}

export function Toggle({ label, checked, onChange, disabled, description }: ToggleProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <label className="text-sm font-medium text-gray-700">{label}</label>
                {description && <p className="text-xs text-gray-500">{description}</p>}
            </div>
            <button
                type="button"
                onClick={() => !disabled && onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${checked ? 'bg-indigo-600' : 'bg-gray-200'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm
                    ${checked ? 'translate-x-6' : 'translate-x-1'}`}
                />
            </button>
        </div>
    );
}

// ==================== File Upload ====================
interface FileUploadProps {
    label: string;
    accept?: string;
    multiple?: boolean;
    onChange: (files: File[]) => void;
    maxSize?: number; // in MB
    description?: string;
}

export function FileUpload({ label, accept, multiple, onChange, maxSize = 10, description }: FileUploadProps) {
    const [dragOver, setDragOver] = useState(false);

    const handleFiles = useCallback((files: FileList | null) => {
        if (!files) return;
        const validFiles = Array.from(files).filter(f => f.size <= maxSize * 1024 * 1024);
        if (validFiles.length > 0) onChange(validFiles);
    }, [maxSize, onChange]);

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                    ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}
            >
                <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600">
                    <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    {description || `Max file size: ${maxSize}MB`}
                </p>
                <input
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                />
            </div>
        </div>
    );
}

// ==================== Mini Charts ====================
interface MiniChartProps {
    data: number[];
    color?: string;
    height?: number;
}

export function MiniLineChart({ data, color = '#6366f1', height = 40 }: MiniChartProps) {
    if (!data.length) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 120;
    const points = data.map((v, i) => ({
        x: (i / (data.length - 1)) * width,
        y: height - ((v - min) / range) * (height - 4) - 2,
    }));
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function MiniBarChart({ data, color = '#6366f1', height = 40 }: MiniChartProps) {
    if (!data.length) return null;
    const max = Math.max(...data) || 1;
    const barWidth = Math.max(4, 100 / data.length - 2);

    return (
        <svg width={data.length * (barWidth + 2)} height={height}>
            {data.map((v, i) => {
                const barHeight = (v / max) * (height - 2);
                return (
                    <rect
                        key={i}
                        x={i * (barWidth + 2)}
                        y={height - barHeight}
                        width={barWidth}
                        height={barHeight}
                        rx={2}
                        fill={color}
                        opacity={0.8}
                    />
                );
            })}
        </svg>
    );
}

// ==================== Progress Bar ====================
interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    showValue?: boolean;
    color?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ value, max = 100, label, showValue = true, color = 'bg-indigo-600', size = 'md' }: ProgressBarProps) {
    const percentage = Math.min((value / max) * 100, 100);
    const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

    return (
        <div>
            {(label || showValue) && (
                <div className="flex items-center justify-between mb-1">
                    {label && <span className="text-sm text-gray-600">{label}</span>}
                    {showValue && <span className="text-sm font-medium text-gray-900">{percentage.toFixed(0)}%</span>}
                </div>
            )}
            <div className={`w-full bg-gray-200 rounded-full ${heights[size]}`}>
                <div
                    className={`${color} ${heights[size]} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

// ==================== Avatar ====================
interface AvatarProps {
    src?: string;
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
    const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
    const safeName = name || '?';
    const initials = safeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    if (src) {
        return <img src={src} alt={safeName} className={`${sizes[size]} rounded-full object-cover ${className}`} />;
    }

    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-violet-500'];
    const colorIndex = safeName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;

    return (
        <div className={`${sizes[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium ${className}`}>
            {initials}
        </div>
    );
}

// ==================== Color Dot Indicator ====================
export function ColorDot({ color, label }: { color: string; label?: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            {label && <span className="text-sm text-gray-600">{label}</span>}
        </div>
    );
}

// ==================== Tooltip ====================
export function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
    return (
        <div className="relative group inline-block">
            {children}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg
                opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
        </div>
    );
}

// ==================== Date Range Picker ====================
interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onChange: (start: string, end: string) => void;
    presets?: { label: string; days: number }[];
}

export function DateRangePicker({ startDate, endDate, onChange, presets }: DateRangePickerProps) {
    const defaultPresets = presets || [
        { label: '7 days', days: 7 },
        { label: '30 days', days: 30 },
        { label: '90 days', days: 90 },
        { label: '1 year', days: 365 },
    ];

    const applyPreset = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        onChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5">
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onChange(e.target.value, endDate)}
                    className="text-sm border-none outline-none bg-transparent"
                />
                <span className="text-gray-400">—</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onChange(startDate, e.target.value)}
                    className="text-sm border-none outline-none bg-transparent"
                />
            </div>
            <div className="flex items-center gap-1">
                {defaultPresets.map(preset => (
                    <button
                        key={preset.days}
                        onClick={() => applyPreset(preset.days)}
                        className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        {preset.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ==================== Skeleton Loaders ====================
export function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-8 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
            <div className="h-12 bg-gray-100 border-b" />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center px-6 py-4 border-b border-gray-50 gap-4">
                    {Array.from({ length: columns }).map((_, j) => (
                        <div key={j} className="h-4 bg-gray-200 rounded flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function SkeletonChart() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="h-5 w-40 bg-gray-200 rounded mb-6" />
            <div className="h-64 bg-gray-100 rounded-lg" />
        </div>
    );
}
