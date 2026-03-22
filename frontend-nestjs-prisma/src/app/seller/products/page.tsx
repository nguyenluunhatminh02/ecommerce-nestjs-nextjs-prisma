'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Plus, Search, Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { ProductResponse, PageResponse } from '@/types';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';

export default function SellerProductsPage() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await apiClient.get('/shops/my-shop');
        if (!res.data.data) return;
        setShopId(res.data.data.id);
      } catch (err) {
        console.error('Failed to fetch shop:', err);
      }
    };
    fetchShop();
  }, []);

  useEffect(() => {
    if (!shopId) return;
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          size: '12',
          shopId,
        });
        if (search) params.set('keyword', search);
        const res = await apiClient.get(`/products/filter?${params}`);
        const data = res.data.data;
        setProducts(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [shopId, page, search]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="success">Đang bán</Badge>;
      case 'DRAFT': return <Badge variant="default">Nháp</Badge>;
      case 'OUT_OF_STOCK': return <Badge variant="error">Hết hàng</Badge>;
      case 'INACTIVE': return <Badge variant="warning">Ngừng bán</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sản phẩm của tôi</h1>
          <p className="text-muted-foreground">{totalElements} sản phẩm</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Sản phẩm
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Giá
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Kho
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Đã bán
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Trạng thái
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Đánh giá
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <Skeleton className="h-12 w-full" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    Chưa có sản phẩm nào
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3">
                      <Link href={`/products/${product.slug}`} className="flex items-center gap-3">
                        <img
                          src={getImageUrl(product.images?.[0]?.url)}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover bg-muted"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[200px]">{product.name}</p>
                          <p className="text-xs text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-primary">{formatCurrency(product.price)}</p>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <p className="text-xs line-through text-muted-foreground">
                          {formatCurrency(product.compareAtPrice)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${
                        (product.quantity || 0) <= (product.lowStockThreshold || 5)
                          ? 'text-red-500'
                          : 'text-foreground'
                      }`}>
                        {product.quantity || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{product.totalSold || 0}</td>
                    <td className="px-4 py-3">{statusBadge(product.status || 'ACTIVE')}</td>
                    <td className="px-4 py-3 text-sm">
                      {product.averageRating ? (
                        <span>⭐ {Number(product.averageRating).toFixed(1)} ({product.totalReviews})</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={page + 1}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p - 1)}
        />
      )}
    </div>
  );
}
