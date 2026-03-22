'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Truck, Shield, Headphones, RefreshCw, Zap, TrendingUp, Tag, Clock, Sparkles } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { ProductGridSkeleton, BannerSkeleton } from '@/components/ui/Skeleton';
import { productService, categoryService, bannerService, flashSaleService, recommendationService } from '@/services';
import { ProductResponse, CategoryResponse, BannerResponse, FlashSaleResponse } from '@/types';
import { formatCurrency } from '@/lib/utils';

function useFlashSaleCountdown(flashSale: FlashSaleResponse | null) {
  const [remaining, setRemaining] = useState<number>(flashSale?.remainingTimeSeconds ?? 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!flashSale || flashSale.status !== 'ACTIVE') {
      setRemaining(0);
      return;
    }
    setRemaining(flashSale.remainingTimeSeconds);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [flashSale]);

  const hours = String(Math.floor(remaining / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<ProductResponse[]>([]);
  const [newArrivals, setNewArrivals] = useState<ProductResponse[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductResponse[]>([]);
  const [deals, setDeals] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [activeFlashSale, setActiveFlashSale] = useState<FlashSaleResponse | null>(null);
  const [trendingProducts, setTrendingProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const flashSaleCountdown = useFlashSaleCountdown(activeFlashSale);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, newRes, bestRes, dealsRes, catsRes] = await Promise.all([
          productService.getFeaturedProducts(0, 12),
          productService.getNewArrivals(0, 12),
          productService.getBestSellers(0, 12),
          productService.getDeals(0, 8),
          categoryService.getFeatured(),
        ]);
        setFeaturedProducts(featuredRes.content);
        setNewArrivals(newRes.content);
        setBestSellers(bestRes.content);
        setDeals(dealsRes.content);
        setCategories(catsRes);

        try {
          const bannersRes = await bannerService.getActiveBanners();
          setBanners(bannersRes);
        } catch {
          // Banner API might fail, not critical
        }

        try {
          const trendingRes = await recommendationService.getTrending(12);
          if (trendingRes?.enrichedProducts) {
            setTrendingProducts(trendingRes.enrichedProducts);
          }
        } catch {
          // ML recommendations not critical
        }

        try {
          const flashSales = await flashSaleService.getActiveFlashSales();
          if (flashSales.length > 0) setActiveFlashSale(flashSales[0]);
        } catch {
          // Flash sale API not critical
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative">
        <div className="container-custom py-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main banner */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <BannerSkeleton />
              ) : (
                <div className="relative aspect-[3/1] rounded-xl overflow-hidden bg-gradient-to-r from-primary to-blue-600">
                  {banners[0] ? (
                    <Link href={banners[0].linkUrl || '#'}>
                      <img
                        src={banners[0].imageUrl}
                        alt={banners[0].title}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center h-full px-8 text-primary-foreground">
                      <div>
                        <p className="text-sm font-medium mb-2 opacity-80">KHUYẾN MÃI KHỦNG</p>
                        <h2 className="text-2xl md:text-4xl font-bold mb-3">
                          Giảm đến 50% toàn bộ sản phẩm
                        </h2>
                        <p className="text-sm md:text-base opacity-80 mb-4">
                          Áp dụng cho đơn hàng đầu tiên. Miễn phí vận chuyển toàn quốc.
                        </p>
                        <Link
                          href="/products?sale=true"
                          className="inline-flex items-center gap-2 bg-white text-primary px-6 py-2.5 rounded-full font-medium hover:bg-white/90 transition-colors"
                        >
                          Mua ngay
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Side banners */}
            <div className="hidden lg:flex flex-col gap-4">
              <div className="flex-1 rounded-xl overflow-hidden bg-gradient-to-br from-orange-400 to-pink-500 p-4 text-white flex flex-col justify-end">
                <p className="text-xs font-medium opacity-80">MỚI</p>
                <h3 className="font-bold text-sm">Bộ sưu tập Xuân Hè 2024</h3>
                <Link href="/products?collection=spring-summer" className="text-xs mt-1 underline">
                  Khám phá ngay
                </Link>
              </div>
              <div className="flex-1 rounded-xl overflow-hidden bg-gradient-to-br from-green-400 to-teal-500 p-4 text-white flex flex-col justify-end">
                <p className="text-xs font-medium opacity-80">HOT DEAL</p>
                <h3 className="font-bold text-sm">Flash Sale mỗi ngày</h3>
                <Link href="/products?flash-sale=true" className="text-xs mt-1 underline">
                  Xem ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y bg-muted/20">
        <div className="container-custom py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, title: 'Miễn phí vận chuyển', desc: 'Đơn hàng từ 300K' },
              { icon: Shield, title: 'Bảo đảm chất lượng', desc: '100% hàng chính hãng' },
              { icon: Headphones, title: 'Hỗ trợ 24/7', desc: 'Tư vấn tận tâm' },
              { icon: RefreshCw, title: 'Đổi trả dễ dàng', desc: 'Trong vòng 30 ngày' },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-custom py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Danh Mục Nổi Bật
          </h2>
          <Link
            href="/categories"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Xem tất cả <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {(categories.length > 0 ? categories.slice(0, 16) : Array.from({ length: 8 })).map(
            (cat, idx) => (
              <Link
                key={idx}
                href={cat ? `/products?category=${(cat as CategoryResponse).slug}` : '#'}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-accent transition-colors group"
              >
                <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  {(cat as CategoryResponse)?.imageUrl ? (
                    <img
                      src={(cat as CategoryResponse).imageUrl!}
                      alt={(cat as CategoryResponse).name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-primary/10" />
                  )}
                </div>
                <span className="text-xs text-center font-medium line-clamp-2">
                  {(cat as CategoryResponse)?.name || 'Đang tải...'}
                </span>
              </Link>
            )
          )}
        </div>
      </section>

      {/* Flash Deals */}
      {deals.length > 0 && (
        <section className="bg-gradient-to-r from-red-500 to-orange-500 py-8">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Flash Sale
              </h2>
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Kết thúc trong: {flashSaleCountdown}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {deals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="container-custom py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Sản Phẩm Nổi Bật
          </h2>
          <Link
            href="/products?featured=true"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Xem tất cả <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {isLoading ? (
          <ProductGridSkeleton count={12} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* AI Trending Products */}
      {trendingProducts.length > 0 && (
        <section className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 py-8">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Xu Hướng Mua Sắm
                <span className="text-xs font-normal bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">AI</span>
              </h2>
              <Link
                href="/products?sort=trending"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mid Banner */}
      <section className="container-custom pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-violet-500 to-purple-500 p-8 text-white h-48 flex items-center">
            <div>
              <p className="text-xs font-medium opacity-80 mb-1">ĐẶC BIỆT</p>
              <h3 className="text-xl font-bold mb-2">Giảm 30% Thời Trang</h3>
              <p className="text-sm opacity-80 mb-3">Bộ sưu tập mới nhất</p>
              <Link
                href="/products?category=thoi-trang"
                className="inline-flex items-center gap-1 text-sm font-medium bg-white/20 px-4 py-1.5 rounded-full hover:bg-white/30 transition-colors"
              >
                Mua ngay <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-amber-500 to-orange-400 p-8 text-white h-48 flex items-center">
            <div>
              <p className="text-xs font-medium opacity-80 mb-1">MỚI VỀ</p>
              <h3 className="text-xl font-bold mb-2">Điện tử & Công nghệ</h3>
              <p className="text-sm opacity-80 mb-3">Công nghệ mới nhất tại đây</p>
              <Link
                href="/products?category=dien-tu"
                className="inline-flex items-center gap-1 text-sm font-medium bg-white/20 px-4 py-1.5 rounded-full hover:bg-white/30 transition-colors"
              >
                Khám phá <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="bg-muted/20 py-8">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Sản Phẩm Mới</h2>
            <Link
              href="/products?sort=newest"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {isLoading ? (
            <ProductGridSkeleton count={12} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="container-custom py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Bán Chạy Nhất</h2>
          <Link
            href="/products?sort=best-selling"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Xem tất cả <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {isLoading ? (
          <ProductGridSkeleton count={12} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Trust Section */}
      <section className="bg-muted/30 py-12 border-t">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold mb-2">Tin tưởng bởi hàng triệu người dùng</h2>
          <p className="text-muted-foreground mb-8">
            Hơn 1 triệu sản phẩm, 10,000+ người bán, 5 triệu khách hàng tin dùng
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '1M+', label: 'Sản phẩm' },
              { value: '10K+', label: 'Người bán' },
              { value: '5M+', label: 'Khách hàng' },
              { value: '99%', label: 'Hài lòng' },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
