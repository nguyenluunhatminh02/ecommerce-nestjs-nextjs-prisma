'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Eye, Tag } from 'lucide-react';
import { blogService } from '@/services';
import { BlogPostResponse } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateTime } from '@/lib/utils';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPostResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const data = await blogService.getPostBySlug(slug);
        setPost(data);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    if (slug) fetchPost();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="container-custom py-8 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-5 w-64 mb-6" />
        <Skeleton className="h-64 w-full mb-6 rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="container-custom py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Bài viết không tồn tại</h2>
        <Link href="/blog" className="text-primary hover:underline">← Quay lại Blog</Link>
      </div>
    );
  }

  const thumbnailUrl = (post as any).thumbnailUrl ?? post.featuredImage;
  const authorName = (post as any).author?.fullName ?? post.authorName ?? 'Admin';

  return (
    <div className="container-custom py-8 max-w-3xl mx-auto">
      {/* Back button */}
      <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Quay lại Blog
      </Link>

      {/* Category badge */}
      {post.category && (
        <div className="mb-4">
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
            {post.category.name}
          </span>
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
        <span className="flex items-center gap-1">
          <User className="w-4 h-4" />
          {authorName}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatDateTime(post.publishedAt ?? post.createdAt)}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          {post.viewCount?.toLocaleString() ?? 0} lượt xem
        </span>
      </div>

      {/* Thumbnail */}
      {thumbnailUrl && (
        <div className="rounded-xl overflow-hidden mb-8">
          <img src={thumbnailUrl} alt={post.title} className="w-full h-64 object-cover" />
        </div>
      )}

      {/* Excerpt */}
      {post.excerpt && (
        <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4 mb-8">{post.excerpt}</p>
      )}

      {/* Content */}
      <article
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Tags */}
      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <div className="mt-8 pt-6 border-t flex flex-wrap gap-2">
          <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
          {post.tags.map((tag) => (
            <span key={tag} className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Back to blog */}
      <div className="mt-10 pt-6 border-t">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Xem tất cả bài viết
        </Link>
      </div>
    </div>
  );
}
