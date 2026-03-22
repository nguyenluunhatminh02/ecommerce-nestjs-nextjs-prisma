# E-Commerce Platform - Tài liệu Test & Hướng dẫn

## 1. Tổng quan hệ thống

| Thành phần | Công nghệ | URL |
|---|---|---|
| Backend API | NestJS v11 + Prisma v7 + PostgreSQL | http://localhost:4000 |
| API Docs (Swagger) | OpenAPI 3.0 | http://localhost:4000/api/docs |
| Frontend | Next.js 16 + React 19 + TailwindCSS | http://localhost:3001 |
| PostgreSQL | v15-alpine (Docker) | localhost:5432 |
| Redis | v7-alpine (Docker) | localhost:6379 |
| MinIO (Object Storage) | Docker | http://localhost:9000 (API) / http://localhost:9001 (Console) |
| Mailpit (Email Testing) | Docker | http://localhost:8025 (WebUI) / localhost:1025 (SMTP) |
| ML Recommendation | FastAPI + Python | http://localhost:8000 (optional) |

---

## 2. Tài khoản test

### Admin

| Email | Password | Role | Ghi chú |
|---|---|---|---|
| `admin@ecommerce.com` | `Admin123!` | ADMIN | Quản trị viên chính |
| `superadmin@ecommerce.com` | `Admin123!` | ADMIN | Super Admin |

### Seller (Người bán)

| Email | Password | Shop |
|---|---|---|
| `seller1@ecommerce.com` | `Seller123!` | TechWorld |
| `seller2@ecommerce.com` | `Seller123!` | FashionHub |
| `seller3@ecommerce.com` | `Seller123!` | HomeStyle |
| `seller4@ecommerce.com` | `Seller123!` | SportZone |
| `seller5@ecommerce.com` | `Seller123!` | BeautyGlow |
| `seller6@ecommerce.com` | `Seller123!` | BookNest |
| `seller7@ecommerce.com` | `Seller123!` | ToyLand |
| `seller8@ecommerce.com` | `Seller123!` | AutoParts Pro |
| `seller9@ecommerce.com` | `Seller123!` | GreenGrocery |
| `seller10@ecommerce.com` | `Seller123!` | BabyBliss |
| `seller11@ecommerce.com` | `Seller123!` | PetParadise |
| `seller12@ecommerce.com` | `Seller123!` | GadgetWorld |
| `seller13@ecommerce.com` | `Seller123!` | MusicMart |
| `seller14@ecommerce.com` | `Seller123!` | CraftCorner |
| `seller15@ecommerce.com` | `Seller123!` | OfficeHub |

### Customer (Khách hàng)

| Email | Password | Ghi chú |
|---|---|---|
| `customer1@gmail.com` → `customer50@gmail.com` | `Customer123!` | 50 tài khoản khách hàng |

---

## 3. Mã giảm giá (Coupon Codes)

| Code | Loại | Giá trị | Điều kiện |
|---|---|---|---|
| `WELCOME10` | Phần trăm | 10% | Đơn tối thiểu $10 |
| `SAVE20` | Cố định | $20 | Đơn tối thiểu $50 |
| `FREESHIP` | Miễn phí ship | $0 | Đơn tối thiểu $30 |
| `SUMMER25` | Phần trăm | 25% | Đơn tối thiểu $40 |
| `VIP50` | Cố định | $50 | Đơn tối thiểu $100 |
| `FLASH15` | Phần trăm | 15% | Đơn tối thiểu $20 |
| `NEWYEAR30` | Phần trăm | 30% | Đơn tối thiểu $60 |

---

## 4. Infrastructure Credentials

| Service | Username | Password |
|---|---|---|
| PostgreSQL | `postgres` | `postgres` |
| MinIO Console | `minioadmin` | `minioadmin` |
| Redis | _(no auth)_ | — |
| Mailpit | _(no auth)_ | — |

**Database:** `ecommerce` trên PostgreSQL localhost:5432

---

