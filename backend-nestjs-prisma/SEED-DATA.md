# Seed Data Guide

Hướng dẫn cách tạo dữ liệu mẫu (seed data) cho hệ thống E-Commerce khi clone project về.

## Tổng quan

Hệ thống sử dụng **scraper** để thu thập dữ liệu thật từ Tiki.vn và Shopee.vn, sau đó tự động seed vào database khi khởi động NestJS server.

## Quy trình Seed Data

### Bước 1: Cài đặt và khởi động services

```bash
# Clone project
git clone <repo-url>
cd backend-nestjs-prisma

# Cài đặt dependencies
npm install

# Khởi động Docker (PostgreSQL, Redis, MinIO, Mailpit)
docker compose -f docker-compose.dev.yml up -d

# Migrate database
npx prisma migrate dev
```

### Bước 2: Scrape dữ liệu

```bash
# Scrape từ cả Tiki + Shopee (khuyến nghị)
npm run scrape

# Hoặc scrape với số lượng tùy chỉnh (4 sản phẩm/danh mục/nguồn)
node scripts/scrape-data.js --limit=4

# Chỉ scrape từ Tiki
node scripts/scrape-data.js --tiki-only

# Chỉ scrape từ Shopee
node scripts/scrape-data.js --shopee-only

# Scrape nhanh (2 sản phẩm/danh mục)
npm run scrape:quick

# Dùng DummyJSON nếu Tiki/Shopee bị chặn
npm run scrape:fallback
```

Dữ liệu scrape được lưu tại `data/scraped/`:
- `categories.json` — Danh mục (cha + con)
- `brands.json` — Thương hiệu
- `products.json` — Sản phẩm
- `reviews.json` — Đánh giá

### Bước 3: Khởi động server (tự động seed)

```bash
# Khởi động server
node start-server.js
# hoặc
npm run start:dev
```

Server sẽ tự động seed dữ liệu khi khởi động nếu database trống (chưa có user nào).

## Seed lại từ đầu

Nếu muốn seed lại dữ liệu mới:

```bash
# Reset database (xóa toàn bộ data + migrate lại)
npx prisma migrate reset --force

# Scrape dữ liệu mới
npm run scrape

# Khởi động server (sẽ tự động seed)
node start-server.js
```

## Chi tiết Scraper

### Nguồn dữ liệu
| Nguồn | API | Dữ liệu |
|-------|-----|----------|
| Tiki.vn | `tiki.vn/api/v2/products` | Sản phẩm, reviews, thương hiệu |
| Shopee.vn | `shopee.vn/api/v4/search` | Sản phẩm, reviews |
| DummyJSON | `dummyjson.com/products` | Fallback khi API bị chặn |

### Danh mục được scrape
- **Electronics** — Smartphones, Laptops, Tablets, Headphones, Cameras, Smartwatches, Speakers, Gaming Consoles
- **Fashion** — Men's/Women's Clothing, Shoes, Accessories, Jewelry, Bags, Underwear
- **Home & Kitchen** — Furniture, Kitchen Appliances, Home Decor, Bedding, Lighting, Storage, Cleaning
- **Sports & Outdoors** — Fitness Equipment, Camping, Cycling, Running, Yoga, Swimming, Team Sports
- **Beauty & Health** — Skincare, Makeup, Hair Care, Supplements, Personal Care, Perfumes, Medical Devices
- **Books & Stationery** — Fiction, Non-Fiction, Textbooks, Art Supplies, Office Supplies
- **Food & Beverages** — Snacks, Coffee & Tea, Dairy, Cooking Ingredients
- **Toys & Games** — Educational Toys, Action Figures, Board Games, Outdoor Play
- **Automotive** — Car Care, Car Electronics, Exterior Parts
- **Pet Supplies** — Dog Food, Cat Food, Pet Accessories

### Cấu hình
- `--limit=N` — Số sản phẩm tối đa mỗi danh mục con mỗi nguồn (mặc định: 3)
- `--tiki-only` — Chỉ scrape từ Tiki
- `--shopee-only` — Chỉ scrape từ Shopee
- `--fallback` — Dùng DummyJSON thay vì scrape

### Rate Limiting
Scraper tự động delay 2 giây giữa mỗi request để tránh bị chặn IP.

## Dữ liệu Seed mặc định

Khi server seed, nó tạo:
- **Admin user**: `admin@example.com` / `admin123`
- **Regular user**: `user@example.com` / `user123`
- **Shop**: TikiMall Shop
- **Categories, Brands, Products, Reviews**: Từ dữ liệu đã scrape
- **Coupons, Banners, FAQ, Blog posts**: Dữ liệu mẫu
- **Gift cards, Flash sales, Shipping zones**: Dữ liệu mẫu

## Troubleshooting

### Scraper không lấy được dữ liệu
- Kiểm tra kết nối internet
- Tiki/Shopee có thể chặn IP → Dùng `--fallback`
- **Shopee chặn API 403**: Shopee yêu cầu cookie/auth qua browser. Dùng `--tiki-only` để chỉ lấy từ Tiki
- Thử giảm limit: `--limit=2`

### Database không seed
- Kiểm tra database đã migrate: `npx prisma migrate dev`
- Kiểm tra file scraped tồn tại: `ls data/scraped/`
- Kiểm tra database trống (seed chỉ chạy khi chưa có user)
- Muốn seed lại: `npx prisma migrate reset --force` rồi restart server

### Category hiển thị 0 sản phẩm
Đảm bảo đang dùng phiên bản mới nhất của `category.service.ts` và `product.service.ts` — đã fix để count products từ cả danh mục con.
