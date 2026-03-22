# Prisma Backend Controller Audit

Controller files: 37
Resolved endpoints: 264

## src/address/address.controller.ts
- Controllers:
  - @Controller('addresses') => base path: /addresses
- Endpoints:
  - GET /addresses (handler: getAll)
  - GET /addresses/default (handler: getDefault)
  - GET /addresses/:id (handler: getById)
  - POST /addresses (handler: create)
  - PUT /addresses/:id (handler: update)
  - DELETE /addresses/:id (handler: delete)
  - PATCH /addresses/:id/default (handler: setDefault)

## src/admin/admin.controller.ts
- Controllers:
  - @Controller('admin') => base path: /admin
- Endpoints:
  - GET /admin/users (handler: getUsers)
  - PATCH /admin/users/:id/toggle-active (handler: toggleActive)
  - PATCH /admin/users/:id/toggle-status (handler: toggleUserStatus)
  - GET /admin/orders (handler: getOrders)
  - PATCH /admin/orders/:id/status (handler: updateOrderStatus)
  - GET /admin/returns (handler: getReturns)
  - PATCH /admin/returns/:id (handler: handleReturn)
  - GET /admin/tickets (handler: getTickets)

## src/affiliate/affiliate.controller.ts
- Controllers:
  - @Controller('affiliates') => base path: /affiliates
- Endpoints:
  - GET /affiliates/programs (handler: getPrograms)
  - GET /affiliates/my (handler: getMyAffiliate)
  - POST /affiliates/join (handler: join)
  - GET /affiliates/stats (handler: getStats)
  - POST /affiliates/programs (handler: createProgram)

## src/analytics/analytics.controller.ts
- Controllers:
  - @Controller('analytics') => base path: /analytics
  - @Controller('admin/analytics') => base path: /admin/analytics
- Endpoints:
  - POST /analytics/events (handler: trackEvent)
  - GET /analytics/dashboard (handler: getDashboard)
  - GET /analytics/orders (handler: getOrderStats)
  - GET /analytics/users (handler: getUserStats)
  - GET /analytics/audit-logs (handler: getAuditLogs)
  - GET /admin/analytics/dashboard (handler: getDashboard)
  - GET /admin/analytics/revenue (handler: getRevenue)
  - GET /admin/analytics/sales (handler: getSales)
  - GET /admin/analytics/products (handler: getProductsAnalytics)
  - GET /admin/analytics/products/top-selling (handler: getTopSelling)
  - GET /admin/analytics/products/top-viewed (handler: getTopViewed)
  - GET /admin/analytics/categories (handler: getCategoryAnalytics)
  - GET /admin/analytics/users (handler: getUsersAnalytics)
  - GET /admin/analytics/conversion (handler: getConversionFunnel)
  - GET /admin/analytics/orders/status (handler: getOrderStatusBreakdown)
  - GET /admin/analytics/shops (handler: getShopAnalytics)
  - GET /admin/analytics/shops/:shopId (handler: getSellerPerformance)
  - GET /admin/analytics/inventory (handler: getInventoryAnalytics)
  - GET /admin/analytics/reviews (handler: getReviewAnalytics)
  - GET /admin/analytics/daily (handler: getDailyAnalytics)
  - GET /admin/analytics/real-time (handler: getRealTimeStats)

## src/auth/auth.controller.ts
- Controllers:
  - @Controller('auth') => base path: /auth
- Endpoints:
  - POST /auth/register (handler: register)
  - GET /auth/verify-email (handler: verifyEmail)
  - POST /auth/resend-verification (handler: resendVerification)
  - POST /auth/login (handler: login)
  - POST /auth/mfa/validate (handler: mfaValidate)
  - POST /auth/refresh-token (handler: refresh)
  - POST /auth/logout (handler: logout)
  - POST /auth/logout-all (handler: logoutAll)
  - POST /auth/forgot-password (handler: forgotPassword)
  - POST /auth/reset-password (handler: resetPassword)
  - POST /auth/change-password (handler: changePassword)
  - POST /auth/mfa/setup (handler: mfaSetup)
  - POST /auth/mfa/verify (handler: mfaVerify)
  - POST /auth/mfa/disable (handler: mfaDisable)
  - GET /auth/oauth2/google (handler: googleAuth)
  - GET /auth/oauth2/google/callback (handler: googleCallback)
  - GET /auth/oauth2/github (handler: githubAuth)
  - GET /auth/oauth2/github/callback (handler: githubCallback)