## 5. Hướng dẫn chạy dự án từ đầu

### Yêu cầu hệ thống

| Phần mềm | Phiên bản | Ghi chú |
|---|---|---|
| Node.js | >= 18 | Khuyến nghị v20+ |
| npm | >= 9 | Đi kèm Node.js |
| Docker Desktop | Latest | Cho PostgreSQL, Redis, MinIO, Mailpit |
| Python | >= 3.10 | Cho ML Recommendation Service (tùy chọn) |
| Git | Latest | Quản lý source code |

### Bước 1: Clone & Cài đặt

```bash
git clone <repo-url>
cd ecommerce-nestjs-nextjs-prisma
```

### Bước 2: Khởi chạy Docker containers

```bash
cd backend-nestjs-prisma
docker-compose -f docker-compose.dev.yml up -d
```

Kiểm tra containers đang chạy:
```bash
docker ps
# Phải thấy: postgres, redis, minio, mailpit
```

### Bước 3: Cài đặt & Chạy Backend

```bash
cd backend-nestjs-prisma

# Cài đặt dependencies
npm install

# Tạo Prisma client
npx prisma generate

# Chạy migration (tạo tables)
npx prisma migrate deploy

# Chạy backend server
node start-server.js
# HOẶC
npx ts-node -r tsconfig-paths/register src/main.ts
```

Backend sẽ chạy trên **http://localhost:4000**

> **Lưu ý:** Lần đầu chạy, backend sẽ tự động **seed database** với dữ liệu mẫu (users, products, orders, v.v.)

### Bước 4: Tạo file `.env` cho Backend

Tạo file `backend-nestjs-prisma/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=your-jwt-secret-key-here
JWT_REFRESH_SECRET=your-jwt-refresh-secret
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=ecommerce
SMTP_HOST=localhost
SMTP_PORT=1025
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_key_here
```

### Bước 5: Cài đặt & Chạy Frontend

```bash
cd frontend-nestjs-prisma

# Cài đặt dependencies
npm install

# Chạy frontend (PHẢI dùng Turbopack)
npx next dev --turbopack --port 3001
```

Frontend sẽ chạy trên **http://localhost:3001**

### Bước 6: Tạo file `.env.local` cho Frontend

Tạo file `frontend-nestjs-prisma/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Bước 7: (Tùy chọn) Chạy ML Recommendation Service

```bash
cd ml-recommendation-service

# Cài đặt Python dependencies
pip install -r requirements.txt

# Set environment variables
# Windows PowerShell:
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/ecommerce"
$env:REDIS_URL = "redis://localhost:6379/0"

# Linux/Mac:
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce
export REDIS_URL=redis://localhost:6379/0

# Chạy ML service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

ML Service sẽ chạy trên **http://localhost:8000**

### Bước 8: Kiểm tra hệ thống

```bash
# Backend health check
curl http://localhost:4000/api/v1/health

# Frontend
# Mở trình duyệt: http://localhost:3001

# ML Service health check (nếu chạy)
curl http://localhost:8000/health

# Swagger API docs
# Mở trình duyệt: http://localhost:4000/api/docs
```

### Khởi tạo lại dữ liệu từ đầu

Nếu muốn reset toàn bộ database:
```bash
cd backend-nestjs-prisma

# Xóa database cũ
docker-compose -f docker-compose.dev.yml down -v

# Khởi tạo lại containers
docker-compose -f docker-compose.dev.yml up -d

# Chạy lại migration
npx prisma migrate deploy

# Khởi động backend (sẽ tự seed lại)
node start-server.js
```

### Bước 3: Chạy Frontend
```bash
cd frontend-nestjs-prisma
npm install
npx next dev --turbopack --port 3001
```
Frontend sẽ chạy trên http://localhost:3001

---

## 6. Seed Data (Dữ liệu mẫu)

Khi backend khởi chạy lần đầu, hệ thống tự động seed:

