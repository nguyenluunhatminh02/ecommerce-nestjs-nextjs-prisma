'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  ShoppingCart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Star,
  Minus,
  Plus,
  ChevronRight,
  ChevronLeft,
  Store,
  MessageCircle,
  Check,
} from 'lucide-react';
import { ProductResponse, ReviewResponse, RatingDistribution, PageResponse } from '@/types';
import { productService, reviewService, wishlistService, recommendationService } from '@/services';
import { useCartStore } from '@/store/cart-store';
import { cn, formatCurrency, getDiscountPercentage, getImageUrl, timeAgo } from '@/lib/utils';
import ProductCard from '@/components/product/ProductCard';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addToCart } = useCartStore();

  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [reviews, setReviews] = useState<PageResponse<ReviewResponse> | null>(null);
  const [ratingDist, setRatingDist] = useState<RatingDistribution[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<ProductResponse[]>([]);
  const [similarProducts, setSimilarProducts] = useState<ProductResponse[]>([]);
  const [frequentlyBought, setFrequentlyBought] = useState<ProductResponse[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const data = await productService.getProductBySlug(slug);
        setProduct(data);

        // Fetch related data
        const [reviewsData, ratingData] = await Promise.all([
          reviewService.getProductReviews(data.id, 0, 5),
          reviewService.getRatingDistribution(data.id),
        ]);
        setReviews(reviewsData);
        setRatingDist(ratingData);

        // Fetch related products
        if (data.category) {
          const related = await productService.getProducts({
            categoryId: data.category.id,
            size: 6,
          });
          setRelatedProducts(related.content.filter((p) => p.id !== data.id));
        }

        // Check wishlist status
        try {
          const inWishlist = await wishlistService.checkInWishlist(data.id);
          setIsWishlisted(inWishlist);
        } catch {
          // Not logged in or error - ignore
        }

        // Track view for ML recommendations
        try {
          await recommendationService.trackView(data.id);
        } catch {
          // Not logged in or tracking failed - ignore
        }

        // Fetch ML-powered similar products
        try {
          const [similarRes, freqRes] = await Promise.all([
            recommendationService.getSimilar(data.id, 6),
            recommendationService.getFrequentlyBought(data.id),
          ]);
          if (similarRes?.enrichedProducts?.length) {
            setSimilarProducts(similarRes.enrichedProducts);
          }
          if (freqRes?.enrichedProducts?.length) {
            setFrequentlyBought(freqRes.enrichedProducts);
          }
        } catch {
          // ML recommendations not critical
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      setIsAddingToCart(true);
      await addToCart(product.id, quantity, selectedVariant || undefined);
      toast.success('Đã thêm vào giỏ hàng!');
    } catch {
      toast.error('Không thể thêm vào giỏ hàng');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    try {
      await wishlistService.toggleWishlist(product.id);
      const newState = !isWishlisted;
      setIsWishlisted(newState);
      toast.success(newState ? 'Đã thêm vào yêu thích' : 'Đã xóa khỏi yêu thích');
    } catch {
      toast.error('Vui lòng đăng nhập');
    }
  };

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-custom py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Sản phẩm không tồn tại</h2>
        <Link href="/products" className="btn-primary">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  const discount = product.compareAtPrice
    ? getDiscountPercentage(product.price, product.compareAtPrice)
    : 0;

  const selectedVariantData = product.variants?.find((v) => v.id === selectedVariant);
  const currentPrice = selectedVariantData?.price || product.price;
  const currentComparePrice = selectedVariantData?.compareAtPrice || product.compareAtPrice;
  const isInStock = (selectedVariantData?.quantity || product.quantity) > 0;

  return (
    <div className="container-custom py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">
          Trang chủ
        </Link>
        <ChevronRight className="w-4 h-4" />
        {product.category && (
          <>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-primary"
            >
              {product.category.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
        <span className="text-foreground line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-4 group">
            <img
              src={getImageUrl(product.images?.[selectedImage]?.url)}
              alt={product.name}
              className="w-full h-full object-contain"
            />
            {discount > 0 && (
              <Badge variant="destructive" className="absolute top-4 left-4 text-sm">
                -{discount}%
              </Badge>
            )}
            {/* Carousel arrows */}
            {product.images && product.images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage(selectedImage === 0 ? product.images.length - 1 : selectedImage - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-black/50 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black/70"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedImage(selectedImage === product.images.length - 1 ? 0 : selectedImage + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-black/50 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black/70"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                {/* Image counter */}
                <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                  {selectedImage + 1} / {product.images.length}
                </div>
              </>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-thin">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    'w-20 h-20 rounded-lg border-2 overflow-hidden shrink-0 transition-colors',
                    idx === selectedImage ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
                  )}
                >
                  <img
                    src={getImageUrl(img.url)}
                    alt={img.altText || product.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {/* Shop */}
          <Link
            href={`/shop/${product.shop?.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-2"
          >
            <Store className="w-4 h-4" />
            {product.shop?.name}
            {product.shop?.isVerified && <Check className="w-3.5 h-3.5 text-blue-500" />}
          </Link>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-3">{product.name}</h1>

          {/* Rating & Sold */}
          <div className="flex items-center gap-4 mb-4">
            <StarRating rating={product.averageRating} showValue count={product.totalReviews} />
            <span className="text-sm text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">Đã bán {product.totalSold}</span>
            <span className="text-sm text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">{product.viewCount} lượt xem</span>
          </div>

          {/* Price */}
          <div className="bg-muted/30 p-4 rounded-xl mb-6">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-destructive">
                {formatCurrency(currentPrice)}
              </span>
              {currentComparePrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatCurrency(currentComparePrice)}
                  </span>
                  <Badge variant="destructive">-{discount}%</Badge>
                </>
              )}
            </div>
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Phân loại</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant.id)}
                    className={cn(
                      'px-4 py-2 border rounded-lg text-sm transition-all',
                      selectedVariant === variant.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'hover:border-primary/50',
                      variant.quantity === 0 && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={variant.quantity === 0}
                  >
                    {variant.name}
                    {variant.quantity === 0 && ' (Hết hàng)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Số lượng</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-accent transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-accent transition-colors"
                  disabled={quantity >= product.quantity}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-muted-foreground">{product.quantity} sản phẩm có sẵn</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <Button
              onClick={handleAddToCart}
              isLoading={isAddingToCart}
              disabled={!isInStock}
              leftIcon={<ShoppingCart className="w-4 h-4" />}
              className="flex-1"
              size="lg"
            >
              {isInStock ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleToggleWishlist}
              className={cn(isWishlisted && 'text-red-500 border-red-200')}
            >
              <Heart className={cn('w-5 h-5', isWishlisted && 'fill-current')} />
            </Button>
            <Button variant="outline" size="lg">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Truck, title: 'Miễn phí ship', desc: 'Đơn từ 300K' },
              { icon: Shield, title: 'Chính hãng', desc: '100% bảo đảm' },
              { icon: RotateCcw, title: 'Đổi trả', desc: '30 ngày' },
            ].map((feat, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-3 bg-muted/30 rounded-lg">
                <feat.icon className="w-5 h-5 text-primary mb-1" />
                <span className="text-xs font-medium">{feat.title}</span>
                <span className="text-[10px] text-muted-foreground">{feat.desc}</span>
              </div>
            ))}
          </div>

          {/* Shop info card */}
          <div className="border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {product.shop?.logoUrl ? (
                <img
                  src={product.shop.logoUrl}
                  alt={product.shop.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Store className="w-6 h-6 text-primary" />
                </div>
              )}
              <div>
                <p className="font-medium text-sm">{product.shop?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.shop?.totalProducts} sản phẩm
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/chat?shop=${product.shop?.id}`} className="btn-outline text-xs">
                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                Chat
              </Link>
              <Link href={`/shop/${product.shop?.slug}`} className="btn-outline text-xs">
                Xem shop
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="border-b flex gap-0">
          {[
            { key: 'description', label: 'Mô tả sản phẩm' },
            { key: 'reviews', label: `Đánh giá (${product.totalReviews})` },
            { key: 'shipping', label: 'Vận chuyển' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === 'description' && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
              {product.attributeValues && product.attributeValues.length > 0 && (
                <div className="mt-6">
                  <h3>Thông số kỹ thuật</h3>
                  <table className="w-full">
                    <tbody>
                      {product.attributeValues.map((attr) => (
                        <tr key={attr.attributeId} className="border-b">
                          <td className="py-2 pr-4 font-medium text-muted-foreground w-1/3">
                            {attr.attributeName}
                          </td>
                          <td className="py-2">{attr.displayValue || attr.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {/* Rating summary */}
              <div className="flex items-start gap-8 mb-8 p-6 bg-muted/20 rounded-xl">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary">
                    {product.averageRating.toFixed(1)}
                  </div>
                  <StarRating rating={product.averageRating} size="lg" className="justify-center mt-2" />
                  <p className="text-sm text-muted-foreground mt-1">{product.totalReviews} đánh giá</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const dist = ratingDist.find((d) => d.rating === star);
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-sm w-8">{star} ★</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${dist?.percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {dist?.count || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews list */}
              <div className="space-y-6">
                {reviews?.content.map((review) => (
                  <div key={review.id} className="border-b pb-6">
                    <div className="flex items-start gap-3">
                      {review.userAvatar ? (
                        <img
                          src={review.userAvatar}
                          alt={review.userName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {review.userName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{review.userName}</span>
                          {review.verified && (
                            <Badge variant="success" size="sm">
                              Đã mua hàng
                            </Badge>
                          )}
                        </div>
                        <StarRating rating={review.rating} size="sm" className="mt-1" />
                        <p className="text-sm mt-2">{review.comment}</p>
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {review.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt="Review"
                                className="w-16 h-16 rounded-md object-cover"
                              />
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>{timeAgo(review.createdAt)}</span>
                          <button className="hover:text-primary">Hữu ích ({review.helpful})</button>
                        </div>
                        {review.reply && (
                          <div className="mt-3 bg-muted/30 p-3 rounded-lg">
                            <p className="text-xs font-medium text-primary mb-1">
                              Phản hồi của Shop
                            </p>
                            <p className="text-sm">{review.reply.message}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-4 max-w-2xl">
              <div className="flex gap-3 p-4 border rounded-lg">
                <Truck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Giao hàng tiêu chuẩn</h4>
                  <p className="text-sm text-muted-foreground">3-5 ngày làm việc</p>
                  <p className="text-sm text-muted-foreground">
                    {!product.requiresShipping ? 'Miễn phí' : 'Phí vận chuyển tính theo khu vực'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-4 border rounded-lg">
                <RotateCcw className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Chính sách đổi trả</h4>
                  <p className="text-sm text-muted-foreground">
                    Đổi trả miễn phí trong vòng 30 ngày kể từ ngày nhận hàng
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Similar Products */}
      {similarProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            Sản phẩm tương tự
            <span className="text-xs font-normal bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full">AI</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Frequently Bought Together */}
      {frequentlyBought.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            Thường mua cùng nhau
            <span className="text-xs font-normal bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-2 py-0.5 rounded-full">AI</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {frequentlyBought.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-6">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
