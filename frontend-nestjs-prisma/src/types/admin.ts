// Extended types for admin dashboard & advanced features
import {
    Product, Order, User, Category, Brand, Shop, Review, Coupon
} from './index';

// ============ Dashboard Analytics Types ============
export interface DashboardMetrics {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    revenueGrowth: number;
    orderGrowth: number;
    customerGrowth: number;
    averageOrderValue: number;
    conversionRate: number;
    returningCustomerRate: number;
    cartAbandonmentRate: number;
}

export interface RevenueChart {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string;
        borderColor?: string;
    }[];
}

export interface TopProduct {
    id: number;
    name: string;
    image?: string;
    revenue: number;
    quantity: number;
    growth: number;
}

export interface TopCategory {
    id: number;
    name: string;
    revenue: number;
    orderCount: number;
    percentage: number;
}

export interface SalesFunnel {
    pageViews: number;
    productViews: number;
    addToCarts: number;
    checkouts: number;
    purchases: number;
    conversionRate: number;
}

export interface CustomerSegment {
    name: string;
    count: number;
    percentage: number;
    averageOrderValue: number;
    color: string;
}

export interface TrafficSource {
    source: string;
    visitors: number;
    percentage: number;
    conversionRate: number;
}

export interface Activity {
    id: number;
    type: 'ORDER' | 'USER' | 'PRODUCT' | 'REVIEW' | 'PAYMENT' | 'SYSTEM';
    description: string;
    userId?: number;
    userName?: string;
    timestamp: string;
    link?: string;
    icon?: string;
}

// ============ Flash Sale Types ============
export interface FlashSale {
    id: number;
    name: string;
    slug: string;
    description?: string;
    bannerImage?: string;
    startTime: string;
    endTime: string;
    status: 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
    items: FlashSaleItem[];
    createdAt: string;
}

export interface FlashSaleItem {
    id: number;
    productId: number;
    productName: string;
    productImage?: string;
    originalPrice: number;
    salePrice: number;
    discountPercent: number;
    quantity: number;
    soldCount: number;
    maxPerUser: number;
    remainingPercent: number;
}

export interface CreateFlashSaleRequest {
    name: string;
    description?: string;
    bannerImage?: string;
    startTime: string;
    endTime: string;
    items: {
        productId: number;
        salePrice: number;
        quantity: number;
        maxPerUser: number;
    }[];
}

// ============ Gift Card Types ============
export interface GiftCard {
    id: number;
    code: string;
    initialBalance: number;
    currentBalance: number;
    currency: string;
    status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'DISABLED';
    expiresAt?: string;
    purchasedByName?: string;
    redeemedByName?: string;
    recipientEmail?: string;
    message?: string;
    transactions: GiftCardTransaction[];
    createdAt: string;
}

export interface GiftCardTransaction {
    id: number;
    type: 'PURCHASE' | 'REDEEM' | 'USE' | 'REFUND';
    amount: number;
    balanceAfter: number;
    orderId?: number;
    createdAt: string;
}

export interface CreateGiftCardRequest {
    amount: number;
    currency?: string;
    recipientEmail?: string;
    recipientName?: string;
    message?: string;
    expiresAt?: string;
}

// ============ Loyalty Types ============
export interface LoyaltyProgram {
    id: number;
    name: string;
    description?: string;
    pointsPerDollar: number;
    pointValue: number;
    minimumRedemption: number;
    signupBonus: number;
    referralBonus: number;
    birthdayBonus: number;
    active: boolean;
    tiers: LoyaltyTier[];
    memberCount: number;
}

export interface LoyaltyTier {
    id: number;
    name: string;
    minimumPoints: number;
    multiplier: number;
    benefits: string[];
    color: string;
    icon: string;
}

export interface LoyaltyMember {
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    programName: string;
    currentPoints: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    currentTier: string;
    nextTier?: string;
    pointsToNextTier?: number;
    joinedAt: string;
    transactions?: LoyaltyTransaction[];
}

export interface LoyaltyTransaction {
    id: number;
    type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'BONUS' | 'ADJUST';
    points: number;
    balance: number;
    description: string;
    orderId?: number;
    createdAt: string;
}

// ============ Wallet Types ============
export interface Wallet {
    id: number;
    userId: number;
    userName: string;
    balance: number;
    frozenBalance: number;
    availableBalance: number;
    currency: string;
    active: boolean;
    totalDeposited: number;
    totalWithdrawn: number;
    totalSpent: number;
    transactions?: WalletTransaction[];
}

export interface WalletTransaction {
    id: number;
    type: 'DEPOSIT' | 'WITHDRAW' | 'PAYMENT' | 'REFUND' | 'CASHBACK' | 'TRANSFER';
    amount: number;
    balanceAfter: number;
    description?: string;
    orderId?: number;
    paymentMethod?: string;
    status: string;
    reference?: string;
    createdAt: string;
}

// ============ Subscription Types ============
export interface SubscriptionPlan {
    id: number;
    name: string;
    description?: string;
    price: number;
    billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    features: string[];
    trialDays: number;
    active: boolean;
    subscriberCount: number;
    highlighted: boolean;
}

export interface Subscription {
    id: number;
    userId: number;
    userName: string;
    planName: string;
    status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED' | 'TRIAL';
    startDate: string;
    endDate: string;
    trialEndDate?: string;
    nextBillingDate?: string;
    amount: number;
    invoices?: SubscriptionInvoice[];
}

export interface SubscriptionInvoice {
    id: number;
    amount: number;
    status: string;
    dueDate: string;
    paidAt?: string;
}

