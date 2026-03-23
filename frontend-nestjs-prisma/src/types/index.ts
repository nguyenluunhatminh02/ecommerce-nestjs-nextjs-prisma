// ==================== Auth Types ====================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

// ==================== User Types ====================
export type Role = 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'FACEBOOK' | 'GITHUB';

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  role: Role;
  provider: AuthProvider;
  emailVerified: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ==================== Address Types ====================
export interface AddressResponse {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  ward: string | null;
  district: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

export interface AddressRequest {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  ward?: string;
  district?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  isDefault?: boolean;
}

// ==================== Category Types ====================
export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  parentName: string | null;
  productCount: number;
  featured: boolean;
  position: number;
  children: CategoryResponse[];
}

export interface CategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  featured?: boolean;
  position?: number;
}

// ==================== Brand Types ====================
export interface BrandResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  productCount: number;
}

// ==================== Product Types ====================
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  currency: string;
  quantity: number;
  lowStockThreshold: number;
  weight: number | null;
  weightUnit: string | null;
  status: ProductStatus;
  isFeatured: boolean;
  isDigital: boolean;
  requiresShipping: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  averageRating: number;
  totalReviews: number;
  totalSold: number;
  viewCount: number;
  discountPercentage: number | null;
  category: CategoryResponse | null;
  brand: BrandResponse | null;
  shop: ShopSummaryResponse;
  images: ProductImageResponse[];
  variants: ProductVariantResponse[];
  attributeValues: ProductAttributeValueResponse[] | null;
  tags: TagResponse[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShopSummaryResponse {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  averageRating: number;
  totalProducts: number;
  isVerified: boolean;
}

export interface ProductImageResponse {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariantResponse {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  imageUrl: string | null;
  isActive: boolean;
  options: VariantOptionResponse[];
}

export interface VariantOptionResponse {
  optionName: string;
  optionValue: string;
}

export interface ProductAttributeValueResponse {
  attributeId: string;
  attributeName: string;
  value: string;
  displayValue: string | null;
  colorCode: string | null;
}

export interface TagResponse {
  id: string;
  name: string;
  slug: string;
}

export interface ProductFilterParams {
  keyword?: string;
  categoryId?: string;
  brandId?: string;
  shopId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  status?: ProductStatus;
  isFeatured?: boolean;
  inStock?: boolean;
  sort?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  quantity: number;
  lowStockThreshold?: number;
  weight?: number;
  categoryId?: string;
  brandId?: string;
  featured?: boolean;
  freeShipping?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  images?: { imageUrl: string; altText?: string; position?: number; isPrimary?: boolean }[];
  tags?: string[];
}

// ==================== Shop Types ====================
export interface ShopResponse {
  id: string;
  userId?: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  totalReviews?: number;
  verified: boolean;
  active: boolean;
  productCount: number;
  followerCount: number;
  averageRating: number;
  totalRevenue: number;
  ownerId: string;
  ownerName: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  totalFollowers?: number;
  isFollowing?: boolean;
  commissionRate?: number;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  returnPolicy?: string | null;
  shippingPolicy?: string | null;
  createdAt: string;
}

export interface CreateShopRequest {
  name: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
}

// ==================== Cart Types ====================
export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  totalItems: number;
  subtotal: number;
  discount: number;
  shippingFee?: number;
  total: number;
  couponCode: string | null;
  note?: string | null;
}

export interface CartItemResponse {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  imageUrl?: string | null;
  variantId: string | null;
  variantName: string | null;
  shopId: string;
  shopName: string;
  shopSlug: string;
  price: number;
  compareAtPrice?: number | null;
  quantity: number;
  subtotal: number;
  maxQuantity: number;
  selected?: boolean;
  inStock?: boolean;
  note?: string | null;
}

export interface AddToCartRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

// ==================== Order Types ====================
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_APPROVED'
  | 'REFUNDED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'FAILED';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'STRIPE' | 'COD' | 'BANK_TRANSFER' | 'MOMO' | 'VNPAY';
export type ShippingStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RETURNED';

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  couponCode: string | null;
  note: string | null;
  shippingAddress: ShippingAddressResponse;
  items: OrderItemResponse[];
  statusHistory: OrderStatusHistoryResponse[];
  shipment: ShipmentResponse | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
}

export interface ShippingAddressResponse {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  district: string | null;
  city: string;
  province: string;
  country: string;
  postalCode: string;
}

export type Product = ProductResponse;
export type Order = OrderResponse;
export type User = UserResponse;
export type Category = CategoryResponse;
export type Brand = BrandResponse;
export type Shop = ShopResponse;
export type Review = ReviewResponse;
export type Coupon = CouponResponse;

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  productSlug: string | null;
  productSku: string | null;
  productImage: string | null;
  variantName: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  isReviewed: boolean;
}

