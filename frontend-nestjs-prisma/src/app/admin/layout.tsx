'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

// ==================== Icons (inline SVG components) ====================
const IconDashboard = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);
const IconProducts = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);
const IconOrders = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);
const IconUsers = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);
const IconCategories = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);
const IconCoupon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
);
const IconFlash = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);
const IconGift = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
);
const IconStar = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);
const IconWallet = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);
const IconReturn = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
);
const IconChart = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);
const IconCms = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
);
const IconShipping = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
);
const IconSettings = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const IconMedia = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
const IconBlog = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);
const IconSupport = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);
const IconAffiliate = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);
const IconSubscription = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);
const IconWarehouse = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
);
const IconCollection = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);
const IconFaq = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const IconNewsletter = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);
const IconNotification = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);
const IconPromotion = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
    <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);
const IconMenu = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);
const IconClose = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const IconLogout = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);
const IconSearch = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

// ==================== Types ====================
interface NavItem {
    label: string;
    href?: string;
    icon: React.ReactNode;
    children?: { label: string; href: string }[];
}

// ==================== Navigation Config ====================
const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: <IconDashboard /> },
    {
        label: 'Catalog', icon: <IconProducts />, children: [
            { label: 'Products', href: '/admin/products' },
            { label: 'Categories', href: '/admin/categories' },
            { label: 'Brands', href: '/admin/brands' },
            { label: 'Collections', href: '/admin/collections' },
            { label: 'Attributes', href: '/admin/attributes' },
        ]
    },
    {
        label: 'Sales', icon: <IconOrders />, children: [
            { label: 'Orders', href: '/admin/orders' },
            { label: 'Returns', href: '/admin/returns' },
            { label: 'Transactions', href: '/admin/transactions' },
            { label: 'Invoices', href: '/admin/invoices' },
        ]
    },
    {
        label: 'Customers', icon: <IconUsers />, children: [
            { label: 'All Customers', href: '/admin/customers' },
            { label: 'Customer Groups', href: '/admin/customer-groups' },
            { label: 'Reviews', href: '/admin/reviews' },
        ]
    },
    {
        label: 'Marketing', icon: <IconPromotion />, children: [
            { label: 'Coupons', href: '/admin/coupons' },
            { label: 'Promotions', href: '/admin/promotions' },
            { label: 'Flash Sales', href: '/admin/flash-sales' },
            { label: 'Gift Cards', href: '/admin/gift-cards' },
            { label: 'Newsletter', href: '/admin/newsletter' },
            { label: 'Affiliates', href: '/admin/affiliates' },
        ]
    },
    {
        label: 'Loyalty', icon: <IconStar />, children: [
            { label: 'Programs', href: '/admin/loyalty' },
            { label: 'Members', href: '/admin/loyalty/members' },
            { label: 'Rewards', href: '/admin/loyalty/rewards' },
        ]
    },
    { label: 'Wallets', href: '/admin/wallets', icon: <IconWallet /> },
    {
        label: 'Subscriptions', icon: <IconSubscription />, children: [
            { label: 'Plans', href: '/admin/subscriptions/plans' },
            { label: 'Subscribers', href: '/admin/subscriptions' },
        ]
    },
    {
        label: 'Content', icon: <IconCms />, children: [
            { label: 'Pages', href: '/admin/cms/pages' },
            { label: 'Blog Posts', href: '/admin/blog' },
            { label: 'FAQ', href: '/admin/faq' },
            { label: 'Media', href: '/admin/media' },
        ]
    },
    { label: 'Warehouses', href: '/admin/warehouses', icon: <IconWarehouse /> },
    {
        label: 'Shipping & Tax', icon: <IconShipping />, children: [
            { label: 'Shipping Methods', href: '/admin/shipping' },
            { label: 'Tax Rules', href: '/admin/tax' },
        ]
    },
    { label: 'Analytics', href: '/admin/analytics', icon: <IconChart /> },
    {
        label: 'Insights', icon: <IconNotification />, children: [
            { label: 'Audit Logs', href: '/admin/audit-logs' },
            { label: 'Price Alerts', href: '/admin/price-alerts' },
            { label: 'Recently Viewed', href: '/admin/recently-viewed' },
            { label: 'Recommendations', href: '/admin/recommendations' },
        ]
    },
    { label: 'Shops', href: '/admin/shops', icon: <IconCollection /> },
    {
        label: 'Support', icon: <IconSupport />, children: [
            { label: 'Tickets', href: '/admin/support' },
            { label: 'Questions', href: '/admin/questions' },
        ]
    },
    { label: 'Settings', href: '/admin/settings', icon: <IconSettings /> },
];