## src/banner/banner.controller.ts
- Controllers:
  - @Controller('banners') => base path: /banners
- Endpoints:
  - GET /banners (handler: getActive)
  - GET /banners/all (handler: getAll)
  - POST /banners (handler: create)
  - PUT /banners/:id (handler: update)
  - DELETE /banners/:id (handler: delete)

## src/blog/blog.controller.ts
- Controllers:
  - @Controller('blog') => base path: /blog
- Endpoints:
  - GET /blog/categories (handler: getCategories)
  - POST /blog/categories (handler: createCategory)
  - GET /blog/posts (handler: getPosts)
  - GET /blog/posts/:slug (handler: getPostBySlug)
  - POST /blog/posts (handler: createPost)
  - PUT /blog/posts/:id (handler: updatePost)
  - DELETE /blog/posts/:id (handler: deletePost)
  - POST /blog/posts/:id/comments (handler: addComment)
  - DELETE /blog/comments/:id (handler: deleteComment)

## src/brand/brand.controller.ts
- Controllers:
  - @Controller('brands') => base path: /brands
- Endpoints:
  - GET /brands (handler: getAll)
  - GET /brands/:slug (handler: getBySlug)
  - POST /brands (handler: create)
  - PUT /brands/:id (handler: update)
  - DELETE /brands/:id (handler: delete)

## src/cart/cart.controller.ts
- Controllers:
  - @Controller('cart') => base path: /cart
- Endpoints:
  - GET /cart (handler: getCart)
  - POST /cart/items (handler: addItem)
  - PUT /cart/items/:itemId (handler: updateItem)
  - DELETE /cart/items/:itemId (handler: removeItem)
  - DELETE /cart (handler: clearCart)
  - POST /cart/coupon (handler: applyCoupon)
  - DELETE /cart/coupon (handler: removeCoupon)

## src/category/category.controller.ts
- Controllers:
  - @Controller('categories') => base path: /categories
- Endpoints:
  - GET /categories (handler: getAll)
  - GET /categories/root (handler: getRootCategories)
  - GET /categories/featured (handler: getFeatured)
  - GET /categories/slug/:slug (handler: getBySlug)
  - GET /categories/:id (handler: getById)
  - POST /categories (handler: create)
  - PUT /categories/:id (handler: update)
  - DELETE /categories/:id (handler: delete)
  - PATCH /categories/:id/toggle-status (handler: toggleStatus)

## src/chat/chat.controller.ts
- Controllers:
  - @Controller('chat') => base path: /chat
- Endpoints:
  - GET /chat/rooms (handler: getMyRooms)
  - POST /chat/rooms (handler: getOrCreateRoom)
  - GET /chat/rooms/:roomId/messages (handler: getMessages)
  - POST /chat/rooms/:roomId/messages (handler: sendMessage)
  - POST /chat/rooms/:roomId/read (handler: markRead)

## src/cms/cms.controller.ts
- Controllers:
  - @Controller('cms') => base path: /cms
- Endpoints:
  - GET /cms/pages (handler: getPages)
  - GET /cms/pages/:slug (handler: getBySlug)
  - POST /cms/pages (handler: create)
  - PUT /cms/pages/:id (handler: update)
  - DELETE /cms/pages/:id (handler: delete)

## src/collection/collection.controller.ts
- Controllers:
  - @Controller('collections') => base path: /collections
- Endpoints:
  - GET /collections (handler: getAll)
  - GET /collections/:slug (handler: getBySlug)
  - POST /collections (handler: create)
  - PUT /collections/:id (handler: update)
  - POST /collections/:id/products (handler: addProducts)
  - DELETE /collections/:id/products/:productId (handler: removeProduct)
  - DELETE /collections/:id (handler: delete)

## src/coupon/coupon.controller.ts
- Controllers:
  - @Controller('coupons') => base path: /coupons
- Endpoints:
  - GET /coupons (handler: getAll)
  - POST /coupons/validate (handler: validate)
  - POST /coupons (handler: create)
  - PUT /coupons/:id (handler: update)
  - DELETE /coupons/:id (handler: delete)

## src/faq/faq.controller.ts
- Controllers:
  - @Controller('faqs') => base path: /faqs