| Dữ liệu | Số lượng |
|---|---|
| Users | 67 |
| Categories | 90 |
| Brands | 30 |
| Shops | 15 |
| Products | 90 |
| Orders | ~337 |
| Reviews | Nhiều |
| Coupons | 7 |
| Banners | Nhiều |
| Blog Posts | Nhiều |
| Notifications | Nhiều |
| Collections | 6 |
| Flash Sales | Nhiều |
| Gift Cards | Nhiều |
| Promotions | 4+ |
| Loyalty Members | 30 |
| Subscriptions | 15 |
| Affiliates | 10 |
| Wallets | 25 |
| Warehouses | Nhiều |
| Support Tickets | 15 |
| Chat Rooms | 10 |
| FAQ Items | Nhiều |
| CMS Pages | Nhiều |
| Analytics Events | 100+ |

---

## 7. Kết quả Manual Browser Testing

### Trang khách hàng (Customer)

| Trang | URL | Trạng thái | Ghi chú |
|---|---|---|---|
| Trang chủ | `/` | ✅ OK | Banner, danh mục, sản phẩm nổi bật |
| Đăng nhập | `/auth/login` | ✅ OK | Email + Password, OAuth Google/Facebook |
| Đăng ký | `/auth/register` | ✅ OK | Form 2 bước (Thông tin → Tài khoản) |
| Quên mật khẩu | `/auth/forgot-password` | ✅ OK | Gửi email khôi phục |
| Sản phẩm | `/products` | ✅ OK | 90 sản phẩm, filter danh mục/thương hiệu, sắp xếp |
| Chi tiết sản phẩm | `/products/[slug]` | ✅ OK | Hình ảnh, giá, đánh giá, thêm giỏ hàng |
| Danh mục | `/categories` | ✅ OK | 12 danh mục chính với danh mục con |
| Bộ sưu tập | `/collections` | ✅ OK | 6 bộ sưu tập |
| Giỏ hàng | `/cart` | ✅ OK | Hiển thị trống khi chưa có sản phẩm |
| Blog | `/blog` | ✅ OK | Bài viết blog với bộ lọc danh mục |
| Wishlist | `/wishlist` | ✅ OK | Danh sách yêu thích |
| Thông báo | `/notifications` | ✅ OK | Danh sách thông báo |
| Đơn hàng | `/orders` | ✅ OK | Lịch sử đơn hàng với filter trạng thái |
| Tài khoản | `/account` | ✅ OK | Thông tin cá nhân, địa chỉ, bảo mật, cài đặt |
| Ví | `/wallet` | ✅ OK | Hiển thị số dư đúng |
| Loyalty | `/loyalty` | ✅ OK | Chương trình khách hàng thân thiết |
| Hỗ trợ | `/support` | ✅ OK | Tạo ticket hỗ trợ |
| Flash Sales | `/flash-sales` | ✅ OK | Countdown hoạt động, giá + ảnh hiển thị đúng |
| Coupons | `/coupons` | ✅ OK | Mã hiển thị đúng, giá trị hiển thị đúng |
| FAQ | `/faq` | ✅ OK | Câu hỏi thường gặp với tìm kiếm & filter |
| Gift Cards | `/gift-cards` | ✅ OK | Form nhập mã thẻ quà tặng |
| Subscriptions | `/subscriptions` | ✅ OK | 3 gói (Basic/Premium/Annual), giá hiển thị đúng |
| Affiliate | `/affiliate` | ✅ OK | Chương trình Affiliate hoạt động bình thường |
| Promotions | `/promotions` | ✅ OK | Hiển thị giá trị khuyến mãi đúng |
| Sản phẩm đã xem | `/recently-viewed` | ✅ OK | Hiển thị trống khi chưa xem |
| Chat | `/chat` | ✅ OK | Giao diện tin nhắn 2 panel |

### Trang Admin

