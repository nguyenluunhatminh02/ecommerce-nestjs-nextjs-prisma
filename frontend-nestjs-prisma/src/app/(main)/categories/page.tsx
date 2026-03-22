'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tag, ChevronRight, Search } from 'lucide-react';
import { categoryService } from '@/services';
import { CategoryResponse } from '@/types';
import { getImageUrl } from '@/lib/utils';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getRootCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container-custom py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">
          Trang chủ
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Danh mục sản phẩm</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="w-6 h-6 text-primary" />
            Tất Cả Danh Mục
          </h1>
          <p className="text-muted-foreground mt-1">
            Khám phá {categories.length} danh mục sản phẩm
          </p>
        </div>
        <div className="relative w-64 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm danh mục..."
            className="input-field pl-9 h-9 text-sm rounded-full"
          />
        </div>
      </div>

      {/* Categories grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div key={idx} className="animate-pulse">
              <div className="aspect-square rounded-xl bg-muted mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredCategories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group flex flex-col items-center p-6 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                {category.imageUrl ? (
                  <img
                    src={getImageUrl(category.imageUrl)}
                    alt={category.name}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <Tag className="w-8 h-8 text-primary/60" />
                )}
              </div>
              <h3 className="text-sm font-semibold text-center group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <span className="text-xs text-muted-foreground mt-1">
                {category.productCount} sản phẩm
              </span>

              {/* Subcategories */}
              {category.children && category.children.length > 0 && (
                <div className="mt-3 pt-3 border-t w-full">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {category.children.slice(0, 3).map((child) => (
                      <span
                        key={child.id}
                        className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                      >
                        {child.name}
                      </span>
                    ))}
                    {category.children.length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 text-primary">
                        +{category.children.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-lg font-semibold mb-2">Không tìm thấy danh mục</h3>
          <p className="text-muted-foreground">
            Thử tìm kiếm với từ khóa khác
          </p>
        </div>
      )}
    </div>
  );
}
