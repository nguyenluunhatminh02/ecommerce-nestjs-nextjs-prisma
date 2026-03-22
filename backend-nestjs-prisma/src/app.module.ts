import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { CommonModule } from './common/common.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FilesModule } from './files/files.module';
import { HealthModule } from './health/health.module';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AddressModule } from './address/address.module';
import { CategoryModule } from './category/category.module';
import { BrandModule } from './brand/brand.module';
import { ShopModule } from './shop/shop.module';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { ReviewModule } from './review/review.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CouponModule } from './coupon/coupon.module';
import { PaymentModule } from './payment/payment.module';
import { BannerModule } from './banner/banner.module';
import { ShippingModule } from './shipping/shipping.module';
import { BlogModule } from './blog/blog.module';
import { CmsModule } from './cms/cms.module';
import { FaqModule } from './faq/faq.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { ChatModule } from './chat/chat.module';
import { SupportModule } from './support/support.module';
import { FlashSaleModule } from './flash-sale/flash-sale.module';
import { GiftCardModule } from './gift-card/gift-card.module';
import { PromotionModule } from './promotion/promotion.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { WalletModule } from './wallet/wallet.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { AffiliateModule } from './affiliate/affiliate.module';
import { ReturnModule } from './return/return.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { CollectionModule } from './collection/collection.module';
import { ProductQuestionModule } from './product-question/product-question.module';
import { SeedModule } from './seed/seed.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('rateLimit.ttl') ?? 60000,
          limit: config.get<number>('rateLimit.limit') ?? 10,
        },
      ],
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    EmailModule,
    NotificationsModule,
    FilesModule,
    HealthModule,
    ScheduleModule.forRoot(),
    AddressModule,
    CategoryModule,
    BrandModule,
    ShopModule,
    ProductModule,
    CartModule,
    OrderModule,
    ReviewModule,
    WishlistModule,
    CouponModule,
    PaymentModule,
    BannerModule,
    ShippingModule,
    BlogModule,
    CmsModule,
    FaqModule,
    NewsletterModule,
    ChatModule,
    SupportModule,
    FlashSaleModule,
    GiftCardModule,
    PromotionModule,
    LoyaltyModule,
    WalletModule,
    SubscriptionModule,
    AffiliateModule,
    ReturnModule,
    WarehouseModule,
    AnalyticsModule,
    AdminModule,
    CollectionModule,
    ProductQuestionModule,
    SeedModule,
    DashboardModule,
    QueueModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class AppModule {}
