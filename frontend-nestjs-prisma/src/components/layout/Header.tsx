'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Bell,
  Menu,
  X,
  ChevronDown,
  MessageCircle,
  Package,
  Settings,
  LogOut,
  Store,
  LayoutDashboard,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { cn, getInitials } from '@/lib/utils';
import { categoryService } from '@/services';
import { CategoryResponse } from '@/types';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await categoryService.getRootCategories();
        setCategories(cats);
      } catch {
        // Fallback if API fails
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        isScrolled
          ? 'bg-background/95 backdrop-blur-md shadow-sm border-b'
          : 'bg-background border-b'
      )}
    >
      {/* Top bar */}
      <div className="hidden lg:block bg-primary/5 border-b">
        <div className="container-custom flex items-center justify-between py-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link href="/seller/dashboard" className="hover:text-primary transition-colors">
              Kênh người bán
            </Link>
            <Link href="/blog" className="hover:text-primary transition-colors">
              Blog
            </Link>
            <Link href="/support" className="hover:text-primary transition-colors">
              Hỗ trợ
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span>Miễn phí vận chuyển đơn từ 300K</span>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1 hover:text-primary transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 hover:bg-accent rounded-md"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient hidden sm:block">ShopVN</span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:flex">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                className="input-field pr-12 h-10 rounded-full bg-muted/50"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Notifications */}
            {isAuthenticated && (
              <Link
                href="/notifications"
                className="relative p-2 hover:bg-accent rounded-full transition-colors hidden sm:flex"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  3
                </span>
              </Link>
            )}

            {/* Messages */}
            {isAuthenticated && (
              <Link
                href="/chat"
                className="relative p-2 hover:bg-accent rounded-full transition-colors hidden sm:flex"
              >
                <MessageCircle className="w-5 h-5" />
              </Link>
            )}

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative p-2 hover:bg-accent rounded-full transition-colors hidden sm:flex"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 hover:bg-accent rounded-full transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 hover:bg-accent rounded-full transition-colors"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center">
                      {getInitials(user?.fullName || 'U')}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 hidden sm:block" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card border rounded-lg shadow-lg py-2 z-50 animate-fade-in">
                    <div className="px-4 py-3 border-b">
                      <p className="font-semibold text-sm">{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/account"
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Tài khoản của tôi
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Package className="w-4 h-4" />
                        Đơn hàng
                      </Link>
                      <Link
                        href="/wishlist"
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Heart className="w-4 h-4" />
                        Yêu thích
                      </Link>
                      {(user?.role === 'SELLER' || user?.role === 'ADMIN') && (
                        <Link
                          href="/seller/dashboard"
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Store className="w-4 h-4" />
                          Kênh bán hàng
                        </Link>
                      )}
                      {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Quản trị
                        </Link>
                      )}
                      <Link
                        href="/account/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Cài đặt
                      </Link>
                    </div>
                    <div className="border-t pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="btn-ghost text-sm hidden sm:flex">
                  Đăng nhập
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="input-field pr-10 rounded-full bg-muted/50"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
            </button>
          </form>
        </div>
      </div>

      {/* Category navigation */}
      <nav className="hidden lg:block border-t">
        <div className="container-custom">
          <ul className="flex items-center gap-1 overflow-x-auto scrollbar-thin py-0">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/products?category=${cat.slug}`}
                  className="inline-flex items-center px-3 py-2.5 text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/categories"
                className="inline-flex items-center gap-1 px-3 py-2.5 text-sm text-primary font-medium whitespace-nowrap"
              >
                Tất cả danh mục
                <ChevronDown className="w-3.5 h-3.5" />
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[64px] z-50 bg-background/95 backdrop-blur-md overflow-y-auto animate-fade-in">
          <nav className="container-custom py-4">
            <div className="space-y-1">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="block px-4 py-3 text-sm hover:bg-accent rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 space-y-1">
              <Link
                href="/blog"
                className="block px-4 py-3 text-sm hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                href="/support"
                className="block px-4 py-3 text-sm hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Hỗ trợ khách hàng
              </Link>
              <Link
                href="/seller/dashboard"
                className="block px-4 py-3 text-sm hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Trở thành người bán
              </Link>
            </div>
            {!isAuthenticated && (
              <div className="border-t mt-4 pt-4 flex gap-3 px-4">
                <Link
                  href="/auth/login"
                  className="btn-outline flex-1 text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-primary flex-1 text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
