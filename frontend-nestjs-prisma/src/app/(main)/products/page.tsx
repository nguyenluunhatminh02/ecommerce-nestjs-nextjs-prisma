'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, Grid3X3, List, X, ChevronDown } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import Pagination from '@/components/ui/Pagination';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import { productService, categoryService, brandService } from '@/services';
import { ProductResponse, CategoryResponse, BrandResponse, PageResponse } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import { buildProductQueryParams } from '@/lib/product-query';

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<PageResponse<ProductResponse> | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter states
  const keyword = searchParams.get('keyword') || '';
  const categorySlug = searchParams.get('category') || '';
  const brandId = searchParams.get('brand') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const rating = searchParams.get('rating') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortDir = searchParams.get('sortDir') || 'desc';
  const page = parseInt(searchParams.get('page') || '0');

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Resolve category slug to UUID if needed
      let resolvedCategoryId: string | undefined;
      if (categorySlug) {
        try {
          const cat = await categoryService.getBySlug(categorySlug);
          resolvedCategoryId = cat.id;
        } catch {
          // Category not found by slug, ignore
        }
      }

      const data = await productService.getProducts(
        buildProductQueryParams(
          {
            keyword,
            brandId,
            minPrice,
            maxPrice,
            rating,
            sortBy,
            sortDir,
            page,
          },
          resolvedCategoryId
        )
      );
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [keyword, categorySlug, brandId, minPrice, maxPrice, rating, sortBy, sortDir, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const [cats, brs] = await Promise.all([
          categoryService.getRootCategories(),
          brandService.getAll(),
        ]);
        setCategories(cats);
        setBrands(brs);
      } catch {}
    };
    fetchFiltersData();
  }, []);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '0');
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/products');
  };

  const hasActiveFilters = keyword || categorySlug || brandId || minPrice || maxPrice || rating;

  const sortOptions = [
    { label: 'Mới nhất', value: 'createdAt-desc' },
    { label: 'Giá thấp đến cao', value: 'price-asc' },
    { label: 'Giá cao đến thấp', value: 'price-desc' },
    { label: 'Bán chạy nhất', value: 'totalSold-desc' },
    { label: 'Đánh giá cao', value: 'averageRating-desc' },
    { label: 'Phổ biến', value: 'viewCount-desc' },
  ];

  return (
    <div className="container-custom py-6">
      <div className="flex gap-6">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Bộ lọc</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-sm font-medium mb-3">Danh mục</h4>
              <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateFilter('category', cat.slug === categorySlug ? '' : cat.slug)}
                    className={cn(
                      'block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors',
                      cat.slug === categorySlug
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-accent'
                    )}
                  >
                    {cat.name}
                    <span className="text-muted-foreground text-xs ml-1">({cat.productCount})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div>
              <h4 className="text-sm font-medium mb-3">Thương hiệu</h4>
              <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                {brands.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => updateFilter('brand', brand.id === brandId ? '' : brand.id)}
                    className={cn(
                      'block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors',
                      brand.id === brandId
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-accent'
                    )}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="text-sm font-medium mb-3">Khoảng giá</h4>
              <div className="space-y-2">
                {[
                  { label: 'Dưới 100K', min: '', max: '100000' },
                  { label: '100K - 500K', min: '100000', max: '500000' },
                  { label: '500K - 1 triệu', min: '500000', max: '1000000' },
                  { label: '1 - 5 triệu', min: '1000000', max: '5000000' },
                  { label: 'Trên 5 triệu', min: '5000000', max: '' },
                ].map((range) => (
                  <button
                    key={range.label}
                    onClick={() => {
                      updateFilter('minPrice', range.min);
                      setTimeout(() => updateFilter('maxPrice', range.max), 0);
                    }}
                    className={cn(
                      'block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors',
                      minPrice === range.min && maxPrice === range.max
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-accent'
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <h4 className="text-sm font-medium mb-3">Đánh giá</h4>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((r) => (
                  <button
                    key={r}
                    onClick={() => updateFilter('rating', String(r) === rating ? '' : String(r))}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-md transition-colors',
                      String(r) === rating
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-accent'
                    )}
                  >
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < r ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">trở lên</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden btn-outline text-sm gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Lọc
              </button>

              {keyword && (
                <div className="text-sm text-muted-foreground">
                  Kết quả cho &ldquo;<span className="font-medium text-foreground">{keyword}</span>&rdquo;
                  {products && ` (${products.totalElements} sản phẩm)`}
                </div>
              )}

              {!keyword && products && (
                <div className="text-sm text-muted-foreground">
                  {products.totalElements} sản phẩm
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [s, d] = e.target.value.split('-');
                  updateFilter('sortBy', s);
                  setTimeout(() => updateFilter('sortDir', d), 0);
                }}
                className="input-field h-9 text-sm w-44"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* View mode */}
              <div className="hidden md:flex items-center border rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn('p-2', viewMode === 'grid' && 'bg-accent')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn('p-2', viewMode === 'list' && 'bg-accent')}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active filters chips */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {keyword && (
                <span className="badge-base bg-primary/10 text-primary text-xs gap-1">
                  Từ khóa: {keyword}
                  <button onClick={() => updateFilter('keyword', '')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {categorySlug && (
                <span className="badge-base bg-primary/10 text-primary text-xs gap-1">
                  Danh mục: {categorySlug}
                  <button onClick={() => updateFilter('category', '')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {brandId && (
                <span className="badge-base bg-primary/10 text-primary text-xs gap-1">
                  Thương hiệu
                  <button onClick={() => updateFilter('brand', '')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-destructive hover:underline"
              >
                Xóa tất cả
              </button>
            </div>
          )}

          {/* Products */}
          {isLoading ? (
            <ProductGridSkeleton count={24} />
          ) : products && products.content.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {products.content.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {products.content.map((product) => (
                    <ProductCard key={product.id} product={product} variant="horizontal" />
                  ))}
                </div>
              )}

              <div className="mt-8">
                <Pagination
                  currentPage={products.page + 1}
                  totalPages={products.totalPages}
                  onPageChange={(p) => updateFilter('page', String(p - 1))}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">Không tìm thấy sản phẩm</h3>
              <p className="text-muted-foreground mb-4">
                Hãy thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc
              </p>
              <Button onClick={clearFilters} variant="outline">
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filters modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowFilters(false)} />
          <div className="fixed inset-y-0 left-0 w-80 bg-background shadow-xl overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
              <h3 className="font-semibold">Bộ lọc</h3>
              <button onClick={() => setShowFilters(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-6">
              {/* Categories */}
              <div>
                <h4 className="text-sm font-medium mb-3">Danh mục</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { updateFilter('category', cat.slug === categorySlug ? '' : cat.slug); setShowFilters(false); }}
                      className={cn(
                        'block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors',
                        cat.slug === categorySlug ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent'
                      )}
                    >
                      {cat.name}
                      <span className="text-muted-foreground text-xs ml-1">({cat.productCount})</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Brands */}
              <div>
                <h4 className="text-sm font-medium mb-3">Thương hiệu</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {brands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => { updateFilter('brand', brand.id === brandId ? '' : brand.id); setShowFilters(false); }}
                      className={cn(
                        'block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors',
                        brand.id === brandId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent'
                      )}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>
              {/* Price Range */}
              <div>
                <h4 className="text-sm font-medium mb-3">Khoảng giá</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Dưới 100K', min: '', max: '100000' },
                    { label: '100K - 500K', min: '100000', max: '500000' },
                    { label: '500K - 1 triệu', min: '500000', max: '1000000' },
                    { label: '1 - 5 triệu', min: '1000000', max: '5000000' },
                    { label: 'Trên 5 triệu', min: '5000000', max: '' },
                  ].map((range) => (
                    <button
                      key={range.label}
                      onClick={() => { updateFilter('minPrice', range.min); setTimeout(() => updateFilter('maxPrice', range.max), 0); setShowFilters(false); }}
                      className={cn(
                        'block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors',
                        minPrice === range.min && maxPrice === range.max ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Rating */}
              <div>
                <h4 className="text-sm font-medium mb-3">Đánh giá</h4>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => { updateFilter('rating', String(r) === rating ? '' : String(r)); setShowFilters(false); }}
                      className={cn(
                        'flex items-center gap-2 w-full px-3 py-1.5 text-sm rounded-md transition-colors',
                        String(r) === rating ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent'
                      )}
                    >
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < r ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">trở lên</span>
                    </button>
                  ))}
                </div>
              </div>
              {hasActiveFilters && (
                <Button onClick={() => { clearFilters(); setShowFilters(false); }} variant="outline" className="w-full">
                  Xóa tất cả bộ lọc
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container-custom py-6"><ProductGridSkeleton count={24} /></div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
