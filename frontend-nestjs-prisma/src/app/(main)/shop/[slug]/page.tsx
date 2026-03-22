'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Store,
  Star,
  Users,
  Package,
  MessageCircle,
  ChevronRight,
  Check,
  Heart,
  Grid3X3,
  SlidersHorizontal,
} from 'lucide-react';
import { ShopResponse, ProductResponse, PageResponse } from '@/types';
import { shopService, productService } from '@/services';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import ProductCard from '@/components/product/ProductCard';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';
import { Skeleton, ProductGridSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function ShopPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [shop, setShop] = useState<ShopResponse | null>(null);
  const [products, setProducts] = useState<PageResponse<ProductResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [activeTab, setActiveTab] = useState<'products' | 'about'>('products');

  useEffect(() => {
    const fetchShop = async () => {
      try {
        setIsLoading(true);
        const shopData = await shopService.getBySlug(slug);
        setShop(shopData);
        setIsFollowing(shopData.isFollowing ?? false);
      } catch {
        console.error('Failed to fetch shop');
      } finally {
        setIsLoading(false);
      }
    };
    if (slug) fetchShop();
  }, [slug]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!shop) return;
      try {
        const data = await productService.getProducts({
          shopId: shop.id,
          page,
          size: 20,
          sortBy,
        });
        setProducts(data);
      } catch {
        console.error('Failed to fetch products');
      }
    };
    fetchProducts();
  }, [shop, page, sortBy]);

  const handleFollow = async () => {
    if (!shop) return;
    try {
      await shopService.followShop(shop.id);
      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? 'Đã bỏ theo dõi' : 'Đã theo dõi shop');
    } catch {
      toast.error('Vui lòng đăng nhập');
    }
  };

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <Skeleton className="h-48 rounded-xl mb-6" />
        <ProductGridSkeleton count={12} />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container-custom py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Shop không tồn tại</h2>
        <Link href="/products">
          <Button>Quay lại mua sắm</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      {/* Shop Banner */}
      <div className="bg-card border rounded-2xl overflow-hidden mb-8">
        {shop.bannerUrl && (
          <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/5 relative">
            <img src={shop.bannerUrl} alt={shop.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              {shop.logoUrl ? (
                <img
                  src={shop.logoUrl}
                  alt={shop.name}
                  className="w-20 h-20 rounded-full border-4 border-background object-cover -mt-12 relative z-10"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center -mt-12 relative z-10 border-4 border-background">
                  <Store className="w-8 h-8 text-primary" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{shop.name}</h1>
                  {shop.verified && (
                    <Check className="w-5 h-5 text-blue-500 bg-blue-100 rounded-full p-0.5" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{shop.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isFollowing ? 'outline' : 'primary'}
                onClick={handleFollow}
                leftIcon={<Heart className={cn('w-4 h-4', isFollowing && 'fill-current text-red-500')} />}
              >
                {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
              </Button>
              <Link href={`/chat?shop=${shop.id}`}>
                <Button variant="outline" leftIcon={<MessageCircle className="w-4 h-4" />}>
                  Chat
                </Button>
              </Link>
            </div>
          </div>

          {/* Shop Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            {[
              { label: 'Sản phẩm', value: formatNumber((shop.productCount ?? (shop as any).totalProducts) ?? 0) },
              { label: 'Người theo dõi', value: formatNumber(shop.followerCount ?? 0) },
              { label: 'Đánh giá', value: `${(shop.averageRating ?? (shop as any).rating)?.toFixed(1) || '0'}/5` },
              { label: 'Tham gia', value: shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('vi-VN') : '' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-lg font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b mb-6">
        {[
          { key: 'products', label: 'Sản phẩm' },
          { key: 'about', label: 'Giới thiệu' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={cn(
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (
        <>
          {/* Sort */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-muted-foreground">
              {products?.totalElements || 0} sản phẩm
            </span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(0);
              }}
              className="input-field w-auto text-sm"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá thấp đến cao</option>
              <option value="price_desc">Giá cao đến thấp</option>
              <option value="best_selling">Bán chạy</option>
              <option value="rating">Đánh giá cao</option>
            </select>
          </div>

          {/* Products Grid */}
          {products?.content && products.content.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.content.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Shop chưa có sản phẩm nào</p>
            </div>
          )}

          {products && products.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={page + 1}
                totalPages={products.totalPages}
                onPageChange={(p) => setPage(p - 1)}
              />
            </div>
          )}
        </>
      )}

      {activeTab === 'about' && (
        <div className="bg-card border rounded-xl p-6 max-w-2xl">
          <h3 className="font-bold mb-4">Giới thiệu về {shop.name}</h3>
          <div className="prose prose-sm dark:prose-invert">
            <p>{shop.description || 'Shop chưa có mô tả.'}</p>
          </div>
          {shop.address && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Địa chỉ:</strong> {shop.address}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
