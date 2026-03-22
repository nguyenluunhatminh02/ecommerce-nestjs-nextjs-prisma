'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, Calendar, User, Search } from 'lucide-react';
import { blogService } from '@/services';
import { BlogPostResponse, BlogCategoryResponse } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateTime } from '@/lib/utils';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPostResponse[]>([]);
  const [categories, setCategories] = useState<BlogCategoryResponse[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchPosts = useCallback(async (keyword: string, categoryId: string | null, currentPage: number) => {
    try {
      setIsLoading(true);
      let data;
      if (keyword.trim()) {
        data = await blogService.searchPosts(keyword.trim(), currentPage, 12);
      } else if (categoryId) {
        data = await blogService.getPostsByCategory(categoryId, currentPage, 12);
      } else {
        data = await blogService.getPosts(currentPage, 12);
      }
      setPosts(data.content.filter((p: BlogPostResponse, i: number, arr: BlogPostResponse[]) => arr.findIndex(x => x.id === p.id) === i));
      setTotalPages(data.totalPages);
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    blogService.getCategories().then(cats => {
      const unique = cats.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
      setCategories(unique);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchPosts(searchQuery, selectedCategoryId, page);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedCategoryId, page, fetchPosts]);

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const formatPostDate = (post: BlogPostResponse) => {
    const date = post.publishedAt || post.createdAt;
    return formatDateTime(date).split(' ')[0];
  };

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3">Blog ShopVN</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Khám phá những bài viết mới nhất về xu hướng mua sắm, đánh giá sản phẩm và mẹo hay cho cuộc sống
        </p>
      </div>

      {/* Search */}
      <div className="max-w-xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-border rounded-xl bg-background"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <button
          onClick={() => handleCategoryChange(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            selectedCategoryId === null
              ? 'bg-primary text-white'
              : 'bg-muted hover:bg-muted/80 text-foreground'
          }`}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedCategoryId === cat.id
                ? 'bg-primary text-white'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
          >
            {cat.name}
            {cat.postCount > 0 && (
              <span className="ml-1 opacity-60">({cat.postCount})</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="w-full h-[400px] rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          {/* Featured Post */}
          {posts.length > 0 && (
            <div className="mb-10">
              <Link href={`/blog/${posts[0].slug}`} className="block relative rounded-2xl overflow-hidden group cursor-pointer">
                <div className="relative aspect-[3/1] bg-gradient-to-r from-primary to-blue-600">
                  {posts[0].featuredImage && (
                    <img
                      src={posts[0].featuredImage}
                      alt={posts[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  {posts[0].category && (
                    <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-medium rounded-full mb-3">
                      {posts[0].category.name}
                    </span>
                  )}
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    {posts[0].title}
                  </h2>
                  {posts[0].excerpt && (
                    <p className="text-white/80 mb-3 max-w-2xl">{posts[0].excerpt}</p>
                  )}
                  <div className="flex items-center gap-4 text-white/60 text-sm">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {posts[0].authorName}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatPostDate(posts[0])}</span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.slice(1).map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <article className="bg-card border rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow h-full">
                  <div className="relative overflow-hidden">
                    <div className="w-full h-48 bg-muted">
                      {post.featuredImage && (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                    {post.category && (
                      <span className="absolute top-3 left-3 px-2 py-1 bg-primary text-white text-xs font-medium rounded-full">
                        {post.category.name}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.authorName}</span>
                        <span>{formatPostDate(post)}</span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Không tìm thấy bài viết nào</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-4 py-2 text-sm">Trang {page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