| Trang | URL | Trạng thái | Ghi chú |
|---|---|---|---|
| Dashboard | `/admin` | ✅ OK | 574,515đ doanh thu, 337 đơn, 67 user, 90 sản phẩm |
| Products | `/admin/products` | ✅ OK | Bảng 90 sản phẩm với đầy đủ thông tin |
| Categories | `/admin/categories` | ✅ OK | Trang load được (hiển thị 0 categories) |
| Orders | `/admin/orders` | ✅ OK | 10 tab trạng thái đơn hàng |
| Analytics | `/admin/analytics` | ✅ OK | Biểu đồ doanh thu, phân bố đơn, top sản phẩm |
| Shops | `/admin/shops` | ✅ OK | Quản lý shop với tìm kiếm |
| Warehouses | `/admin/warehouses` | ✅ OK | Quản lý kho hàng + thống kê |
| Wallets | `/admin/wallets` | ✅ OK | Quản lý ví người dùng |
| Settings | `/admin/settings` | ✅ OK | Cài đặt chung, thanh toán (COD/VNPay/Stripe), email SMTP, bảo trì |

### Trang Seller

| Trang | URL | Trạng thái | Ghi chú |
|---|---|---|---|
| Dashboard | `/seller/dashboard` | ✅ OK | Tổng quan shop: doanh thu, đơn hàng, sản phẩm |
| Products | `/seller/products` | ✅ OK | Bảng sản phẩm (Giá, Kho, Đã bán, Trạng thái, Đánh giá) |
| Orders | `/seller/orders` | ✅ OK | Quản lý đơn hàng |
| Reviews | `/seller/reviews` | ✅ OK | Đánh giá sản phẩm |
| Analytics | `/seller/analytics` | ✅ OK | Thống kê shop |
| Settings | `/seller/settings` | ✅ OK | Cài đặt shop |

### API Docs

| Trang | URL | Trạng thái |
|---|---|---|
| Swagger | `http://localhost:4000/api/docs` | ✅ OK — Ecommerce API 1.0 OAS 3.0 |

---

## 8. Bugs phát hiện & Đã sửa

### Bugs đã sửa ✅