// ============ Return Types ============
export interface ReturnRequest {
    id: number;
    orderId: number;
    orderNumber: string;
    userId: number;
    userName: string;
    reason: string;
    description?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SHIPPED' | 'RECEIVED' | 'REFUNDED' | 'CLOSED';
    refundAmount?: number;
    refundMethod?: string;
    trackingNumber?: string;
    carrier?: string;
    items: ReturnItem[];
    createdAt: string;
    updatedAt: string;
}

export interface ReturnItem {
    productId: number;
    productName: string;
    productImage?: string;
    quantity: number;
    reason: string;
}

// ============ Affiliate Types ============
export interface AffiliateProgram {
    id: number;
    name: string;
    description?: string;
    commissionRate: number;
    cookieDuration: number;
    minimumPayout: number;
    active: boolean;
    affiliateCount: number;
    tiers: AffiliateTier[];
}

export interface AffiliateTier {
    name: string;
    minimumSales: number;
    commissionRate: number;
}

export interface Affiliate {
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    userAvatar?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    referralCode: string;
    referralLink: string;
    totalClicks: number;
    totalReferrals: number;
    totalConversions: number;
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    conversionRate: number;
    website?: string;
    socialMedia?: string;
    currentTier?: string;
    createdAt: string;
}

// ============ Promotion Types ============
export interface Promotion {
    id: number;
    name: string;
    description?: string;
    type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING' | 'BUY_X_GET_Y';
    discountValue: number;
    minimumOrderAmount?: number;
    maximumDiscount?: number;
    startDate: string;
    endDate: string;
    usageLimit?: number;
    usedCount: number;
    active: boolean;
    applicableProducts?: number[];
    applicableCategories?: number[];
}

// ============ CMS Types ============
export interface CmsPage {
    id: number;
    title: string;
    slug: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    template?: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    sortOrder: number;
    publishedAt?: string;
}

// ============ Warehouse Types ============
export interface Warehouse {
    id: number;
    name: string;
    code: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    capacity: number;
    currentOccupancy: number;
    occupancyPercent: number;
    primary: boolean;
    active: boolean;
}

// ============ Shipping & Tax Types ============
export interface ShippingMethod {
    id: number;
    name: string;
    code: string;
    description?: string;
    carrier: string;
    basePrice: number;
    freeShippingThreshold?: number;
    estimatedDaysMin: number;
    estimatedDaysMax: number;
    maxWeight?: number;
    active: boolean;
    sortOrder: number;
}

export interface TaxRule {
    id: number;
    name: string;
    country: string;
    state?: string;
    city?: string;
    zipCode?: string;
    taxRate: number;
    taxType: string;
    category?: string;
    active: boolean;
    priority: number;
}

// ============ Collection Types ============
export interface Collection {
    id: number;
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    type: string;
    active: boolean;
    sortOrder: number;
    productCount: number;
}

// ============ Newsletter Types ============
export interface Newsletter {
    id: number;
    email: string;
    name?: string;
    active: boolean;
    subscribedAt: string;
    unsubscribedAt?: string;
}

// ============ FAQ Types ============
export interface FAQ {
    id: number;
    question: string;
    answer: string;
    category: string;
    sortOrder: number;
    active: boolean;
    helpfulCount: number;
    notHelpfulCount: number;
}

// ============ Product Question ============
export interface ProductQuestion {
    id: number;
    question: string;
    answer?: string;
    status: 'PENDING' | 'APPROVED' | 'ANSWERED' | 'REJECTED';
    productId: number;
    productName: string;
    userName: string;
    answeredByName?: string;
    answeredAt?: string;
    helpfulCount: number;
    createdAt: string;
}

// ============ Media  ============
export interface MediaFile {
    id: number;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
    folder?: string;
    altText?: string;
    title?: string;
    uploadedByName?: string;
    createdAt: string;
}

// ============ Support Ticket Types ============
export interface SupportTicket {
    id: number;
    subject: string;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    category: string;
    userId: number;
    userName: string;
    assignedToName?: string;
    messages: TicketMessage[];
    createdAt: string;
    updatedAt: string;
}

export interface TicketMessage {
    id: number;
    message: string;
    senderName: string;
    senderRole: string;
    attachments?: string[];
    createdAt: string;
}

// ============ Notification Types ============
export interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    link?: string;
    read: boolean;
    createdAt: string;
}

// ============ Blog Types ============
export interface BlogPost {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    thumbnail?: string;
    status: 'DRAFT' | 'PUBLISHED';
    authorName: string;
    categoryName?: string;
    tags?: string[];
    viewCount: number;
    commentCount: number;
    publishedAt?: string;
    createdAt: string;
}

// ============ Table & Filter Types ============
export interface TableColumn<T = unknown> {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    render?: (value: unknown, row: T) => React.ReactNode;
    align?: 'left' | 'center' | 'right';
}

export interface FilterOption {
    label: string;
    value: string | number;
}

export interface DateRange {
    startDate: string;
    endDate: string;
}

export interface PaginationParams {
    page: number;
    size: number;
    sort?: string;
    direction?: 'asc' | 'desc';
}

// ============ Chart Types ============
export interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}

export interface ChartDataset {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
}

export interface PieChartData {
    labels: string[];
    values: number[];
    colors: string[];
}

// ============ Form Types ============
export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'color' | 'richtext';
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    options?: { label: string; value: string | number }[];
    validation?: {
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
        pattern?: string;
        message?: string;
    };
    helpText?: string;
    defaultValue?: unknown;
    colSpan?: number;
}
