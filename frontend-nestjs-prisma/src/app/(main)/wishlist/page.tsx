'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, Star } from 'lucide-react';
import { WishlistItemResponse, PageResponse } from '@/types';
import { wishlistService } from '@/services';
import { useCartStore } from '@/store/cart-store';
import { formatCurrency, getImageUrl, getDiscountPercentage } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCartStore();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setIsLoading(true);
      const data = await wishlistService.getWishlist();
      setItems(data.content || []);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await wishlistService.toggleWishlist(productId);
      setItems(items.filter((item) => item.productId !== productId));
      toast.success('Đã xóa khỏi yêu thích');
    } catch {
      toast.error('Không thể xóa');
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId, 1);
      toast.success('Đã thêm vào giỏ hàng');
    } catch {
      toast.error('Không thể thêm vào giỏ hàng');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Xóa toàn bộ danh sách yêu thích?')) return;
    try {
      await wishlistService.clearWishlist();
      setItems([]);
      toast.success('Đã xóa toàn bộ');
    } catch {
      toast.error('Không thể xóa');
    }
  };

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500 fill-current" />
          Yêu thích ({items.length})
        </h1>
        {items.length > 0 && (
          <Button variant="ghost" onClick={handleClearAll} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-1" />
            Xóa tất cả
          </Button>
        )}
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
            <Heart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Chưa có sản phẩm yêu thích</h2>
          <p className="text-muted-foreground mb-6">
            Thêm sản phẩm vào danh sách yêu thích để theo dõi và mua sau
          </p>
          <Link href="/products">
            <Button>Khám phá sản phẩm</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative">
              <Link href={`/products/${item.productSlug}`}>
                <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all">
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    <img
                      src={getImageUrl(item.productImage)}
                      alt={item.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {item.compareAtPrice && item.compareAtPrice > item.price && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        -{getDiscountPercentage(item.price, item.compareAtPrice)}%
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium line-clamp-2 mb-1">{item.productName}</h3>
                    {item.averageRating != null && item.averageRating > 0 && (
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">
                          {item.averageRating.toFixed(1)}
                          {item.totalReviews != null && ` (${item.totalReviews})`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{formatCurrency(item.price)}</span>
                      {item.compareAtPrice && item.compareAtPrice > item.price && (
                        <span className="text-xs line-through text-muted-foreground">
                          {formatCurrency(item.compareAtPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
              <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(item.productId);
                  }}
                  className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Xóa khỏi yêu thích"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart(item.productId);
                  }}
                  className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-primary/10 transition-colors"
                  title="Thêm vào giỏ hàng"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