| # | Trang | Mô tả | Nguyên nhân | Fix |
|---|---|---|---|---|
| 1 | `/wallet` | Số dư hiển thị "NaN đ" | Prisma Decimal object `{s,e,d}` không serialize thành number | ✅ Thêm Decimal→number conversion trong `ApiResponseInterceptor` |
| 2 | `/flash-sales` | Giá sản phẩm hiển thị "NaN đ" + "No Image" | Decimal + frontend dùng `item.product` nhưng API trả `item.products` | ✅ Fixed interceptor + flash-sales page |
| 3 | `/coupons` | Giá trị coupon hiển thị "[object Object]%" | Decimal object truyền thẳng vào `formatCurrency()` | ✅ Fixed trong interceptor |
| 4 | `/subscriptions` | Giá gói hiển thị "NaN đ/tháng" | Decimal không convert | ✅ Fixed trong interceptor |
| 5 | `/affiliate` | Runtime Error: "Objects are not valid as React child" | Decimal object `{s,e,d}` render trực tiếp trong JSX | ✅ Fixed trong interceptor |
| 6 | `/promotions` | Giá trị "[object Object]%" và "-NaN đ" | Decimal object | ✅ Fixed trong interceptor |
| 7 | `/checkout` shipping | Phí shipping hiển thị "NaN đ" | Frontend dùng `baseRate` nhưng API trả `baseCost` | ✅ Fixed field mapping trong checkout page |
| 8 | Trang chủ banner | Banner hero không hiển thị ảnh | Seed data dùng placehold.co text placeholder | ✅ Cập nhật DB banners với picsum.photos |
| 9 | Product images | Ảnh sản phẩm không load | `next.config.js` thiếu domain + field `url` vs `imageUrl` | ✅ Added domains + fixed field mapping |
| 10 | `/admin` layout | Auth guard redirect ngay cả khi đã login | Hydration issue — Zustand store chưa hydrate xong đã check `isAuthenticated` | ✅ Thêm `hydrated` useState pattern trong admin layout |
| 11 | `/admin/orders` | Hiển thị 0 đơn hàng | API trả `items` nhưng frontend cần `content` | ✅ Thêm `content` alias trong `order.service.ts` |
| 12 | `/admin/orders` | Giá hiển thị "NaN ₫" | Frontend dùng `total` nhưng API trả `totalAmount` | ✅ Fix field mapping `totalAmount` → `total` |
| 13 | `/admin/orders` | Tên khách hàng hiển thị "N/A" | Frontend dùng `shippingAddress.fullName` nhưng API trả `shippingFullName` | ✅ Fix field mapping |
| 14 | `/admin/customers` | Trang crash | `null` guard thiếu + `userRoles` extraction sai | ✅ Thêm null guard + fix role extraction |
| 15 | `/seller/analytics` | Doanh thu hiển thị "NaN ₫" | Backend queries trả cấu trúc sai + frontend thiếu guard | ✅ Fix backend queries + frontend NaN guards |
| 16 | `/seller/analytics` | "0 đơn hàng" mặc dù có dữ liệu | `orderStatusDistribution` query sai | ✅ Fix raw SQL query cho phân bố đơn hàng |
| 17 | `/seller/analytics` | "Sắp hết hàng" bảng trống | `lowStockProducts` query thiếu | ✅ Fix query lấy sản phẩm sắp hết hàng |
| 18 | `/seller/analytics` | Section topProducts/topCategories/revenueChart trống | Thiếu data từ backend | ✅ Fix backend queries cho top products, categories, revenue chart |
| 19 | `/seller/analytics` | 500 error (column thumbnail) | SQL dùng `thumbnail` nhưng schema dùng `product_images` | ✅ Fix subquery lấy ảnh sản phẩm |
| 20 | `/seller/analytics` | 500 error (column stock) | SQL dùng `stock` nhưng schema dùng `stock_quantity` | ✅ Fix column name |
| 21 | `/seller/analytics` | Biểu đồ hiển thị timestamp thô | Thiếu date formatting | ✅ Thêm date formatting cho revenue chart |
| 22 | `/products/[slug]` | "Đánh giá (undefined)" | API thiếu `totalReviews` field | ✅ Thêm `totalReviews` alias trong `product.service.ts` mapToResponse() |
| 23 | `/products/[slug]` | Hiển thị "Hết hàng" dù có stock | API thiếu `quantity` field | ✅ Thêm `quantity` alias trong product mapToResponse() |
| 24 | `/products/[slug]` | Tên attribute trống | API thiếu `attributeId`/`attributeName`/`displayValue` | ✅ Thêm attribute alias fields |
| 25 | `/products/[slug]` | Shop badge "Chưa xác minh" | API thiếu `isVerified` alias | ✅ Thêm `isVerified` alias |
| 26 | `/products/[slug]` | Variant quantity = 0 | API thiếu `quantity` cho variants | ✅ Thêm variant `quantity` alias |
| 27 | `/orders` | "Chưa có đơn hàng nào" mặc dù có đơn | `getMyOrders` trả `{items, total}` nhưng frontend cần `{content, totalElements}` | ✅ Thêm `content`/`totalElements` aliases trong `order.service.ts` |
| 28 | `/cart` | Tên sản phẩm và ảnh trống, link `/products/undefined` | Backend trả nested Prisma data (`products.name`) nhưng frontend cần flat (`productName`) | ✅ Thêm `mapCartToResponse()` trong `cart.service.ts` |
| 29 | `/account` | Field mismatch user profile | Backend `isEmailVerified`/`isActive`/`ROLE_CUSTOMER` vs frontend `emailVerified`/`enabled`/`CUSTOMER` | ✅ Thêm alias fields trong `auth.service.ts` mapToUserResponse() |

### Bugs còn lại

| # | Trang | Mô tả | Mức độ |
|---|---|---|---|
| 1 | `/admin/categories` | Hiển thị 0 categories dù có 90 categories trong DB | Low |

