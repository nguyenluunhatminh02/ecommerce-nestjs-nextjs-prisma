'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  MapPin,
  Package,
  Heart,
  Settings,
  Bell,
  Shield,
  Store,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

const accountLinks = [
  { href: '/account', label: 'Thông tin cá nhân', icon: User },
  { href: '/account/addresses', label: 'Sổ địa chỉ', icon: MapPin },
  { href: '/orders', label: 'Đơn hàng', icon: Package },
  { href: '/wishlist', label: 'Yêu thích', icon: Heart },
  { href: '/notifications', label: 'Thông báo', icon: Bell },
  { href: '/account/security', label: 'Bảo mật', icon: Shield },
  { href: '/account/settings', label: 'Cài đặt', icon: Settings },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <div className="container-custom py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card border rounded-xl overflow-hidden sticky top-4">
            {/* User Info */}
            <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex items-center gap-3">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{user?.fullName || 'Người dùng'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="py-2">
              {accountLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                      isActive
                        ? 'bg-primary/5 text-primary font-medium border-l-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </Link>
                );
              })}

              {/* Seller */}
              {user?.role === 'SELLER' && (
                <Link
                  href="/seller/dashboard"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <Store className="w-4 h-4" />
                  Kênh người bán
                  <ChevronRight className="w-3 h-3 ml-auto" />
                </Link>
              )}

              <button
                onClick={() => logout()}
                className="flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-accent w-full"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  );
}
