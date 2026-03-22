'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, FileText } from 'lucide-react';
import { cmsService } from '@/services';

export default function CmsPages() {
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const data = await cmsService.getPages();
        setPages(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch CMS pages:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPages();
  }, []);

  return (
    <div className="container-custom py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Trang thông tin</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileText className="w-6 h-6 text-primary" />
        Trang Thông Tin
      </h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">Chưa có trang nào</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pages.map((page: any) => (
            <Link
              key={page.id}
              href={`/pages/${page.slug}`}
              className="card p-5 hover:shadow-md transition-shadow group"
            >
              <h3 className="font-semibold group-hover:text-primary transition-colors">{page.title}</h3>
              {page.excerpt && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{page.excerpt}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