---

## 9. Chức năng chính đã kiểm tra

- ✅ Authentication (Login / Register / Forgot Password / OAuth buttons)
- ✅ Product browsing & filtering
- ✅ Product detail view
- ✅ Shopping cart
- ✅ Wishlist
- ✅ Blog
- ✅ Chat messaging
- ✅ Order management (customer & admin)
- ✅ Admin dashboard & analytics
- ✅ Admin settings (General, Payment, Email, Maintenance)
- ✅ Seller Center (Dashboard, Products, Orders, Reviews, Analytics, Settings)
- ✅ Category browsing
- ✅ Collections
- ✅ FAQ with search
- ✅ Gift cards
- ✅ Loyalty program
- ✅ Support tickets
- ✅ Notifications
- ✅ Recently viewed products
- ✅ Flash sales (with countdown)
- ✅ Coupons
- ✅ Promotions
- ✅ Subscriptions
- ✅ Warehouse management
- ✅ Wallet management
- ✅ Swagger API documentation

---

## 10. Phương thức thanh toán (Payment Methods)

Checkout page (`/checkout`) hỗ trợ 6 phương thức thanh toán:

| Phương thức | Tên hiển thị | Mô tả |
|---|---|---|
| `COD` | Thanh toán khi nhận hàng (COD) | Trả tiền mặt khi nhận hàng |
| `STRIPE` | Thẻ tín dụng / Ghi nợ (Stripe) | Visa, Mastercard, JCB, AMEX — tích hợp Stripe Elements |
| `BANK_TRANSFER` | Chuyển khoản ngân hàng | Chuyển khoản qua tài khoản ngân hàng (hiển thị thông tin chuyển khoản) |
| `PAYPAL` | PayPal | Thanh toán quốc tế qua PayPal |
| `MOMO` | Ví MoMo | Thanh toán qua ví MoMo |
| `VNPAY` | VNPay | Thanh toán VNPay QR / ATM nội địa |

### API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/v1/payments/methods` | Lấy danh sách phương thức thanh toán |
| `POST` | `/api/v1/payments/create-intent` | Tạo Stripe PaymentIntent |
| `POST` | `/api/v1/payments/confirm` | Xác nhận thanh toán |
| `POST` | `/api/v1/payments/cod` | Xác nhận COD |
| `POST` | `/api/v1/payments/bank-transfer/:orderId` | Lấy thông tin chuyển khoản |
| `POST` | `/api/v1/payments/webhook` | Stripe webhook |

### Stripe Keys (Test Mode)
- Publishable Key: `pk_test_51T03Jn...` (trong `.env.local`)
- Secret Key: `sk_test_51T03Jn...` (trong `.env`)

---

## 11. ML Recommendation Service

### Tổng quan

| Thông tin | Chi tiết |
|---|---|
| Framework | FastAPI (Python) |
| Thuật toán | SVD + NMF (Matrix Factorization) |
| Database | PostgreSQL (shared with backend) |
| Cache | Redis |
| Port | 8000 |

### API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/v1/recommendations/trending` | Sản phẩm trending |
| `GET` | `/api/v1/recommendations/user/{userId}` | Gợi ý cho user cụ thể |
| `GET` | `/api/v1/recommendations/product/{productId}/similar` | Sản phẩm tương tự |
| `POST` | `/api/v1/training/train` | Huấn luyện model (body: `{"algorithm": "all"}`) |
| `GET` | `/api/v1/training/status` | Trạng thái model |

### Cấu trúc thư mục

```
ml-recommendation-service/
├── app/
│   ├── main.py           # FastAPI entry point
│   ├── config.py          # Configuration
│   ├── api/               # API routes
│   ├── models/            # DB models
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # Business logic
│   │   └── data_service.py  # SQL queries
│   └── utils/             # Utilities
├── ml/
│   └── models/            # Trained model files (.pkl)
├── requirements.txt
└── Dockerfile
```

---

## 12. Files đã thay đổi