// ==================== Sidebar Navigation Item ====================
function SidebarNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const isActive = item.href ? pathname === item.href :
        item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + '/'));

    useEffect(() => {
        if (item.children && isActive) setOpen(true);
    }, [item.children, isActive]);

    if (item.children) {
        return (
            <div>
                <button
                    onClick={() => setOpen(!open)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                    <span className={isActive ? 'text-indigo-600' : 'text-gray-400'}>{item.icon}</span>
                    {!collapsed && (
                        <>
                            <span className="flex-1 text-left">{item.label}</span>
                            <IconChevron open={open} />
                        </>
                    )}
                </button>
                {!collapsed && open && (
                    <div className="ml-8 mt-1 space-y-1">
                        {item.children.map(child => {
                            const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
                            return (
                                <Link
                                    key={child.href}
                                    href={child.href}
                                    className={`block px-3 py-2 rounded-md text-sm transition-colors
                                        ${childActive ? 'text-indigo-700 bg-indigo-50 font-medium' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                                >
                                    {child.label}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.href!}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
        >
            <span className={isActive ? 'text-indigo-600' : 'text-gray-400'}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
        </Link>
    );
}

// ==================== Sidebar ====================
function AdminSidebar({ collapsed, onToggle, mobileOpen, onMobileClose, onLogout }: {
    collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onMobileClose: () => void; onLogout: () => void;
}) {
    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onMobileClose} />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300 flex flex-col
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${collapsed ? 'w-20' : 'w-72'}`}>
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                    {!collapsed && (
                        <Link href="/admin" className="text-xl font-bold text-indigo-600">
                            E-Commerce Admin
                        </Link>
                    )}
                    <button onClick={onToggle} className="p-2 rounded-lg hover:bg-gray-100 hidden lg:block">
                        <IconMenu />
                    </button>
                    <button onClick={onMobileClose} className="p-2 rounded-lg hover:bg-gray-100 lg:hidden">
                        <IconClose />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
                    {navItems.map(item => (
                        <SidebarNavItem key={item.label} item={item} collapsed={collapsed} />
                    ))}
                </nav>

                {/* Bottom actions */}
                <div className="p-4 border-t border-gray-200">
                    <button onClick={onLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                        <IconLogout />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}

// ==================== Top Header ====================
function AdminHeader({ onMenuClick, collapsed }: { onMenuClick: () => void; collapsed: boolean }) {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const handleLogout = useCallback(() => {
        logout();
        router.push('/auth/login');
    }, [logout, router]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-dropdown]')) {
                setNotificationOpen(false);
                setProfileOpen(false);
            }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    return (
        <header className={`fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-200 transition-all duration-300
            ${collapsed ? 'left-20' : 'left-72'} max-lg:left-0`}>
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                {/* Left: Mobile menu + Search */}
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-gray-100 lg:hidden">
                        <IconMenu />
                    </button>
                    <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-80">
                        <IconSearch />
                        <input
                            type="text"
                            placeholder="Search anything..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full"
                        />
                    </div>
                </div>

                {/* Right: Notifications + Profile */}
                <div className="flex items-center gap-3">
                    {/* Notification bell */}
                    <div className="relative" data-dropdown>
                        <button
                            onClick={() => setNotificationOpen(!notificationOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 relative"
                        >
                            <IconNotification />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>
                        {notificationOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                                <div className="p-4 border-b border-gray-200">
                                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer">
                                            <p className="text-sm text-gray-900">New order #{1000 + i} received</p>
                                            <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 text-center">
                                    <Link href="/admin/notifications" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                        View all notifications
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile dropdown */}
                    <div className="relative" data-dropdown>
                        <button
                            onClick={() => setProfileOpen(!profileOpen)}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100"
                        >
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {user?.firstName?.charAt(0) || 'A'}
                                </span>
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-gray-900">{user?.firstName || 'Admin'} {user?.lastName || ''}</p>
                                <p className="text-xs text-gray-500">Administrator</p>
                            </div>
                        </button>
                        {profileOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                                <div className="py-2">
                                    <Link href="/admin/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                        My Profile
                                    </Link>
                                    <Link href="/admin/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                        Settings
                                    </Link>
                                    <Link href="/admin/activity-log" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                        Activity Log
                                    </Link>
                                    <hr className="my-2" />
                                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

// ==================== Main Admin Layout ====================
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();

    useEffect(() => {
        setHydrated(true);
    }, []);

    const handleLogout = useCallback(() => {
        logout();
        router.push('/auth/login');
    }, [logout, router]);

    // Redirects etc could be here
    useEffect(() => {
        if (!hydrated) return;
        if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, user, router, hydrated]);

    if (!hydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
                onLogout={handleLogout}
            />
            <AdminHeader
                onMenuClick={() => setMobileOpen(true)}
                collapsed={sidebarCollapsed}
            />
            <main className={`pt-16 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
                <div className="p-4 lg:p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
