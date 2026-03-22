'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Award, Search } from 'lucide-react';
import { brandService } from '@/services';
import { BrandResponse } from '@/types';
import { getImageUrl } from '@/lib/utils';

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await brandService.getAll();
        setBrands(Array.isArray(data) ? data : ((data as any)?.content ?? []));
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const filtered = brands.filter((b) =>
    b.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container-custom py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Thương hiệu</span>
      </nav>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Thương Hiệu
          </h1>
          <p className="text-muted-foreground mt-1">{brands.length} thương hiệu</p>
        </div>
        <div className="relative w-64 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm thương hiệu..."
            className="input-field pl-9 h-9 text-sm rounded-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? 'Không tìm thấy thương hiệu phù hợp' : 'Chưa có thương hiệu nào'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((brand) => (
            <Link
              key={brand.id}
              href={`/products?brand=${brand.slug}`}
              className="card p-4 flex flex-col items-center text-center group hover:shadow-md transition-all"
            >
              <div className="w-16 h-16 rounded-full bg-muted/50 overflow-hidden mb-3 flex items-center justify-center">
                {brand.logoUrl ? (
                  <img
                    src={getImageUrl(brand.logoUrl)}
                    alt={brand.name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <Award className="w-8 h-8 text-muted-foreground/40" />
                )}
              </div>
              <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                {brand.name}
              </h3>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
