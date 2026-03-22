'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  Tag,
  Truck,
  Shield,
  X,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { cn, formatCurrency, getImageUrl, getDiscountPercentage } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, isLoading, fetchCart, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon } =
    useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (cart?.items) {
      setSelectedItems(new Set(cart.items.map((item) => item.id)));
    }
  }, [cart?.items]);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(itemId, newQuantity);
    } catch {
      toast.error('Không thể cập nhật số lượng');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
      toast.success('Đã xóa sản phẩm');
      setSelectedItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    } catch {
      toast.error('Không thể xóa sản phẩm');
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) return;
    try {
      await clearCart();
      toast.success('Đã xóa giỏ hàng');
    } catch {
      toast.error('Không thể xóa giỏ hàng');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setIsApplyingCoupon(true);
      await applyCoupon(couponCode.trim());
      toast.success('Đã áp dụng mã giảm giá!');
      setCouponCode('');
    } catch {
      toast.error('Mã giảm giá không hợp lệ hoặc đã hết hạn');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
      toast.success('Đã xóa mã giảm giá');
    } catch {
      toast.error('Không thể xóa mã giảm giá');
    }
  };

  const toggleSelectAll = () => {
    if (!cart?.items) return;
    if (selectedItems.size === cart.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cart.items.map((item) => item.id)));
    }
  };

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const selectedSubtotal =
    cart?.items
      ?.filter((item) => selectedItems.has(item.id))
      .reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  const selectedCount = selectedItems.size;

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Giỏ hàng trống</h2>
        <p className="text-muted-foreground mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
        <Link href="/products">
          <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>Tiếp tục mua sắm</Button>
        </Link>
      </div>
    );
  }

  // Group items by shop
  const shopGroups: Record<string, typeof cart.items> = {};
  cart.items.forEach((item) => {
    const shopId = item.shopId || 'unknown';
    if (!shopGroups[shopId]) shopGroups[shopId] = [];
    shopGroups[shopId].push(item);
  });

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Giỏ hàng ({cart.items.length})</h1>
        <Button variant="ghost" onClick={handleClearCart} className="text-destructive">
          <Trash2 className="w-4 h-4 mr-1" />
          Xóa tất cả
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Select All */}
          <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedItems.size === cart.items.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-sm font-medium">
              Chọn tất cả ({cart.items.length} sản phẩm)
            </span>
          </div>

          {/* Shop Groups */}
          {Object.entries(shopGroups).map(([shopId, items]) => (
            <div key={shopId} className="bg-card border rounded-xl overflow-hidden">
              {/* Shop Header */}
              <div className="border-b p-4 bg-muted/20">
                <Link
                  href={`/shop/${items[0].shopSlug}`}
                  className="inline-flex items-center gap-2 font-medium text-sm hover:text-primary"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {items[0].shopName}
                </Link>
              </div>

              {/* Items */}
              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.id} className="p-4 flex gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-4 h-4 rounded accent-primary mt-4 shrink-0"
                    />
                    <Link href={`/products/${item.productSlug}`} className="shrink-0">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={getImageUrl(item.productImage)}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="text-sm font-medium hover:text-primary line-clamp-2"
                      >
                        {item.productName}
                      </Link>
                      {item.variantName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Phân loại: {item.variantName}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-destructive">
                          {formatCurrency(item.price)}
                        </span>
                        {item.compareAtPrice && (
                          <span className="text-xs text-muted-foreground line-through ml-2">
                            {formatCurrency(item.compareAtPrice)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-md">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-accent transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-10 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-accent transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          {/* Coupon */}
          <div className="bg-card border rounded-xl p-4">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Mã giảm giá
            </h3>
            {cart.couponCode ? (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    {cart.couponCode}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Giảm {formatCurrency(cart.discount || 0)}
                  </p>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Nhập mã giảm giá"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleApplyCoupon}
                  isLoading={isApplyingCoupon}
                  disabled={!couponCode.trim()}
                >
                  Áp dụng
                </Button>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-card border rounded-xl p-4 sticky top-4">
            <h3 className="font-medium mb-4">Tổng đơn hàng</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính ({selectedCount} sản phẩm)</span>
                <span>{formatCurrency(selectedSubtotal)}</span>
              </div>
              {cart.couponCode && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(cart.discount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span className="text-green-600">Miễn phí</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-destructive">
                  {formatCurrency(
                    selectedSubtotal - (cart.discount || 0)
                  )}
                </span>
              </div>
            </div>
            <Link href="/checkout">
              <Button className="w-full mt-4" size="lg" disabled={selectedCount === 0}>
                Tiến hành thanh toán ({selectedCount})
              </Button>
            </Link>
            <Link
              href="/products"
              className="block text-center text-sm text-muted-foreground hover:text-primary mt-3"
            >
              <ArrowLeft className="w-3 h-3 inline mr-1" />
              Tiếp tục mua sắm
            </Link>
          </div>

          {/* Benefits */}
          <div className="bg-card border rounded-xl p-4 space-y-3">
            {[
              { icon: Truck, text: 'Miễn phí vận chuyển đơn từ 300.000₫' },
              { icon: Shield, text: 'Bảo đảm hàng chính hãng 100%' },
              { icon: Tag, text: 'Đổi trả miễn phí trong 30 ngày' },
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <benefit.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
