'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Layers, Search } from 'lucide-react';
import { collectionService } from '@/services';
import { getImageUrl } from '@/lib/utils';

interface CollectionItem {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount?: number;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const data = await collectionService.getAll();
        setCollections(Array.isArray(data) ? data : ((data as any)?.content ?? []));
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCollections();
  }, []);

  const filtered = collections.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container-custom py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Bộ Sưu Tập</span>
      </nav>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Bộ Sưu Tập
          </h1>
          <p className="text-muted-foreground mt-1">
            Khám phá {collections.length} bộ sưu tập được tuyển chọn
          </p>
        </div>
        <div className="relative w-64 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm bộ sưu tập..."
            className="input-field pl-9 h-9 text-sm rounded-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Layers className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? 'Không tìm thấy bộ sưu tập phù hợp' : 'Chưa có bộ sưu tập nào'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((collection) => (
            <Link
              key={collection.id}
              href={`/products?collection=${collection.slug}`}
              className="card overflow-hidden group hover:shadow-lg transition-all"
            >
              <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden">
                {collection.image ? (
                  <img
                    src={getImageUrl(collection.image)}
                    alt={collection.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Layers className="w-12 h-12 text-primary/30" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {collection.description}
                  </p>
                )}
                {collection.productCount != null && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {collection.productCount} sản phẩm
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