export interface OrderStatusHistoryResponse {
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface CreateOrderRequest {
  shippingAddressId: string;
  paymentMethod: PaymentMethod;
  note?: string;
  couponCode?: string;
  items?: { productId: string; variantId?: string; quantity: number }[];
}

// ==================== Payment Types ====================
export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

// ==================== Shipment Types ====================
export interface ShipmentResponse {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status: ShippingStatus;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  shippedAt: string | null;
  createdAt: string;
}

// ==================== Review Types ====================
export interface ReviewResponse {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  productId: string;
  productName: string;
  rating: number;
  title: string | null;
  comment: string;
  images: string[];
  helpful: number;
  verified: boolean;
  approved: boolean;
  reply: ReviewReplyResponse | null;
  createdAt: string;
}

export interface ReviewReplyResponse {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

export interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

// ==================== Wishlist Types ====================
export interface WishlistItemResponse {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  price: number;
  compareAtPrice: number | null;
  averageRating: number | null;
  totalReviews: number | null;
  status: string | null;
  addedAt: string;
}

// ==================== Coupon Types ====================
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface CouponResponse {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: string;
  endDate: string;
  active: boolean;
  shopId: string | null;
}

export interface CouponValidationResponse {
  valid: boolean;
  discount: number;
  message: string;
}

// ==================== Notification Types ====================
export type NotificationType =
  | 'ORDER_PLACED'
  | 'ORDER_STATUS_CHANGED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'NEW_REVIEW'
  | 'REVIEW_REPLY'
  | 'PRICE_DROP'
  | 'BACK_IN_STOCK'
  | 'PROMOTION'
  | 'SYSTEM';

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  imageUrl: string | null;
  linkUrl: string | null;
  read: boolean;
  createdAt: string;
}

// ==================== Chat Types ====================
export interface ChatRoomResponse {
  id: string;
  participant1Id: string;
  participant1Name: string;
  participant1Avatar: string | null;
  participant2Id: string;
  participant2Name: string;
  participant2Avatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ChatMessageResponse {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  imageUrl: string | null;
  read: boolean;
  createdAt: string;
}

// ==================== Blog Types ====================
export interface BlogPostResponse {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  authorId: string;
  authorName: string;
  category: BlogCategoryResponse | null;
  tags: string[];
  published: boolean;
  featured: boolean;
  viewCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  postCount: number;
}

// ==================== Support Ticket Types ====================
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_REPLY' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface SupportTicketResponse {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  userId: string;
  userName: string;
  assignedToId: string | null;
  assignedToName: string | null;
  orderId: string | null;
  orderNumber: string | null;
  messages: TicketMessageResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessageResponse {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  isStaff: boolean;
  message: string;
  attachments: string[];
  createdAt: string;
}

// ==================== Dashboard Types ====================
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalShops: number;
  pendingOrders: number;
  revenueGrowth: number;
  orderGrowth: number;
  userGrowth: number;
  recentOrders: OrderResponse[];
  topProducts: ProductResponse[];
  revenueChart: ChartDataPoint[];
  ordersChart: ChartDataPoint[];
  categoryDistribution: PieChartDataPoint[];
}

export interface SellerDashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalReviews: number;
  averageRating: number;
  pendingOrders: number;
  revenueGrowth: number;
  orderGrowth: number;
  recentOrders: OrderResponse[];
  topProducts: ProductResponse[];
  revenueChart: ChartDataPoint[];
  ordersChart: ChartDataPoint[];
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface PieChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

// ==================== Banner Types ====================
export interface BannerResponse {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  position: number;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
}

// ==================== Flash Sale Types ====================
export interface FlashSaleItemResponse {
  id: number;
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  totalQuantity: number;
  soldQuantity: number;
  remainingQuantity: number;
  maxPerCustomer: number;
  soldPercentage: number;
  isAvailable: boolean;
}

export interface FlashSaleResponse {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  bannerUrl: string | null;
  startTime: string;
  endTime: string;
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  isActive: boolean;
  totalProducts: number;
  totalSold: number;
  totalRevenue: number;
  remainingTimeSeconds: number;
  items: FlashSaleItemResponse[];
  createdAt: string;
  updatedAt: string;
}

// ==================== Shipping Types ====================
export interface ShippingMethodResponse {
  id: number;
  name: string;
  code: string;
  description: string | null;
  carrier: string | null;
  type: string | null;
  baseRate: number;
  freeShippingThreshold: number | null;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  estimatedDelivery: string | null;
  maxWeight: number | null;
  isActive: boolean;
  trackingAvailable: boolean;
  sortOrder: number;
}

// ==================== Generic Types ====================
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface SelectOption {
  label: string;
  value: string;
}