- Endpoints:
  - GET /faqs (handler: getAll)
  - POST /faqs (handler: create)
  - PUT /faqs/:id (handler: update)
  - DELETE /faqs/:id (handler: delete)

## src/files/files.controller.ts
- Controllers:
  - @Controller('files') => base path: /files
- Endpoints:
  - POST /files/upload (handler: upload)
  - POST /files/upload/avatar (handler: uploadAvatar)
  - DELETE /files (handler: deleteFile)

## src/flash-sale/flash-sale.controller.ts
- Controllers:
  - @Controller('flash-sales') => base path: /flash-sales
- Endpoints:
  - GET /flash-sales (handler: getActive)
  - GET /flash-sales/:id (handler: getById)
  - POST /flash-sales (handler: create)
  - PUT /flash-sales/:id (handler: update)
  - DELETE /flash-sales/:id (handler: delete)

## src/gift-card/gift-card.controller.ts
- Controllers:
  - @Controller('gift-cards') => base path: /gift-cards
- Endpoints:
  - GET /gift-cards (handler: getMyCards)
  - GET /gift-cards/:code (handler: getByCode)
  - POST /gift-cards (handler: create)
  - POST /gift-cards/:code/redeem (handler: redeem)

## src/health/health.controller.ts
- Controllers:
  - @Controller('health') => base path: /health
- Endpoints:
  - GET /health (handler: healthCheck)
  - GET /health/detailed (handler: check)
  - GET /health/database (handler: checkDatabase)
  - GET /health/redis (handler: checkRedis)
  - GET /health/minio (handler: checkMinio)

## src/loyalty/loyalty.controller.ts
- Controllers:
  - @Controller('loyalty') => base path: /loyalty
- Endpoints:
  - GET /loyalty/programs (handler: getPrograms)
  - GET /loyalty/membership (handler: getMyMembership)
  - POST /loyalty/join (handler: join)
  - GET /loyalty/transactions (handler: getTransactions)
  - POST /loyalty/redeem (handler: redeemPoints)
  - POST /loyalty/programs (handler: createProgram)

## src/newsletter/newsletter.controller.ts
- Controllers:
  - @Controller('newsletter') => base path: /newsletter
- Endpoints:
  - POST /newsletter/subscribe (handler: subscribe)
  - POST /newsletter/unsubscribe (handler: unsubscribe)
  - GET /newsletter/subscribers (handler: getAll)

## src/notifications/notifications.controller.ts
- Controllers:
  - @Controller('notifications') => base path: /notifications
- Endpoints:
  - GET /notifications (handler: getNotifications)
  - GET /notifications/unread (handler: getUnread)
  - GET /notifications/type/:type (handler: getByType)
  - GET /notifications/unread-count (handler: getUnreadCount)
  - PATCH /notifications/:id/read (handler: markAsRead)
  - PATCH /notifications/:id/unread (handler: markAsUnread)
  - PATCH /notifications/read-all (handler: markAllAsRead)
  - DELETE /notifications/:id (handler: deleteNotification)

## src/order/order.controller.ts
- Controllers:
  - @Controller('orders') => base path: /orders
- Endpoints:
  - GET /orders (handler: getMyOrders)
  - GET /orders/:id (handler: getById)
  - POST /orders (handler: create)
  - PATCH /orders/:id/cancel (handler: cancel)

## src/payment/payment.controller.ts
- Controllers:
  - @Controller('payments') => base path: /payments
- Endpoints:
  - GET /payments/order/:orderId (handler: getByOrder)
  - POST /payments (handler: create)
  - PATCH /payments/:id/status (handler: updateStatus)
  - POST /payments/webhook/:provider (handler: webhook)

## src/product-question/product-question.controller.ts
- Controllers:
  - @Controller('product-questions') => base path: /product-questions
- Endpoints:
  - GET /product-questions/product/:productId (handler: getByProduct)
  - POST /product-questions (handler: ask)
  - POST /product-questions/:id/answer (handler: answer)

## src/product/product.controller.ts
- Controllers:
  - @Controller('products') => base path: /products
