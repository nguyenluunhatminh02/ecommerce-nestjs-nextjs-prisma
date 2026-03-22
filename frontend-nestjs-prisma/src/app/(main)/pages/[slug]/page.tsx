'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, FileText } from 'lucide-react';
import { cmsService } from '@/services';

export default function CmsPageDetail() {
  const params = useParams();
  const slug = params.slug as string;
  const [page, setPage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchPage = async () => {
      try {
        const data = await cmsService.getPageBySlug(slug);
        setPage(data);
      } catch (error) {
        console.error('Failed to fetch CMS page:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-10 w-64 bg-muted/50 rounded animate-pulse" />
          <div className="h-6 w-full bg-muted/50 rounded animate-pulse" />
          <div className="h-6 w-3/4 bg-muted/50 rounded animate-pulse" />
          <div className="h-6 w-5/6 bg-muted/50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="container-custom py-8 text-center">
        <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Không tìm thấy trang</h1>
        <Link href="/pages" className="text-primary hover:underline">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/pages" className="hover:text-primary">Trang thông tin</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">{page.title}</span>
      </nav>

      <article className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
    </div>
  );
}