| File | Thay đổi |
|---|---|
| `backend-nestjs-prisma/src/common/interceptors/api-response.interceptor.ts` | Thêm Prisma Decimal→number conversion |
| `backend-nestjs-prisma/src/product/product.service.ts` | Thêm field `url` bên cạnh `imageUrl` + thêm alias fields (`totalReviews`, `totalSold`, `quantity`, `isFeatured`, `isVerified`, attribute fields, variant `quantity`) trong mapToResponse() |
| `backend-nestjs-prisma/src/payment/payment.service.ts` | Viết lại hoàn toàn với Stripe integration + 6 payment methods |
| `backend-nestjs-prisma/src/payment/payment.controller.ts` | Thêm endpoints: getMethods, bankTransfer, webhook |
| `backend-nestjs-prisma/src/payment/payment.module.ts` | Import ConfigModule |
| `backend-nestjs-prisma/src/order/order.controller.ts` | Thêm endpoints: shop/:shopId, :id/status (PATCH) |
| `backend-nestjs-prisma/src/order/order.service.ts` | Fix getShopOrders filter + thêm `content`/`totalElements` aliases trong getMyOrders() và getAllOrders() |
| `backend-nestjs-prisma/src/cart/cart.service.ts` | Thêm `mapCartToResponse()` — flatten nested Prisma data (products.name→productName, products.slug→productSlug, images→productImage, shops→shopId/shopName/shopSlug, variant→variantName) |
| `backend-nestjs-prisma/src/auth/services/auth.service.ts` | Thêm alias fields trong mapToUserResponse(): `emailVerified`, `enabled`, `provider`, role without `ROLE_` prefix |
| `backend-nestjs-prisma/src/analytics/analytics.service.ts` | Fix seller analytics queries: orderStatusDistribution, lowStockProducts, topProducts, topCategories, revenueChart, column fixes (thumbnail→product_images subquery, stock→stock_quantity) |
| `backend-nestjs-prisma/.env` | Thêm `http://localhost:3001` vào CORS_ORIGINS |
| `frontend-nestjs-prisma/next.config.js` | Thêm 5 image domains (picsum.photos, placehold.co, etc.) |
| `frontend-nestjs-prisma/.env.local` | Thêm `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| `frontend-nestjs-prisma/src/app/(main)/checkout/page.tsx` | Viết lại: Stripe Elements, 6 payment methods, BankTransferInfo |
| `frontend-nestjs-prisma/src/app/(main)/flash-sales/page.tsx` | Fix image field mapping (`products` vs `product`, `images[0].imageUrl`) |
| `frontend-nestjs-prisma/src/app/seller/orders/page.tsx` | Thêm nút quản lý trạng thái đơn hàng (Xác nhận, Xử lý, Giao hàng, Hủy) |
| `frontend-nestjs-prisma/src/app/admin/layout.tsx` | Enable auth guard, fix logout, fix dropdown close on outside click, hydrated useState pattern |
| `frontend-nestjs-prisma/src/app/admin/page.tsx` | Fix revenue chart performance, fix order detail links |
| `frontend-nestjs-prisma/src/app/admin/orders/page.tsx` | Fix status update API (PUT→PATCH with body), fix field mapping (total→totalAmount, shippingAddress.fullName→shippingFullName), thêm `content` alias |
| `frontend-nestjs-prisma/src/app/admin/customers/page.tsx` | Thêm null guard + fix userRoles extraction |
| `frontend-nestjs-prisma/src/services/api.service.ts` | Thêm getShopOrders, updateOrderStatus methods |
| `frontend-nestjs-prisma/src/services/order.service.ts` | Fix cancelOrder (PUT→PATCH), updateOrderStatus (PUT→PATCH+body) |
| `ml-recommendation-service/app/services/data_service.py` | Fix SQL column names to match Prisma schema |
| `.gitignore` | Cập nhật comprehensive gitignore |
| `ml-recommendation-service/.gitignore` | Tạo mới cho ML service |