- Endpoints:
  - GET /products/filter (handler: filter)
  - GET /products/featured (handler: getFeatured)
  - GET /products/new-arrivals (handler: getNewArrivals)
  - GET /products/best-sellers (handler: getBestSellers)
  - GET /products/deals (handler: getDeals)
  - GET /products/slug/:slug (handler: getBySlug)
  - GET /products/shop/:shopId (handler: getShopProducts)
  - GET /products/:id/related (handler: getRelated)
  - GET /products/:id (handler: getById)
  - POST /products (handler: create)
  - PUT /products/:id (handler: update)
  - DELETE /products/:id (handler: delete)
  - PUT /products/:id/publish (handler: publish)
  - GET /products/recently-viewed/me (handler: getRecentlyViewed)
  - POST /products/:id/view (handler: recordView)
  - GET /products/recommendations/personalized (handler: getPersonalizedRecommendations)
  - GET /products/recommendations/similar/:productId (handler: getSimilarProducts)
  - GET /products/recommendations/trending (handler: getTrendingProducts)
  - GET /products/recommendations/popular (handler: getPopularProducts)
  - GET /products/recommendations/frequently-bought/:productId (handler: getFrequentlyBoughtTogether)
  - POST /products/recommendations/track/view (handler: trackProductView)
  - POST /products/recommendations/track/purchase (handler: trackPurchase)
  - POST /products/recommendations/track/cart (handler: trackAddToCart)
  - GET /products/recommendations/stats (handler: getRecommendationStats)

## src/promotion/promotion.controller.ts
- Controllers:
  - @Controller('promotions') => base path: /promotions
- Endpoints:
  - GET /promotions (handler: getActive)
  - GET /promotions/all (handler: getAll)
  - GET /promotions/:id (handler: getById)
  - POST /promotions (handler: create)
  - PUT /promotions/:id (handler: update)
  - DELETE /promotions/:id (handler: delete)

## src/return/return.controller.ts
- Controllers:
  - @Controller('returns') => base path: /returns
- Endpoints:
  - GET /returns (handler: getMyReturns)
  - GET /returns/:id (handler: getById)
  - POST /returns (handler: create)

## src/review/review.controller.ts
- Controllers:
  - @Controller('reviews') => base path: /reviews
- Endpoints:
  - GET /reviews/product/:productId (handler: getByProduct)
  - POST /reviews (handler: create)
  - PUT /reviews/:id (handler: update)
  - DELETE /reviews/:id (handler: delete)
  - POST /reviews/:id/reply (handler: reply)
  - POST /reviews/:id/helpful (handler: helpful)

## src/shipping/shipping.controller.ts
- Controllers:
  - @Controller('shipping') => base path: /shipping
- Endpoints:
  - GET /shipping/methods (handler: getMethods)
  - GET /shipping/methods/all (handler: getAllMethods)
  - POST /shipping/methods (handler: createMethod)
  - PUT /shipping/methods/:id (handler: updateMethod)
  - DELETE /shipping/methods/:id (handler: deleteMethod)
  - GET /shipping/shipments/order/:orderId (handler: getByOrder)
  - GET /shipping/shipments/:id (handler: getShipment)
  - POST /shipping/shipments (handler: createShipment)
  - PATCH /shipping/shipments/:id (handler: updateShipment)

## src/shop/shop.controller.ts
- Controllers:
  - @Controller('shops') => base path: /shops
- Endpoints:
  - GET /shops (handler: getAll)
  - GET /shops/my-shop (handler: getMyShop)
  - GET /shops/:slug (handler: getBySlug)
  - POST /shops (handler: create)
  - PUT /shops/:id (handler: update)
  - POST /shops/:id/follow (handler: follow)
  - DELETE /shops/:id/follow (handler: unfollow)
  - DELETE /shops/:id (handler: delete)

## src/subscription/subscription.controller.ts
- Controllers:
  - @Controller('subscriptions') => base path: /subscriptions
- Endpoints:
  - GET /subscriptions/plans (handler: getPlans)
  - GET /subscriptions/my (handler: getMySubscription)
  - POST /subscriptions (handler: subscribe)
  - POST /subscriptions/cancel (handler: cancel)
  - POST /subscriptions/plans (handler: createPlan)
  - PUT /subscriptions/plans/:id (handler: updatePlan)

## src/support/support.controller.ts
- Controllers:
  - @Controller('support') => base path: /support
- Endpoints:
  - GET /support/tickets (handler: getMyTickets)
  - GET /support/tickets/:id (handler: getById)
  - POST /support/tickets (handler: create)
  - POST /support/tickets/:id/reply (handler: reply)
  - PATCH /support/tickets/:id/close (handler: close)

