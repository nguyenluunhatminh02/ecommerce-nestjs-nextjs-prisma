#!/usr/bin/env node
'use strict';

/**
 * E-Commerce Data Scraper (Tiki + Shopee)
 * Fetches real product data from Tiki.vn and Shopee.vn for realistic seed data.
 *
 * Usage:
 *   node scripts/scrape-data.js              # Scrape from both Tiki + Shopee
 *   node scripts/scrape-data.js --limit=5    # Limit products per subcategory per source
 *   node scripts/scrape-data.js --tiki-only  # Only scrape Tiki
 *   node scripts/scrape-data.js --shopee-only # Only scrape Shopee
 *   node scripts/scrape-data.js --fallback   # Use DummyJSON if scrapers fail
 *
 * Output: data/scraped/*.json
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// CONFIGURATION
// ============================================================

const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'scraped');
const DELAY_MS = 2000;
const MAX_RETRIES = 3;
const VND_TO_USD = 25500;

const args = process.argv.slice(2);
const PRODUCTS_PER_SUBCAT = (() => {
  const limArg = args.find(a => a.startsWith('--limit='));
  return limArg ? parseInt(limArg.split('=')[1], 10) : 3;
})();
const USE_FALLBACK = args.includes('--fallback');
const TIKI_ONLY = args.includes('--tiki-only');
const SHOPEE_ONLY = args.includes('--shopee-only');
const SCRAPE_TIKI = !SHOPEE_ONLY;
const SCRAPE_SHOPEE = !TIKI_ONLY;
const REVIEWS_PER_PRODUCT = 8;

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8',
        },
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.warn(`  [!] Attempt ${attempt}/${retries} for ${url.substring(0, 80)}... : ${err.message}`);
      if (attempt < retries) await sleep(DELAY_MS * 2);
    }
  }
  return null;
}

function vndToUsd(vnd) {
  if (!vnd || vnd <= 0) return 0;
  return Math.round((vnd / VND_TO_USD) * 100) / 100;
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function makeSlug(text) {
  return text
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 200);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ============================================================
// CATEGORY & SEARCH CONFIG
// ============================================================

const CATEGORY_CONFIG = [
  {
    name: 'Electronics',
    featured: true,
    children: [
      { name: 'Smartphones', queries: ['iphone 15 pro', 'samsung galaxy s24', 'xiaomi 14 pro', 'oppo find x7'] },
      { name: 'Laptops', queries: ['macbook pro m3', 'dell xps 15', 'asus zenbook 14', 'lenovo thinkpad x1'] },
      { name: 'Tablets', queries: ['ipad air m2', 'samsung galaxy tab s9', 'xiaomi pad 6'] },
      { name: 'Headphones', queries: ['sony wh-1000xm5', 'airpods pro 2', 'jbl tune 770nc', 'bose quietcomfort'] },
      { name: 'Cameras', queries: ['canon eos r6', 'sony alpha a7', 'fujifilm x-t5'] },
      { name: 'Smartwatches', queries: ['apple watch series 9', 'samsung galaxy watch 6', 'garmin venu 3'] },
      { name: 'Speakers', queries: ['jbl charge 5', 'marshall stanmore', 'bose soundlink flex'] },
      { name: 'Gaming Consoles', queries: ['playstation 5', 'nintendo switch oled', 'xbox series x'] },
    ],
  },
  {
    name: 'Fashion',
    featured: true,
    children: [
      { name: "Men's Clothing", queries: ['áo polo nam', 'áo sơ mi nam cao cấp', 'áo khoác nam', 'quần jean nam'] },
      { name: "Women's Clothing", queries: ['đầm nữ công sở', 'áo kiểu nữ', 'chân váy nữ', 'áo dài nữ'] },
      { name: 'Shoes', queries: ['giày nike air max', 'giày adidas ultraboost', 'giày converse', 'giày new balance'] },
      { name: 'Accessories', queries: ['kính mát rayban', 'đồng hồ casio', 'thắt lưng da nam'] },
      { name: 'Jewelry', queries: ['vòng tay bạc', 'dây chuyền vàng', 'nhẫn bạc'] },
      { name: 'Bags', queries: ['túi xách nữ', 'balo laptop', 'túi đeo chéo nam'] },
      { name: 'Underwear', queries: ['áo lót nam', 'quần lót cotton'] },
    ],
  },
  {
    name: 'Home & Kitchen',
    featured: true,
    children: [
      { name: 'Furniture', queries: ['bàn làm việc', 'ghế công thái học', 'kệ sách gỗ', 'tủ quần áo'] },
      { name: 'Kitchen Appliances', queries: ['nồi chiên không dầu', 'máy pha cà phê', 'máy xay sinh tố philips'] },
      { name: 'Home Decor', queries: ['đèn trang trí', 'tranh treo tường', 'gương trang trí'] },
      { name: 'Bedding', queries: ['chăn ga gối', 'nệm cao su', 'gối ngủ latex'] },
      { name: 'Lighting', queries: ['đèn led âm trần', 'đèn bàn học', 'đèn ngủ'] },
      { name: 'Storage', queries: ['tủ lưu trữ', 'hộp đựng đồ', 'giá để giày'] },
      { name: 'Cleaning', queries: ['robot hút bụi', 'máy hút bụi dyson', 'máy lau nhà'] },
    ],
  },
  {
    name: 'Sports & Outdoors',
    featured: true,
    children: [
      { name: 'Fitness Equipment', queries: ['máy chạy bộ', 'tạ tay', 'ghế tập gym'] },
      { name: 'Camping Gear', queries: ['lều cắm trại', 'túi ngủ', 'bếp gas mini'] },
      { name: 'Cycling', queries: ['xe đạp thể thao', 'mũ bảo hiểm xe đạp'] },
      { name: 'Running', queries: ['giày chạy bộ', 'đồng hồ chạy bộ garmin'] },
      { name: 'Yoga', queries: ['thảm yoga', 'bộ đồ tập yoga nữ'] },
      { name: 'Swimming', queries: ['kính bơi', 'quần bơi nam', 'áo phao'] },
      { name: 'Team Sports', queries: ['bóng đá adidas', 'vợt cầu lông yonex'] },
    ],
  },
  {
    name: 'Beauty & Health',
    featured: true,
    children: [
      { name: 'Skincare', queries: ['serum vitamin c', 'kem chống nắng', 'sữa rửa mặt cerave'] },
      { name: 'Makeup', queries: ['son mac', 'phấn nền', 'mascara'] },
      { name: 'Hair Care', queries: ['dầu gội head shoulders', 'máy sấy tóc', 'dầu dưỡng tóc'] },
      { name: 'Supplements', queries: ['vitamin tổng hợp', 'omega 3', 'collagen'] },
      { name: 'Personal Care', queries: ['bàn chải điện oral-b', 'máy cạo râu philips'] },
      { name: 'Perfumes', queries: ['nước hoa nam', 'nước hoa nữ chanel'] },
      { name: 'Medical Devices', queries: ['máy đo huyết áp', 'nhiệt kế điện tử'] },
    ],
  },
  {
    name: 'Books & Stationery',
    featured: true,
    children: [
      { name: 'Fiction', queries: ['tiểu thuyết', 'truyện trinh thám', 'sách văn học'] },
      { name: 'Non-Fiction', queries: ['sách self-help', 'sách kinh doanh', 'sách tâm lý'] },
      { name: 'Textbooks', queries: ['sách giáo khoa', 'sách luyện thi ielts'] },
      { name: 'Notebooks', queries: ['sổ tay', 'vở viết campus'] },
      { name: 'Art Supplies', queries: ['bút màu', 'bộ vẽ tranh'] },
      { name: 'Office Supplies', queries: ['bút bi thiên long', 'giấy in a4'] },
    ],
  },
  {
    name: 'Toys & Games',
    featured: false,
    children: [
      { name: 'Board Games', queries: ['cờ vua', 'board game', 'đồ chơi xếp hình'] },
      { name: 'Action Figures', queries: ['mô hình figure', 'lego technic'] },
      { name: 'Puzzles', queries: ['rubik', 'puzzle 1000 mảnh'] },
      { name: 'Educational Toys', queries: ['đồ chơi steam', 'robot lập trình'] },
      { name: 'Dolls', queries: ['búp bê barbie', 'gấu bông'] },
      { name: 'Outdoor Toys', queries: ['xe scooter trẻ em', 'ván trượt'] },
    ],
  },
  {
    name: 'Automotive',
    featured: false,
    children: [
      { name: 'Car Electronics', queries: ['camera hành trình', 'màn hình ô tô'] },
      { name: 'Car Care', queries: ['nước rửa xe', 'máy hút bụi ô tô'] },
      { name: 'Interior Accessories', queries: ['bọc ghế ô tô', 'nước hoa ô tô'] },
      { name: 'Exterior Parts', queries: ['đèn led ô tô', 'gạt mưa ô tô'] },
      { name: 'Tools', queries: ['bộ dụng cụ sửa xe', 'kích xe hơi'] },
      { name: 'Tires', queries: ['lốp xe ô tô', 'lốp xe máy'] },
    ],
  },
  {
    name: 'Food & Beverages',
    featured: false,
    children: [
      { name: 'Snacks', queries: ['bánh snack', 'hạt dinh dưỡng', 'bánh quy'] },
      { name: 'Coffee & Tea', queries: ['cà phê nguyên chất', 'trà oolong', 'cà phê hòa tan'] },
      { name: 'Organic Food', queries: ['thực phẩm hữu cơ', 'gạo lứt', 'mật ong nguyên chất'] },
      { name: 'Dried Fruits', queries: ['trái cây sấy', 'xoài sấy dẻo'] },
      { name: 'Sauces', queries: ['nước mắm phú quốc', 'tương ớt'] },
      { name: 'Beverages', queries: ['nước ép trái cây', 'sữa tươi vinamilk'] },
    ],
  },
  {
    name: 'Baby & Kids',
    featured: false,
    children: [
      { name: 'Baby Clothing', queries: ['quần áo trẻ em', 'body suit bé'] },
      { name: 'Diapers', queries: ['tã dán bobby', 'bỉm pampers'] },
      { name: 'Baby Toys', queries: ['đồ chơi trẻ em', 'xe tập đi'] },
      { name: 'Strollers', queries: ['xe đẩy trẻ em', 'nôi em bé'] },
      { name: 'Feeding', queries: ['bình sữa pigeon', 'máy hút sữa'] },
      { name: 'Nursery', queries: ['đèn ngủ em bé', 'máy tạo ẩm'] },
    ],
  },
  {
    name: 'Pet Supplies',
    featured: false,
    children: [
      { name: 'Dog Food', queries: ['thức ăn chó royal canin', 'hạt cho chó'] },
      { name: 'Cat Food', queries: ['thức ăn mèo whiskas', 'pate mèo'] },
      { name: 'Pet Accessories', queries: ['vòng cổ chó', 'lồng mèo'] },
      { name: 'Pet Toys', queries: ['đồ chơi cho chó', 'trụ cào mèo'] },
      { name: 'Aquarium', queries: ['bể cá mini', 'máy lọc nước bể cá'] },
      { name: 'Pet Health', queries: ['thuốc trị ve chó', 'sữa tắm thú cưng'] },
    ],
  },
  {
    name: 'Garden & Outdoor',
    featured: false,
    children: [
      { name: 'Plants', queries: ['cây cảnh để bàn', 'hạt giống rau'] },
      { name: 'Garden Tools', queries: ['kéo cắt tỉa cây', 'bình tưới cây'] },
      { name: 'Outdoor Furniture', queries: ['bàn ghế sân vườn', 'ghế xếp'] },
      { name: 'Grills', queries: ['bếp nướng than', 'vỉ nướng inox'] },
      { name: 'Irrigation', queries: ['hệ thống tưới tự động', 'ống tưới vườn'] },
      { name: 'Pest Control', queries: ['bẫy chuột', 'thuốc diệt côn trùng'] },
    ],
  },
];

// ============================================================
// TIKI.VN SCRAPER
// ============================================================

async function searchTikiProducts(query, limit = 10) {
  const url = `https://tiki.vn/api/v2/products?q=${encodeURIComponent(query)}&limit=${limit}&page=1&sort=top_seller`;
  const data = await fetchJson(url);
  if (!data || !data.data) return [];
  return data.data;
}

async function getTikiProductDetail(productId) {
  const url = `https://tiki.vn/api/v2/products/${productId}`;
  const data = await fetchJson(url);
  return data;
}

async function getTikiReviews(productId, limit = 5) {
  const url = `https://tiki.vn/api/v2/reviews?product_id=${productId}&sort=score%7Cdesc&page=1&limit=${limit}&include=comments`;
  const data = await fetchJson(url);
  if (!data || !data.data) return [];
  return data.data;
}

function transformTikiProduct(listing, detail, categoryName, subcategoryName) {
  const price = vndToUsd(detail?.price || listing.price);
  const comparePrice = vndToUsd(detail?.list_price || detail?.original_price || listing.original_price || listing.list_price);
  const costPrice = Math.round(price * 0.6 * 100) / 100;

  const images = [];
  if (detail?.images && Array.isArray(detail.images)) {
    for (const img of detail.images) {
      const url = img.large_url || img.base_url || img.medium_url;
      if (url) images.push(url);
    }
  }
  if (images.length === 0 && listing.thumbnail_url) {
    images.push(listing.thumbnail_url);
  }

  const brandName = detail?.brand?.name || listing.brand_name || 'Generic';

  // Get short description
  let shortDesc = '';
  if (detail?.short_description) {
    shortDesc = stripHtml(detail.short_description).substring(0, 250);
  }
  if (!shortDesc && detail?.description) {
    shortDesc = stripHtml(detail.description).substring(0, 250);
  }
  if (!shortDesc) {
    shortDesc = listing.name;
  }

  // Get full description
  let fullDesc = '';
  if (detail?.description) {
    fullDesc = stripHtml(detail.description).substring(0, 3000);
  }
  if (!fullDesc) {
    fullDesc = shortDesc;
  }

  // Get specifications
  const specs = {};
  if (detail?.specifications) {
    for (const group of detail.specifications) {
      if (group.attributes) {
        for (const attr of group.attributes) {
          if (attr.name && attr.value) {
            specs[attr.name] = attr.value;
          }
        }
      }
    }
  }

  return {
    name: listing.name || detail?.name || 'Unknown Product',
    description: fullDesc,
    short_description: shortDesc,
    price: price > 0 ? price : 9.99,
    compare_at_price: comparePrice > price ? comparePrice : Math.round(price * 1.2 * 100) / 100,
    cost_price: costPrice,
    category: categoryName,
    subcategory: subcategoryName,
    brand: brandName,
    images,
    rating: detail?.rating_average || listing.rating_average || 0,
    review_count: detail?.review_count || listing.review_count || 0,
    sales_count: detail?.all_time_quantity_sold || listing.quantity_sold?.value || 0,
    specifications: specs,
    source: 'tiki',
    tiki_id: listing.id,
  };
}

function transformTikiReview(review) {
  return {
    rating: review.rating || 5,
    comment: review.content || review.title || '',
    reviewer_name: review.created_by?.name || 'Anonymous',
    helpful_count: review.thank_count || 0,
    created_at: review.created_at ? new Date(review.created_at * 1000).toISOString() : new Date().toISOString(),
  };
}

// ============================================================
// SHOPEE.VN SCRAPER
// ============================================================

async function searchShopeeProducts(query, limit = 10) {
  const url = `https://shopee.vn/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(query)}&limit=${limit}&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`;
  const data = await fetchJson(url);
  if (!data || !data.items) return [];
  return data.items.map(item => item.item_basic || item).filter(Boolean);
}

async function getShopeeProductDetail(shopId, itemId) {
  const url = `https://shopee.vn/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`;
  const data = await fetchJson(url);
  return data?.data || data?.item || null;
}

async function getShopeeReviews(shopId, itemId, limit = 6) {
  const url = `https://shopee.vn/api/v2/item/get_ratings?exclude_filter=1&filter=0&flag=1&itemid=${itemId}&limit=${limit}&offset=0&shopid=${shopId}&type=0`;
  const data = await fetchJson(url);
  if (!data || !data.data?.ratings) return [];
  return data.data.ratings;
}

function transformShopeeProduct(item, detail, categoryName, subcategoryName) {
  // Shopee prices are in VND * 100000
  const rawPrice = (detail?.price || item.price || 0) / 100000;
  const rawOriginalPrice = (detail?.price_before_discount || item.price_before_discount || 0) / 100000;
  const price = vndToUsd(rawPrice);
  const comparePrice = rawOriginalPrice > rawPrice ? vndToUsd(rawOriginalPrice) : Math.round(price * 1.2 * 100) / 100;
  const costPrice = Math.round(price * 0.55 * 100) / 100;

  const images = [];
  const imageList = detail?.images || item.images || [];
  for (const imgHash of imageList) {
    if (imgHash) {
      images.push(`https://down-vn.img.susercontent.com/file/${imgHash}`);
    }
  }

  const brandName = detail?.brand || item.brand || 'Generic';
  const name = detail?.name || item.name || 'Unknown Product';
  const desc = detail?.description || item.description || name;

  return {
    name,
    description: stripHtml(desc).substring(0, 3000) || name,
    short_description: stripHtml(desc).substring(0, 250) || name,
    price: price > 0 ? price : 9.99,
    compare_at_price: comparePrice,
    cost_price: costPrice,
    category: categoryName,
    subcategory: subcategoryName,
    brand: brandName !== 'Generic' ? brandName : (extractBrandFromName(name) || 'Generic'),
    images,
    rating: detail?.item_rating?.rating_star || item.item_rating?.rating_star || (item.shopee_verified ? 4.5 : 0),
    review_count: detail?.cmt_count || item.cmt_count || 0,
    sales_count: detail?.historical_sold || item.historical_sold || item.sold || 0,
    specifications: {},
    source: 'shopee',
    shopee_id: item.itemid,
    shopee_shop_id: item.shopid,
  };
}

function extractBrandFromName(name) {
  // Try to extract brand from product name (common patterns)
  const knownBrands = ['Samsung', 'Apple', 'Xiaomi', 'Sony', 'LG', 'Philips', 'Nike', 'Adidas', 'Unilever', 'P&G',
    'Canon', 'Nikon', 'Dell', 'HP', 'Asus', 'Lenovo', 'JBL', 'Bose', 'Panasonic', 'Sharp', 'Toshiba',
    'Logitech', 'Dyson', 'Bosch', 'Makita', 'DeWalt', 'Nintendo', 'UNO', 'LEGO', 'Colgate', 'Oral-B'];
  for (const brand of knownBrands) {
    if (name.toLowerCase().includes(brand.toLowerCase())) return brand;
  }
  return null;
}

function transformShopeeReview(review) {
  return {
    rating: review.rating_star || 5,
    comment: review.comment || '',
    reviewer_name: review.author_username || review.author_shopid?.toString() || 'Shopee User',
    helpful_count: review.like_count || 0,
    created_at: review.ctime ? new Date(review.ctime * 1000).toISOString() : new Date().toISOString(),
  };
}

// ============================================================
// DUMMYJSON FALLBACK
// ============================================================

async function fetchDummyJsonProducts() {
  console.log('\n[Fallback] Using DummyJSON as data source...');
  const data = await fetchJson('https://dummyjson.com/products?limit=100');
  if (!data || !data.products) return { products: [], reviews: [] };

  // Map DummyJSON categories to our categories
  const catMap = {
    smartphones: { cat: 'Electronics', sub: 'Smartphones' },
    laptops: { cat: 'Electronics', sub: 'Laptops' },
    tablets: { cat: 'Electronics', sub: 'Tablets' },
    'mobile-accessories': { cat: 'Electronics', sub: 'Headphones' },
    fragrances: { cat: 'Beauty & Health', sub: 'Perfumes' },
    skincare: { cat: 'Beauty & Health', sub: 'Skincare' },
    groceries: { cat: 'Food & Beverages', sub: 'Snacks' },
    'home-decoration': { cat: 'Home & Kitchen', sub: 'Home Decor' },
    furniture: { cat: 'Home & Kitchen', sub: 'Furniture' },
    tops: { cat: 'Fashion', sub: "Women's Clothing" },
    'womens-dresses': { cat: 'Fashion', sub: "Women's Clothing" },
    'womens-shoes': { cat: 'Fashion', sub: 'Shoes' },
    'mens-shirts': { cat: 'Fashion', sub: "Men's Clothing" },
    'mens-shoes': { cat: 'Fashion', sub: 'Shoes' },
    'mens-watches': { cat: 'Fashion', sub: 'Accessories' },
    'womens-watches': { cat: 'Fashion', sub: 'Accessories' },
    'womens-bags': { cat: 'Fashion', sub: 'Bags' },
    'womens-jewellery': { cat: 'Fashion', sub: 'Jewelry' },
    sunglasses: { cat: 'Fashion', sub: 'Accessories' },
    automotive: { cat: 'Automotive', sub: 'Car Care' },
    motorcycle: { cat: 'Automotive', sub: 'Exterior Parts' },
    lighting: { cat: 'Home & Kitchen', sub: 'Lighting' },
    'kitchen-accessories': { cat: 'Home & Kitchen', sub: 'Kitchen Appliances' },
    'sports-accessories': { cat: 'Sports & Outdoors', sub: 'Fitness Equipment' },
    vehicle: { cat: 'Automotive', sub: 'Car Electronics' },
    beauty: { cat: 'Beauty & Health', sub: 'Skincare' },
  };

  const products = [];
  const reviews = [];

  for (const p of data.products) {
    const mapped = catMap[p.category] || { cat: 'Electronics', sub: 'Smartphones' };
    products.push({
      name: p.title,
      description: p.description,
      short_description: p.description.substring(0, 200),
      price: p.price,
      compare_at_price: Math.round(p.price / (1 - (p.discountPercentage || 10) / 100) * 100) / 100,
      cost_price: Math.round(p.price * 0.6 * 100) / 100,
      category: mapped.cat,
      subcategory: mapped.sub,
      brand: p.brand || 'Generic',
      images: p.images || [p.thumbnail],
      rating: p.rating || 4.0,
      review_count: p.reviews?.length || 0,
      sales_count: Math.floor(Math.random() * 500),
      specifications: {},
      source: 'dummyjson',
    });

    if (p.reviews) {
      for (const r of p.reviews) {
        reviews.push({
          product_name: p.title,
          rating: r.rating,
          comment: r.comment,
          reviewer_name: r.reviewerName,
          helpful_count: Math.floor(Math.random() * 20),
          created_at: r.date,
        });
      }
    }
  }

  return { products, reviews };
}

// ============================================================
// MAIN SCRAPER
// ============================================================

async function scrapeSource(sourceName, searchFn, detailFn, reviewFn, transformFn, transformReviewFn) {
  console.log(`\n--- Scraping from ${sourceName} ---`);

  const allProducts = [];
  const allReviews = [];
  const allBrands = new Map();
  const catChildrenMap = new Map(); // catName -> [childData]
  const seenIds = new Set();

  for (const catConfig of CATEGORY_CONFIG) {
    console.log(`\n[${sourceName}][Category] ${catConfig.name}`);
    if (!catChildrenMap.has(catConfig.name)) catChildrenMap.set(catConfig.name, new Map());

    for (const subcat of catConfig.children) {
      console.log(`  [Sub] ${subcat.name}`);
      let subcatProducts = [];

      for (const query of subcat.queries) {
        if (subcatProducts.length >= PRODUCTS_PER_SUBCAT) break;

        console.log(`    Searching: "${query}"`);
        await sleep(DELAY_MS);

        const listings = await searchFn(query, PRODUCTS_PER_SUBCAT + 2);
        if (!listings || listings.length === 0) {
          console.log(`    -> No results`);
          continue;
        }

        for (const listing of listings) {
          if (subcatProducts.length >= PRODUCTS_PER_SUBCAT) break;
          const itemId = listing.id || listing.itemid || listing.item_basic?.itemid;
          if (!itemId || seenIds.has(`${sourceName}-${itemId}`)) continue;
          seenIds.add(`${sourceName}-${itemId}`);

          const itemName = listing.name || listing.item_basic?.name || '';
          console.log(`    Fetching detail: ${itemName.substring(0, 50)}...`);
          await sleep(DELAY_MS);

          let detail = null;
          if (sourceName === 'Shopee') {
            const shopId = listing.shopid || listing.item_basic?.shopid;
            detail = await detailFn(shopId, itemId);
          } else {
            detail = await detailFn(itemId);
          }

          const product = transformFn(listing, detail, catConfig.name, subcat.name);
          if (product.price <= 0) continue;
          subcatProducts.push(product);

          // Track brand
          if (product.brand && product.brand !== 'Generic') {
            if (!allBrands.has(product.brand)) {
              const brandInfo = (sourceName === 'Tiki' ? detail?.brand : null) || {};
              allBrands.set(product.brand, {
                name: product.brand,
                slug: makeSlug(product.brand),
                description: `${product.brand} - Quality products`,
                logo_url: brandInfo.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.brand)}&background=random&size=200`,
                website: brandInfo.url || '',
              });
            }
          }

          // Get reviews
          console.log(`    Fetching reviews...`);
          await sleep(DELAY_MS);
          let reviews = [];
          if (sourceName === 'Shopee') {
            const shopId = listing.shopid || listing.item_basic?.shopid;
            reviews = await reviewFn(shopId, itemId, REVIEWS_PER_PRODUCT);
          } else {
            reviews = await reviewFn(itemId, REVIEWS_PER_PRODUCT);
          }
          for (const review of reviews) {
            const transformed = transformReviewFn(review);
            if (transformed.comment) {
              allReviews.push({ ...transformed, product_name: product.name });
            }
          }
        }
      }

      console.log(`  -> ${subcatProducts.length} products from ${sourceName} for ${subcat.name}`);
      allProducts.push(...subcatProducts);

      const existing = catChildrenMap.get(catConfig.name);
      if (!existing.has(subcat.name)) {
        existing.set(subcat.name, {
          name: subcat.name,
          description: `${subcat.name} products`,
          image_url: subcatProducts[0]?.images?.[0] || `https://placehold.co/400x300?text=${encodeURIComponent(subcat.name)}`,
        });
      }
    }
  }

  // Build categories structure
  const categories = CATEGORY_CONFIG.map(catConfig => ({
    name: catConfig.name,
    featured: catConfig.featured,
    description: `${catConfig.name} products`,
    image_url: allProducts.find((p) => p.category === catConfig.name)?.images?.[0] || `https://placehold.co/400x300?text=${encodeURIComponent(catConfig.name)}`,
    children: [...(catChildrenMap.get(catConfig.name)?.values() || [])],
  }));

  return { products: allProducts, reviews: allReviews, brands: [...allBrands.values()], categories };
}

function mergeData(base, extra) {
  // Merge products (deduplicate by name similarity)
  const nameSet = new Set(base.products.map(p => p.name.toLowerCase().trim()));
  for (const p of extra.products) {
    if (!nameSet.has(p.name.toLowerCase().trim())) {
      base.products.push(p);
      nameSet.add(p.name.toLowerCase().trim());
    }
  }

  // Merge reviews
  base.reviews.push(...extra.reviews);

  // Merge brands
  const existingBrands = new Set(base.brands.map(b => b.name));
  for (const b of extra.brands) {
    if (!existingBrands.has(b.name)) {
      base.brands.push(b);
      existingBrands.add(b.name);
    }
  }

  // Merge categories (keep base structure, just update images if missing)
  const baseCatMap = new Map(base.categories.map(c => [c.name, c]));
  for (const ec of extra.categories) {
    if (!baseCatMap.has(ec.name)) {
      base.categories.push(ec);
    } else {
      const baseCat = baseCatMap.get(ec.name);
      const existingChildNames = new Set(baseCat.children.map(ch => ch.name));
      for (const ch of ec.children) {
        if (!existingChildNames.has(ch.name)) {
          baseCat.children.push(ch);
        }
      }
    }
  }

  return base;
}

async function main() {
  console.log('============================================');
  console.log('  E-Commerce Data Scraper (Tiki + Shopee)');
  console.log('============================================');
  console.log(`Products per subcategory per source: ${PRODUCTS_PER_SUBCAT}`);
  console.log(`Reviews per product: ${REVIEWS_PER_PRODUCT}`);
  console.log(`Sources: ${SCRAPE_TIKI ? 'Tiki' : ''}${SCRAPE_TIKI && SCRAPE_SHOPEE ? ' + ' : ''}${SCRAPE_SHOPEE ? 'Shopee' : ''}${USE_FALLBACK ? 'DummyJSON (fallback)' : ''}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log('');

  ensureDir(OUTPUT_DIR);

  let data = { products: [], reviews: [], brands: [], categories: [] };

  if (USE_FALLBACK) {
    const fallbackData = await fetchDummyJsonProducts();
    data = {
      products: fallbackData.products,
      reviews: fallbackData.reviews,
      brands: extractBrandsFromProducts(fallbackData.products),
      categories: extractCategoriesFromProducts(fallbackData.products),
    };
  } else {
    // Scrape from Tiki
    if (SCRAPE_TIKI) {
      const tikiData = await scrapeSource(
        'Tiki', searchTikiProducts, getTikiProductDetail, getTikiReviews, transformTikiProduct, transformTikiReview
      );
      data = mergeData(data, tikiData);
      console.log(`\n[Tiki] Total: ${tikiData.products.length} products, ${tikiData.reviews.length} reviews`);
    }

    // Scrape from Shopee
    if (SCRAPE_SHOPEE) {
      const shopeeData = await scrapeSource(
        'Shopee', searchShopeeProducts, getShopeeProductDetail, getShopeeReviews, transformShopeeProduct, transformShopeeReview
      );
      data = mergeData(data, shopeeData);
      console.log(`\n[Shopee] Total: ${shopeeData.products.length} products, ${shopeeData.reviews.length} reviews`);
    }

    // If both sources returned very few products, supplement with DummyJSON
    if (data.products.length < 20) {
      console.log(`\n[Warning] Only ${data.products.length} products. Supplementing with DummyJSON...`);
      const fallbackData = await fetchDummyJsonProducts();
      const fbData = {
        products: fallbackData.products,
        reviews: fallbackData.reviews,
        brands: extractBrandsFromProducts(fallbackData.products),
        categories: extractCategoriesFromProducts(fallbackData.products),
      };
      data = mergeData(data, fbData);
    }
  }

  // Save results
  console.log('\n============================================');
  console.log('  Saving scraped data');
  console.log('============================================');

  fs.writeFileSync(path.join(OUTPUT_DIR, 'categories.json'), JSON.stringify(data.categories, null, 2), 'utf8');
  console.log(`  categories.json: ${data.categories.length} categories`);

  fs.writeFileSync(path.join(OUTPUT_DIR, 'brands.json'), JSON.stringify(data.brands, null, 2), 'utf8');
  console.log(`  brands.json: ${data.brands.length} brands`);

  fs.writeFileSync(path.join(OUTPUT_DIR, 'products.json'), JSON.stringify(data.products, null, 2), 'utf8');
  console.log(`  products.json: ${data.products.length} products`);

  fs.writeFileSync(path.join(OUTPUT_DIR, 'reviews.json'), JSON.stringify(data.reviews, null, 2), 'utf8');
  console.log(`  reviews.json: ${data.reviews.length} reviews`);

  // Summary
  console.log('\n============================================');
  console.log('  Scraping Complete!');
  console.log('============================================');
  console.log(`  Total products: ${data.products.length}`);
  console.log(`  Total reviews: ${data.reviews.length}`);
  console.log(`  Total brands: ${data.brands.length}`);
  console.log(`  Total categories: ${data.categories.length} (${data.categories.reduce((s, c) => s + c.children.length, 0)} subcategories)`);
  const sourceBreakdown = {};
  for (const p of data.products) { sourceBreakdown[p.source || 'unknown'] = (sourceBreakdown[p.source || 'unknown'] || 0) + 1; }
  console.log(`  Sources: ${Object.entries(sourceBreakdown).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
  console.log(`\n  Output: ${OUTPUT_DIR}`);
  console.log(`\n  Next step: Restart your NestJS server to seed with scraped data.`);
}

// Helper: extract unique brands from products
function extractBrandsFromProducts(products) {
  const brands = new Map();
  for (const p of products) {
    if (p.brand && p.brand !== 'Generic' && !brands.has(p.brand)) {
      brands.set(p.brand, {
        name: p.brand,
        slug: makeSlug(p.brand),
        description: `${p.brand} - Quality products`,
        logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.brand)}&background=random&size=200`,
        website: '',
      });
    }
  }
  return [...brands.values()];
}

// Helper: extract category structure from products
function extractCategoriesFromProducts(products) {
  const catMap = new Map();
  for (const p of products) {
    if (!catMap.has(p.category)) {
      catMap.set(p.category, {
        name: p.category,
        featured: ['Electronics', 'Fashion', 'Home & Kitchen', 'Sports & Outdoors', 'Beauty & Health', 'Books & Stationery'].includes(p.category),
        description: `${p.category} products`,
        image_url: p.images?.[0] || `https://placehold.co/400x300?text=${encodeURIComponent(p.category)}`,
        children: new Map(),
      });
    }
    const cat = catMap.get(p.category);
    if (p.subcategory && !cat.children.has(p.subcategory)) {
      cat.children.set(p.subcategory, {
        name: p.subcategory,
        description: `${p.subcategory} products`,
        image_url: p.images?.[0] || `https://placehold.co/400x300?text=${encodeURIComponent(p.subcategory)}`,
      });
    }
  }
  return [...catMap.values()].map((c) => ({
    ...c,
    children: [...c.children.values()],
  }));
}

main().catch((err) => {
  console.error('Scraper failed:', err);
  process.exit(1);
});
