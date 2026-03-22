'use client';

import { useEffect, useState } from 'react';
import { Star, MessageCircle, ThumbsUp, Search } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { getImageUrl } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  title: string;
  comment: string;
  helpful: number;
  reply: string | null;
  createdAt: string;
  productId: string;
  productName: string;
  productImage: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  images: { imageUrl: string; isPrimary: boolean }[];
  averageRating: number;
  totalReviews: number;
}

export default function SellerReviewsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const shopRes = await apiClient.get('/shops/my-shop');
        if (!shopRes.data.data) return;
        const sid = shopRes.data.data.id;
        setShopId(sid);

        const prodRes = await apiClient.get(`/products/filter?shopId=${sid}&size=100`);
        const prods = prodRes.data.data.content || [];
        setProducts(prods);

        if (prods.length > 0) {
          setSelectedProduct(prods[0].id);
        }
      } catch (err) {
        console.error('Failed to init:', err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedProduct) {
      setIsLoading(false);
      return;
    }
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get(`/reviews/product/${selectedProduct}?page=${page}&size=20`);
        const data = res.data.data;
        setReviews(data.content || []);
        setTotalReviews(data.totalElements || 0);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, [selectedProduct, page]);

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      setSubmitting(true);
      await apiClient.post(`/reviews/${reviewId}/reply?reply=${encodeURIComponent(replyText.trim())}`);
      setReviews(prev => prev.map(r =>
        r.id === reviewId ? { ...r, reply: replyText.trim() } : r
      ));
      setReplyingTo(null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to reply:', err);
      alert('Không thể gửi phản hồi');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProd = products.find(p => p.id === selectedProduct);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Đánh giá sản phẩm</h1>
        <p className="text-muted-foreground">Quản lý và phản hồi đánh giá từ khách hàng</p>
      </div>

      {/* Product selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
        <label className="text-sm font-medium mb-2 block">Chọn sản phẩm</label>
        <select
          value={selectedProduct}
          onChange={(e) => { setSelectedProduct(e.target.value); setPage(0); }}
          className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-foreground"
        >
          <option value="">-- Chọn sản phẩm --</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.totalReviews} đánh giá · ★ {p.averageRating?.toFixed(1) || '0.0'})
            </option>
          ))}
        </select>
      </div>

      {/* Stats for selected product */}
      {selectedProd && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-4 text-center">
            <Star className="w-6 h-6 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold">{selectedProd.averageRating?.toFixed(1) || '0.0'}</p>
            <p className="text-xs text-muted-foreground">Điểm trung bình</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-4 text-center">
            <MessageCircle className="w-6 h-6 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{totalReviews}</p>
            <p className="text-xs text-muted-foreground">Tổng đánh giá</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-4 text-center">
            <ThumbsUp className="w-6 h-6 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">
              {reviews.filter(r => r.rating >= 4).length}
            </p>
            <p className="text-xs text-muted-foreground">Đánh giá tốt (4-5★)</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-4 text-center">
            <MessageCircle className="w-6 h-6 mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold">
              {reviews.filter(r => r.reply).length}
            </p>
            <p className="text-xs text-muted-foreground">Đã phản hồi</p>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
              <Skeleton className="h-20 w-full" />
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-12 text-center">
            <Star className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {selectedProduct ? 'Chưa có đánh giá nào' : 'Chọn sản phẩm để xem đánh giá'}
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
              <div className="flex items-start gap-3">
                <img
                  src={getImageUrl(review.userAvatar)}
                  alt={review.userName}
                  className="w-10 h-10 rounded-full object-cover bg-muted"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{review.userName}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  {review.title && (
                    <p className="font-medium text-sm mb-1">{review.title}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{review.comment}</p>

                  {review.helpful > 0 && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> {review.helpful} người thấy hữu ích
                    </p>
                  )}

                  {/* Seller reply */}
                  {review.reply && (
                    <div className="mt-3 bg-muted/50 rounded-lg p-3 border-l-2 border-primary">
                      <p className="text-xs font-medium text-primary mb-1">Phản hồi từ shop</p>
                      <p className="text-sm">{review.reply}</p>
                    </div>
                  )}

                  {/* Reply form */}
                  {!review.reply && (
                    <>
                      {replyingTo === review.id ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Viết phản hồi cho khách hàng..."
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background min-h-[80px] resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReply(review.id)}
                              disabled={submitting || !replyText.trim()}
                              className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                              {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                            </button>
                            <button
                              onClick={() => { setReplyingTo(null); setReplyText(''); }}
                              className="px-4 py-1.5 border border-border rounded-lg text-sm"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(review.id)}
                          className="mt-2 text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Phản hồi
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Simple pagination */}
      {totalReviews > 20 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 border border-border rounded-lg text-sm disabled:opacity-50"
          >
            Trang trước
          </button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            Trang {page + 1}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={reviews.length < 20}
            className="px-4 py-2 border border-border rounded-lg text-sm disabled:opacity-50"
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}