## src/users/users.controller.ts
- Controllers:
  - @Controller('users/me') => base path: /users/me
- Endpoints:
  - GET /users/me (handler: getMe)
  - PUT /users/me (handler: updateProfile)
  - DELETE /users/me (handler: deleteMe)
  - POST /users/me/cancel-delete (handler: cancelDelete)
  - GET /users/me/notification-preferences (handler: getNotificationPreferences)
  - PUT /users/me/notification-preferences (handler: updateNotificationPreferences)
  - GET /users/me/privacy (handler: getPrivacySettings)
  - PUT /users/me/privacy (handler: updatePrivacySettings)
  - POST /users/me/fcm-token (handler: updateFcmToken)
  - GET /users/me/devices (handler: getDevices)
  - POST /users/me/devices/:id/trust (handler: trustDevice)
  - POST /users/me/devices/:id/untrust (handler: untrustDevice)
  - DELETE /users/me/devices/:id (handler: removeDevice)
  - POST /users/me/security-questions (handler: setupSecurityQuestions)
  - GET /users/me/security-questions (handler: getSecurityQuestions)
  - GET /users/me/sessions (handler: getSessions)
  - DELETE /users/me/sessions/:id (handler: deleteSession)
  - GET /users/me/login-history (handler: getLoginHistory)

## src/wallet/wallet.controller.ts
- Controllers:
  - @Controller('wallet') => base path: /wallet
- Endpoints:
  - GET /wallet (handler: getWallet)
  - GET /wallet/transactions (handler: getTransactions)
  - POST /wallet/top-up (handler: topUp)

## src/warehouse/warehouse.controller.ts
- Controllers:
  - @Controller('warehouses') => base path: /warehouses
- Endpoints:
  - GET /warehouses (handler: getAll)
  - GET /warehouses/:id (handler: getById)
  - POST /warehouses (handler: create)
  - PUT /warehouses/:id (handler: update)
  - DELETE /warehouses/:id (handler: delete)
  - GET /warehouses/:id/stocks (handler: getStocks)
  - POST /warehouses/:id/stocks (handler: updateStock)

## src/wishlist/wishlist.controller.ts
- Controllers:
  - @Controller('wishlist') => base path: /wishlist
- Endpoints:
  - GET /wishlist (handler: getAll)
  - POST /wishlist/:productId (handler: toggle)
  - GET /wishlist/:productId/check (handler: check)
  - DELETE /wishlist/:productId (handler: remove)

## Missing Required Endpoints By Module
- Users: PUT /users/me/password, GET /users, GET /users/:id, PUT /users/:id/toggle-status, PUT /users/:id/role
- Address: PUT /addresses/:id/default
- Category: NONE
- Brand: GET /brands/:id, GET /brands/search
- Shop: GET /shops/slug/:slug, GET /shops/search, GET /shops/top, POST /shops/:shopId/follow, DELETE /shops/:shopId/follow
- Wishlist: POST /wishlist/:productId/toggle, GET /wishlist/check/:productId, GET /wishlist/count, DELETE /wishlist
- Notifications: GET /notifications/unread/count, PUT /notifications/:id/read, PUT /notifications/read-all
- Coupon: GET /coupons/active, PUT /coupons/:id/toggle
- Payment: POST /payments/create-intent/:orderId, POST /payments/confirm, POST /payments/cod/:orderId, POST /payments/refund/:orderId
- Chat: PUT /chat/rooms/:roomId/read, GET /chat/unread-count
- Blog: GET /blog/posts/slug/:slug, GET /blog/posts/featured, GET /blog/posts/search, GET /blog/posts/category/:categoryId
- Support: PUT /support/tickets/:id/close
- Dashboard: GET /dashboard/admin, GET /dashboard/seller/:shopId, GET /dashboard/admin/revenue, GET /dashboard/admin/orders-chart
- Files: POST /files/upload/image, POST /files/upload/multiple
- Banners: GET /banners/active
- Flash Sales: GET /flash-sales/active, GET /flash-sales/upcoming
- Shipping: GET /shipping/methods/active, GET /shipping/methods/calculate

## Dashboard Controller Presence
- No dashboard controller file or @Controller('dashboard') found.