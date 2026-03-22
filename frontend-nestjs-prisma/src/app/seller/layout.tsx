'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Star,
  Settings,
  Store,
  ChevronRight,
  Menu,
  X,
  LogOut,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

const sellerMenuItems = [
  { label: 'Dashboard', href: '/seller/dashboard', icon: LayoutDashboard },
  { label: 'Sản phẩm', href: '/seller/products', icon: Package },
  { label: 'Đơn hàng', href: '/seller/orders', icon: ShoppingBag },
  { label: 'Đánh giá', href: '/seller/reviews', icon: Star },
  { label: 'Thống kê', href: '/seller/analytics', icon: BarChart3 },
  { label: 'Cài đặt shop', href: '/seller/settings', icon: Settings },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/seller/dashboard" className="flex items-center gap-2">
              <Store className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">Seller Center</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Về trang chủ
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <span className="text-sm font-medium hidden sm:block">{user?.fullName}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          'fixed lg:sticky top-14 left-0 z-30 h-[calc(100vh-3.5rem)] w-64 bg-white dark:bg-gray-800 border-r border-border transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <nav className="p-4 space-y-1">
            {sellerMenuItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-3.5rem)] p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
