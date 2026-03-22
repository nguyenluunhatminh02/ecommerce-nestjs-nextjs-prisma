'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import { ProductResponse } from '@/types';
import { cn, formatCurrency, getDiscountPercentage, getImageUrl } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { wishlistService } from '@/services';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: ProductResponse;
  className?: string;
  variant?: 'default' | 'horizontal' | 'compact';
}

export default function ProductCard({ product, className, variant = 'default' }: ProductCardProps) {
  const { addToCart } = useCartStore();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const discount = product.compareAtPrice
    ? getDiscountPercentage(product.price, product.compareAtPrice)
    : 0;

  const primaryImage = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsAddingToCart(true);
      await addToCart(product.id, 1);
      toast.success('Đã thêm vào giỏ hàng');
    } catch {
      toast.error('Không thể thêm vào giỏ hàng');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const result = await wishlistService.toggleWishlist(product.id);
      setIsWishlisted(result);
      toast.success(result ? 'Đã thêm vào yêu thích' : 'Đã xóa khỏi yêu thích');
    } catch {
      toast.error('Vui lòng đăng nhập');
    }
  };

  if (variant === 'horizontal') {
    return (
      <Link
        href={`/products/${product.slug}`}
        className={cn('group flex gap-4 p-4 rounded-lg border hover:shadow-md transition-all', className)}
      >
        <div className="relative w-32 h-32 shrink-0 rounded-lg overflow-hidden bg-muted">
          <img
            src={getImageUrl(primaryImage)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded">
              -{discount}%
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1">{product.shop?.name}</p>
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">
              {product.averageRating.toFixed(1)} ({product.totalReviews})
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold text-destructive">{formatCurrency(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Đã bán {product.totalSold}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group relative flex flex-col rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-all duration-300',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={getImageUrl(primaryImage)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && (
            <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded">
              -{discount}%
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
              Nổi bật
            </span>
          )}
        </div>

        {/* Quick actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleToggleWishlist}
            className={cn(
              'w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform',
              isWishlisted && 'text-red-500'
            )}
          >
            <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
          </button>
          <button className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform">
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Add to cart overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || product.quantity === 0}
            className="w-full btn-primary text-xs py-2 gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {product.quantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col">
        {/* Shop */}
        <p className="text-[11px] text-muted-foreground mb-1 truncate">{product.shop?.name}</p>

        {/* Name */}
        <h3 className="text-sm font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[40px]">
          {product.name}
        </h3>

        {/* Rating & Sold */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{product.averageRating.toFixed(1)}</span>
          </div>
          <span>Đã bán {product.totalSold}</span>
        </div>

        {/* Price */}
        <div className="mt-auto">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-destructive">
              {formatCurrency(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
