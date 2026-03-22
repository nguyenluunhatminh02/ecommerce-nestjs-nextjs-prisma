// @ts-nocheck
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { generateSlug } from '../common/utils/slug.util';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const userCount = await this.prisma.users.count();
      if (userCount > 0) {
        this.logger.log('Database already seeded. Skipping...');
        return;
      }
      this.logger.log('Seeding database...');
      await this.seed();
      this.logger.log('Database seeding completed!');
    } catch (error) {
      this.logger.error(`Seed failed: ${error.message}. App will continue without seed data.`);
    }
  }

  private rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  private randFloat(min: number, max: number) { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }
  private pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

  private loadScrapedData(fileName: string): any | null {
    const filePath = path.join(__dirname, '..', '..', 'data', 'scraped', fileName);
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        if (Array.isArray(data) && data.length > 0) {
          this.logger.log(`Loaded scraped data from ${fileName}: ${data.length} items`);
          return data;
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to load scraped data from ${fileName}: ${err.message}`);
    }
    return null;
  }

  async seed() {
    // ========== USERS ==========
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    const sellerHash = await bcrypt.hash('Seller123!', 10);
    const customerHash = await bcrypt.hash('Customer123!', 10);

    const admin = await this.prisma.users.create({
      data: {
        first_name: 'System', last_name: 'Admin', email: 'admin@ecommerce.com', password: passwordHash,
        email_verified: true, is_active: true, phone: '0901000000', provider: 'LOCAL',
        avatar_url: 'https://ui-avatars.com/api/?name=Admin&background=random',
      },
    });
    // Create roles
    const adminRole = await this.prisma.roles.create({ data: { name: 'ADMIN' } });
    const userRole = await this.prisma.roles.create({ data: { name: 'USER' } });
    const sellerRole = await this.prisma.roles.create({ data: { name: 'SELLER' } });
    await this.prisma.user_roles.create({ data: { users_id: admin.id, roles_id: adminRole.id } });

    await this.prisma.users.create({
      data: {
        first_name: 'Super', last_name: 'Admin', email: 'superadmin@ecommerce.com', password: passwordHash,
        email_verified: true, is_active: true, phone: '0901000001', provider: 'LOCAL',
        avatar_url: 'https://ui-avatars.com/api/?name=Super+Admin&background=random',
      },
    });

    const sellers: any[] = [];
    const sellerNames = ['TechWorld Owner', 'FashionHub Owner', 'HomeStyle Owner', 'SportZone Owner',
      'BeautyBox Owner', 'BookWorm Owner', 'KiddieLand Owner', 'AutoParts Owner', 'GourmetShop Owner',
      'BabyParadise Owner', 'GadgetPro Owner', 'StyleVault Owner', 'GreenGarden Owner', 'PetLovers Owner', 'FitLife Owner'];
    for (let i = 1; i <= 15; i++) {
      const names = sellerNames[i-1].split(' ');
      const seller = await this.prisma.users.create({
        data: {
          first_name: names[0], last_name: names.slice(1).join(' '), email: `seller${i}@ecommerce.com`, password: sellerHash,
          email_verified: true, is_active: true, phone: `090200000${i.toString().padStart(2, '0')}`, provider: 'LOCAL',
          avatar_url: `https://ui-avatars.com/api/?name=Seller+${i}&background=random`,
        },
      });
      await this.prisma.user_roles.create({ data: { users_id: seller.id, roles_id: sellerRole.id } });
      sellers.push(seller);
    }

    const customers: any[] = [];
    const firstNames = ['Minh', 'Linh', 'Hung', 'Trang', 'Dung', 'Mai', 'Tuan', 'Ha', 'Long', 'Ngoc',
      'Phuc', 'Anh', 'Nam', 'Thu', 'Duc', 'Lan', 'Bao', 'Yen', 'Khoa', 'Huong',
      'David', 'Sarah', 'Michael', 'Emma', 'James', 'Olivia', 'William', 'Sophia', 'Daniel', 'Ava',
      'Trung', 'Thao', 'Khanh', 'Loan', 'Hai', 'Quynh', 'Vinh', 'Dieu', 'Thanh', 'Phuong',
      'Alex', 'Jessica', 'Brian', 'Emily', 'Kevin', 'Lisa', 'Ryan', 'Amy', 'Jason', 'Nicole'];
    const lastNames = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vu', 'Dang', 'Bui', 'Do', 'Ngo',
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez',
      'Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vu', 'Dang', 'Bui', 'Do', 'Ngo',
      'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Moore', 'Clark',
      'Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vu', 'Dang', 'Bui', 'Do', 'Ngo'];
    for (let i = 1; i <= 50; i++) {
      const fn = firstNames[(i-1) % firstNames.length];
      const ln = lastNames[(i-1) % lastNames.length];
      const customer = await this.prisma.users.create({
        data: {
          first_name: fn, last_name: ln, email: `customer${i}@gmail.com`, password: customerHash,
          email_verified: true, is_active: true, phone: `09030${(i-1).toString().padStart(5, '0')}`, provider: 'LOCAL',
          avatar_url: `https://ui-avatars.com/api/?name=${fn}+${ln}&background=random`,
        },
      });
      await this.prisma.user_roles.create({ data: { users_id: customer.id, roles_id: userRole.id } });
      customers.push(customer);
    }
    this.logger.log(`Created ${2 + sellers.length + customers.length} users`);

    // ========== CATEGORIES ==========
    const scrapedCategories = this.loadScrapedData('categories.json');
    const categoryData: [string, boolean, string[]][] = scrapedCategories
      ? scrapedCategories.map((cat: any) => [cat.name, cat.featured ?? false, (cat.children || []).map((c: any) => c.name)] as [string, boolean, string[]])
      : [
      ['Electronics', true, ['Smartphones', 'Laptops', 'Tablets', 'Headphones', 'Cameras', 'Smartwatches', 'Speakers', 'Gaming Consoles']],
      ['Fashion', true, ["Men's Clothing", "Women's Clothing", 'Shoes', 'Accessories', 'Jewelry', 'Bags', 'Underwear']],
      ['Home & Kitchen', true, ['Furniture', 'Kitchen Appliances', 'Home Decor', 'Bedding', 'Lighting', 'Storage', 'Cleaning']],
      ['Sports & Outdoors', true, ['Fitness Equipment', 'Camping Gear', 'Cycling', 'Running', 'Yoga', 'Swimming', 'Team Sports']],
      ['Beauty & Health', true, ['Skincare', 'Makeup', 'Hair Care', 'Supplements', 'Personal Care', 'Perfumes', 'Medical Devices']],
      ['Books & Stationery', true, ['Fiction', 'Non-Fiction', 'Textbooks', 'Notebooks', 'Art Supplies', 'Office Supplies']],
      ['Toys & Games', false, ['Board Games', 'Action Figures', 'Puzzles', 'Educational Toys', 'Dolls', 'Outdoor Toys']],
      ['Automotive', false, ['Car Electronics', 'Car Care', 'Interior Accessories', 'Exterior Parts', 'Tools', 'Tires']],
      ['Food & Beverages', false, ['Snacks', 'Coffee & Tea', 'Organic Food', 'Dried Fruits', 'Sauces', 'Beverages']],
      ['Baby & Kids', false, ['Baby Clothing', 'Diapers', 'Baby Toys', 'Strollers', 'Feeding', 'Nursery']],
      ['Pet Supplies', false, ['Dog Food', 'Cat Food', 'Pet Accessories', 'Pet Toys', 'Aquarium', 'Pet Health']],
      ['Garden & Outdoor', false, ['Plants', 'Garden Tools', 'Outdoor Furniture', 'Grills', 'Irrigation', 'Pest Control']],
    ];

    const allCategories: any[] = [];
    const parentCategories: any[] = [];
    let catSort = 0;
    // Build a lookup for scraped category images
    const scrapedCatImageMap: Record<string, string> = {};
    if (scrapedCategories) {
      for (const sc of scrapedCategories) {
        if (sc.image_url) scrapedCatImageMap[sc.name] = sc.image_url;
        for (const child of sc.children || []) {
          if (child.image_url) scrapedCatImageMap[child.name] = child.image_url;
        }
      }
    }
    for (const [name, featured, children] of categoryData) {
      const parent = await this.prisma.categories.create({
        data: {
          name, slug: generateSlug(name), description: `${name} products`,
          featured, active: true, sort_order: catSort++,
          image_url: scrapedCatImageMap[name] || `https://placehold.co/400x300?text=${encodeURIComponent(name)}`,
        },
      });
      parentCategories.push(parent);
      allCategories.push(parent);
      let childSort = 0;
      for (const childName of children) {
        const child = await this.prisma.categories.create({
          data: {
            name: childName, slug: generateSlug(childName), description: `${childName} products`,
            featured: childSort < 3, parent_id: parent.id,
            active: true, sort_order: childSort++,
            image_url: scrapedCatImageMap[childName] || `https://placehold.co/400x300?text=${encodeURIComponent(childName)}`,
          },
        });
        allCategories.push(child);
      }
    }
    this.logger.log(`Created ${allCategories.length} categories`);

    // ========== BRANDS ==========
    const scrapedBrands = this.loadScrapedData('brands.json');
    const brands: any[] = [];
    if (scrapedBrands && scrapedBrands.length > 0) {
      const seenSlugs = new Set<string>();
      for (const sb of scrapedBrands) {
        const slug = generateSlug(sb.name);
        if (seenSlugs.has(slug)) continue;
        seenSlugs.add(slug);
        const brand = await this.prisma.brands.upsert({
          where: { slug },
          update: {},
          create: {
            name: sb.name, slug,
            description: sb.description || `${sb.name} - Leading brand`,
            logo_url: sb.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sb.name)}&background=random&size=200`,
            website: sb.website || '',
            active: true,
          },
        });
        brands.push(brand);
      }
    } else {
      const brandNames = ['Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'IKEA', 'Uniqlo', "L'Oreal", 'Canon', 'Bosch',
        'Dyson', 'Xiaomi', 'LG', 'Asus', 'Dell', 'Lenovo', 'Panasonic', 'Philips', 'Zara', 'H&M',
        'Gucci', 'North Face', 'Puma', 'New Balance', 'JBL', 'Logitech', 'Intel', 'AMD', 'MSI', 'Razer'];
      const brandDomains = ['apple.com', 'samsung.com', 'sony.com', 'nike.com', 'adidas.com', 'ikea.com', 'uniqlo.com', 'loreal.com', 'canon.com', 'bosch.com',
        'dyson.com', 'xiaomi.com', 'lg.com', 'asus.com', 'dell.com', 'lenovo.com', 'panasonic.com', 'philips.com', 'zara.com', 'hm.com',
        'gucci.com', 'thenorthface.com', 'puma.com', 'newbalance.com', 'jbl.com', 'logitech.com', 'intel.com', 'amd.com', 'msi.com', 'razer.com'];
      for (let i = 0; i < brandNames.length; i++) {
        const brand = await this.prisma.brands.create({
          data: {
            name: brandNames[i], slug: generateSlug(brandNames[i]),
            description: `${brandNames[i]} - Leading brand`,
            logo_url: `https://logo.clearbit.com/${brandDomains[i]}`,
            active: true,
          },
        });
        brands.push(brand);
      }
    }
    this.logger.log(`Created ${brands.length} brands`);

    // ========== SHOPS ==========
    const shopData = [
      ['TechWorld', 'Premium electronics and gadgets', true, true],
      ['FashionHub', 'Trendy clothing and fashion accessories', true, true],
      ['HomeStyle', 'Home decor and furniture essentials', true, true],
      ['SportZone', 'Sports equipment and activewear', true, true],
      ['BeautyBox', 'Premium skincare and makeup products', true, true],
      ['BookWorm', 'Books, stationery, and educational materials', true, true],
      ['KiddieLand', 'Toys and kids entertainment', true, false],
      ['AutoParts Plus', 'Quality car accessories and parts', true, false],
      ['GourmetShop', 'Premium food and beverages', true, false],
      ['BabyParadise', 'Everything for babies and toddlers', true, false],
      ['GadgetPro', 'Latest tech gadgets and accessories', false, false],
      ['StyleVault', 'Designer fashion and luxury items', false, false],
      ['GreenGarden', 'Plants, seeds, and garden supplies', false, false],
      ['PetLovers', 'Pet food, toys, and accessories', false, false],
      ['FitLife', 'Fitness equipment and supplements', false, false],
    ] as const;
    const shops: any[] = [];
    for (let i = 0; i < shopData.length; i++) {
      const [name, desc, verified, featured] = shopData[i];
      const shop = await this.prisma.shops.create({
        data: {
          name, slug: generateSlug(name) + '-store',
          description: desc, phone: `02800000${(i+1).toString().padStart(2, '0')}`,
          email: `contact@${generateSlug(name)}.com`, address: `${this.rand(1, 999)} Main Street`,
          user_id: sellers[i].id,
          verified, active: true, rating: this.randFloat(3.5, 5.0),
          total_products: 0, total_sales: 0, follower_count: this.rand(100, 10099),
          logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`,
          banner_url: `https://placehold.co/1200x300?text=${encodeURIComponent(name)}`,
        },
      });
      shops.push(shop);
    }
    this.logger.log(`Created ${shops.length} shops`);

    // ========== TAGS ==========
    const tagNames = ['New Arrival', 'Best Seller', 'Featured', 'Sale', 'Limited Edition', 'Trending', 'Popular', 'Eco-Friendly', 'Organic', 'Premium'];
    const tags: any[] = [];
    for (const name of tagNames) {
      tags.push(await this.prisma.tags.create({ data: { name, slug: generateSlug(name) } }));
    }

    // ========== SHIPPING METHODS ==========
    await this.prisma.shipping_methods.createMany({
      data: [
        { name: 'Standard Shipping', description: '5-7 business days', base_cost: 5.99, estimated_days: '5-7 days', active: true },
        { name: 'Express Shipping', description: '2-3 business days', base_cost: 12.99, estimated_days: '2-3 days', active: true },
        { name: 'Next Day Delivery', description: '1 business day', base_cost: 24.99, estimated_days: '1 day', active: true },
        { name: 'Free Shipping', description: '7-10 business days (orders over $50)', base_cost: 0, estimated_days: '7-10 days', free_shipping_threshold: 50, active: true },
      ],
    });

    // ========== PRODUCTS ==========
    const scrapedProducts = this.loadScrapedData('products.json');
    const childCatsByParent: any[][] = [];
    for (const parent of parentCategories) {
      const children = allCategories.filter((c: any) => c.parent_id === parent.id);
      childCatsByParent.push(children.length > 0 ? children : [parent]);
    }
    const shopOffsets = [0, 0, 0, 3, 3, 5, 5, 5, 6, 6, 7, 8, 9, 10, 11];
    const allProducts: any[] = [];

    // Build a lookup: brand name -> brand record
    const brandByName: Record<string, any> = {};
    for (const b of brands) brandByName[b.name.toLowerCase()] = b;

    // Build a lookup: category name -> category record
    const catByName: Record<string, any> = {};
    for (const c of allCategories) catByName[c.name.toLowerCase()] = c;

    if (scrapedProducts && scrapedProducts.length > 0) {
      // ===== USE SCRAPED DATA =====
      this.logger.log(`Seeding ${scrapedProducts.length} scraped products...`);
      for (let pi = 0; pi < scrapedProducts.length; pi++) {
        const sp = scrapedProducts[pi];
        const price = sp.price || 9.99;
        const compareAtPrice = sp.compare_at_price || Math.round(price * 1.2 * 100) / 100;
        const costPrice = sp.cost_price || Math.round(price * 0.6 * 100) / 100;
        const salesCount = sp.sales_count || this.rand(0, 999);

        // Find matching category
        let category = catByName[(sp.subcategory || '').toLowerCase()] || catByName[(sp.category || '').toLowerCase()];
        if (!category) {
          // Fallback: assign to a random subcategory
          const parentIdx = pi % parentCategories.length;
          const children = childCatsByParent[parentIdx];
          category = children[pi % children.length];
        }

        // Find matching brand
        let brand = brandByName[(sp.brand || '').toLowerCase()];
        if (!brand) {
          // Create brand on the fly if it doesn't exist
          if (sp.brand && sp.brand !== 'Generic') {
            const brandSlug = generateSlug(sp.brand);
            brand = await this.prisma.brands.upsert({
              where: { slug: brandSlug },
              update: {},
              create: {
                name: sp.brand, slug: brandSlug,
                description: `${sp.brand} - Quality products`,
                logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(sp.brand)}&background=random&size=200`,
                active: true,
              },
            });
            brands.push(brand);
            brandByName[sp.brand.toLowerCase()] = brand;
          } else {
            brand = brands[pi % brands.length];
          }
        }

        const shop = shops[pi % shops.length];

        const product = await this.prisma.products.create({
          data: {
            name: sp.name,
            slug: generateSlug(sp.name) + '-' + randomUUID().substring(0, 8),
            description: sp.description || sp.short_description || sp.name,
            short_description: (sp.short_description || sp.description || sp.name).substring(0, 250),
            sku: 'SKU-' + randomUUID().substring(0, 10).toUpperCase(),
            price, compare_at_price: compareAtPrice, cost_price: costPrice,
            stock_quantity: this.rand(20, 520),
            low_stock_threshold: 10,
            status: 'ACTIVE',
            featured: pi < 20,
            average_rating: sp.rating || this.randFloat(3.5, 5.0),
            review_count: sp.review_count || this.rand(5, 204),
            sales_count: salesCount,
            view_count: salesCount * this.rand(3, 12),
            category_id: category.id,
            brand_id: brand.id,
            shop_id: shop.id,
          },
        });

        // Add images from scraped data
        const images = sp.images && sp.images.length > 0 ? sp.images : [];
        if (images.length > 0) {
          const imgData = images.slice(0, 6).map((url: string, idx: number) => ({
            product_id: product.id,
            image_url: url,
            is_primary: idx === 0,
            sort_order: idx,
          }));
          await this.prisma.product_images.createMany({ data: imgData });
        } else {
          // Fallback placeholder images
          const imgCount = this.rand(2, 5);
          const imgData = [];
          for (let imgI = 0; imgI < imgCount; imgI++) {
            const seed = this.rand(1, 1000);
            imgData.push({
              product_id: product.id,
              image_url: `https://picsum.photos/seed/${seed}/800/800`,
              is_primary: imgI === 0,
              sort_order: imgI,
            });
          }
          await this.prisma.product_images.createMany({ data: imgData });
        }

        allProducts.push(product);
      }
    } else {
      // ===== FALLBACK: USE HARDCODED DATA =====
      const productData: { name: string; minPrice: number; maxPrice: number; catIndex: number; desc: string }[] = [
      { name: 'iPhone 15 Pro Max', minPrice: 1199, maxPrice: 1499, catIndex: 0, desc: 'Latest Apple flagship with A17 Pro chip' },
      { name: 'Samsung Galaxy S24 Ultra', minPrice: 1099, maxPrice: 1399, catIndex: 0, desc: 'Samsung premium smartphone with AI features' },
      { name: 'MacBook Pro 14 M3 Pro', minPrice: 1999, maxPrice: 2499, catIndex: 0, desc: 'Apple laptop for professionals' },
      { name: 'Sony WH-1000XM5', minPrice: 349, maxPrice: 399, catIndex: 0, desc: 'Premium noise-cancelling headphones' },
      { name: 'iPad Air M2', minPrice: 599, maxPrice: 799, catIndex: 0, desc: 'Versatile tablet with M2 chip' },
      { name: 'DJI Air 3', minPrice: 1099, maxPrice: 1199, catIndex: 0, desc: 'Professional drone with dual cameras' },
      { name: 'Samsung Galaxy Watch 6', minPrice: 299, maxPrice: 399, catIndex: 0, desc: 'Advanced smartwatch with health tracking' },
      { name: 'JBL Charge 5', minPrice: 149, maxPrice: 179, catIndex: 0, desc: 'Portable Bluetooth speaker' },
      { name: 'PlayStation 5 Slim', minPrice: 449, maxPrice: 499, catIndex: 0, desc: 'Next-gen gaming console' },
      { name: 'Canon EOS R6 Mark II', minPrice: 2299, maxPrice: 2499, catIndex: 0, desc: 'Full-frame mirrorless camera' },
      { name: 'AirPods Pro 2', minPrice: 229, maxPrice: 249, catIndex: 0, desc: 'Apple wireless earbuds with ANC' },
      { name: 'Dell XPS 15', minPrice: 1499, maxPrice: 1899, catIndex: 0, desc: 'Premium Windows laptop' },
      { name: 'Nintendo Switch OLED', minPrice: 349, maxPrice: 379, catIndex: 0, desc: 'Portable gaming console with OLED display' },
      { name: 'Logitech MX Master 3S', minPrice: 89, maxPrice: 99, catIndex: 0, desc: 'Premium wireless mouse' },
      { name: 'Samsung 65" QLED 4K TV', minPrice: 1299, maxPrice: 1499, catIndex: 0, desc: 'Premium 4K QLED television' },
      { name: 'Razer BlackWidow V4', minPrice: 149, maxPrice: 169, catIndex: 0, desc: 'Mechanical gaming keyboard' },
      { name: 'GoPro HERO 12', minPrice: 349, maxPrice: 399, catIndex: 0, desc: 'Action camera for adventures' },
      { name: 'Bose QuietComfort Ultra', minPrice: 379, maxPrice: 429, catIndex: 0, desc: 'Premium over-ear headphones' },
      { name: 'Apple Watch Ultra 2', minPrice: 799, maxPrice: 849, catIndex: 0, desc: 'Rugged smartwatch for outdoor sports' },
      { name: 'LG 34" UltraWide Monitor', minPrice: 499, maxPrice: 599, catIndex: 0, desc: 'Ultrawide monitor for productivity' },
      { name: 'Premium Cotton T-Shirt', minPrice: 29, maxPrice: 49, catIndex: 1, desc: 'Comfortable premium cotton tee' },
      { name: 'Running Shoes Ultra Boost 23', minPrice: 129, maxPrice: 179, catIndex: 1, desc: 'High-performance running shoes' },
      { name: 'Leather Chelsea Boots', minPrice: 149, maxPrice: 199, catIndex: 1, desc: 'Classic leather Chelsea boots' },
      { name: 'Silk Midi Wrap Dress', minPrice: 149, maxPrice: 249, catIndex: 1, desc: 'Elegant silk wrap dress' },
      { name: 'Slim Fit Chino Pants', minPrice: 59, maxPrice: 79, catIndex: 1, desc: 'Modern slim fit chinos' },
      { name: 'Cashmere Crew Neck Sweater', minPrice: 129, maxPrice: 199, catIndex: 1, desc: 'Luxurious cashmere sweater' },
      { name: 'Classic Leather Belt', minPrice: 39, maxPrice: 59, catIndex: 1, desc: 'Premium leather belt for men' },
      { name: 'Designer Sunglasses', minPrice: 149, maxPrice: 249, catIndex: 1, desc: 'UV-protective designer sunglasses' },
      { name: 'Canvas Tote Bag', minPrice: 49, maxPrice: 79, catIndex: 1, desc: 'Stylish canvas tote for daily use' },
      { name: 'Linen Summer Blazer', minPrice: 149, maxPrice: 229, catIndex: 1, desc: 'Lightweight linen blazer' },
      { name: 'Athletic Jogger Pants', minPrice: 49, maxPrice: 69, catIndex: 1, desc: 'Comfortable athletic joggers' },
      { name: 'Pearl Necklace Set', minPrice: 79, maxPrice: 149, catIndex: 1, desc: 'Elegant pearl necklace and earring set' },
      { name: 'Wool Overcoat', minPrice: 199, maxPrice: 349, catIndex: 1, desc: 'Classic wool overcoat for winter' },
      { name: 'High-Waist Denim Jeans', minPrice: 69, maxPrice: 99, catIndex: 1, desc: 'Trendy high-waist jeans' },
      { name: 'Leather Crossbody Bag', minPrice: 89, maxPrice: 149, catIndex: 1, desc: 'Compact leather crossbody' },
      { name: 'Modern Scandinavian Coffee Table', minPrice: 199, maxPrice: 349, catIndex: 2, desc: 'Minimalist coffee table' },
      { name: 'Digital Air Fryer 5.8QT', minPrice: 89, maxPrice: 129, catIndex: 2, desc: 'Healthy cooking air fryer' },
      { name: 'L-Shape Sectional Sofa', minPrice: 999, maxPrice: 1499, catIndex: 2, desc: 'Spacious L-shape sectional' },
      { name: 'Adjustable Standing Desk', minPrice: 349, maxPrice: 499, catIndex: 2, desc: 'Electric height-adjustable desk' },
      { name: 'Robot Vacuum Cleaner', minPrice: 299, maxPrice: 449, catIndex: 2, desc: 'Smart robot vacuum with mapping' },
      { name: 'Espresso Coffee Machine', minPrice: 199, maxPrice: 349, catIndex: 2, desc: 'Semi-automatic espresso maker' },
      { name: 'Memory Foam Mattress Queen', minPrice: 499, maxPrice: 799, catIndex: 2, desc: 'Premium memory foam mattress' },
      { name: 'LED Crystal Chandelier', minPrice: 149, maxPrice: 299, catIndex: 2, desc: 'Modern LED chandelier' },
      { name: 'Non-Stick Cookware Set', minPrice: 89, maxPrice: 149, catIndex: 2, desc: '12-piece non-stick cookware' },
      { name: 'Smart Home Hub', minPrice: 89, maxPrice: 129, catIndex: 2, desc: 'Central smart home controller' },
      { name: 'Bamboo Bookshelf', minPrice: 129, maxPrice: 199, catIndex: 2, desc: 'Eco-friendly bamboo shelving' },
      { name: 'Ceramic Dining Set', minPrice: 79, maxPrice: 129, catIndex: 2, desc: '16-piece ceramic dinnerware' },
      { name: 'Weighted Blanket', minPrice: 49, maxPrice: 79, catIndex: 2, desc: 'Calming weighted blanket 15lbs' },
      { name: 'Smart Thermostat', minPrice: 149, maxPrice: 249, catIndex: 2, desc: 'WiFi-enabled smart thermostat' },
      { name: 'Cast Iron Dutch Oven', minPrice: 59, maxPrice: 89, catIndex: 2, desc: '6-quart enameled Dutch oven' },
      { name: 'Premium Yoga Mat', minPrice: 29, maxPrice: 49, catIndex: 3, desc: 'Non-slip eco-friendly yoga mat' },
      { name: 'Adjustable Dumbbell Set', minPrice: 249, maxPrice: 349, catIndex: 3, desc: '5-52.5lb adjustable dumbbells' },
      { name: 'Treadmill', minPrice: 499, maxPrice: 699, catIndex: 3, desc: 'Foldable treadmill with display' },
      { name: 'Golf Club Set', minPrice: 299, maxPrice: 449, catIndex: 3, desc: 'Complete 14-piece golf set' },
      { name: 'Mountain Bike 29er', minPrice: 499, maxPrice: 799, catIndex: 3, desc: 'Full suspension mountain bike' },
      { name: 'Camping Tent 4-Person', minPrice: 149, maxPrice: 249, catIndex: 3, desc: 'Waterproof camping tent' },
      { name: 'Swimming Goggles Pro', minPrice: 19, maxPrice: 39, catIndex: 3, desc: 'Anti-fog swimming goggles' },
      { name: 'Basketball Official Size', minPrice: 29, maxPrice: 49, catIndex: 3, desc: 'Official NBA basketball' },
      { name: 'Resistance Bands Set', minPrice: 19, maxPrice: 39, catIndex: 3, desc: 'Complete resistance band set' },
      { name: 'Running Hydration Vest', minPrice: 39, maxPrice: 59, catIndex: 3, desc: 'Lightweight hydration pack' },
      { name: 'Kayak Inflatable 2-Person', minPrice: 199, maxPrice: 349, catIndex: 3, desc: 'Inflatable tandem kayak' },
      { name: 'Ski Helmet', minPrice: 79, maxPrice: 129, catIndex: 3, desc: 'MIPS certified ski helmet' },
      { name: 'Boxing Gloves 16oz', minPrice: 49, maxPrice: 79, catIndex: 3, desc: 'Professional boxing gloves' },
      { name: 'Fitness Tracker Band', minPrice: 49, maxPrice: 79, catIndex: 3, desc: 'Waterproof fitness tracker' },
      { name: 'Soccer Ball Premium', minPrice: 29, maxPrice: 49, catIndex: 3, desc: 'FIFA-approved match ball' },
      { name: '20% Vitamin C Face Serum', minPrice: 24, maxPrice: 39, catIndex: 4, desc: 'Anti-aging vitamin C serum' },
      { name: 'Whey Protein Isolate 5lbs', minPrice: 49, maxPrice: 69, catIndex: 4, desc: 'Premium whey protein powder' },
      { name: 'LED Face Mask Therapy', minPrice: 49, maxPrice: 89, catIndex: 4, desc: 'LED light therapy mask' },
      { name: 'Retinol Night Cream', minPrice: 29, maxPrice: 49, catIndex: 4, desc: 'Anti-wrinkle retinol cream' },
      { name: 'Professional Hair Dryer', minPrice: 79, maxPrice: 149, catIndex: 4, desc: 'Ionic technology hair dryer' },
      { name: 'Electric Toothbrush', minPrice: 49, maxPrice: 89, catIndex: 4, desc: 'Sonic electric toothbrush' },
      { name: 'Aromatherapy Diffuser', minPrice: 29, maxPrice: 49, catIndex: 4, desc: 'Essential oil diffuser' },
      { name: 'Collagen Peptides Powder', minPrice: 29, maxPrice: 49, catIndex: 4, desc: 'Marine collagen supplement' },
      { name: 'Luxury Perfume Set', minPrice: 89, maxPrice: 149, catIndex: 4, desc: 'Designer perfume collection' },
      { name: 'Digital Body Scale', minPrice: 29, maxPrice: 49, catIndex: 4, desc: 'Smart body composition scale' },
      { name: 'Best-Selling Novel Collection', minPrice: 44, maxPrice: 59, catIndex: 5, desc: 'Collection of top fiction novels' },
      { name: 'Premium Art Supply Kit', minPrice: 49, maxPrice: 89, catIndex: 5, desc: 'Complete art supply set' },
      { name: 'Board Game Collection', minPrice: 39, maxPrice: 59, catIndex: 6, desc: 'Family board game set' },
      { name: 'STEM Building Robot Kit', minPrice: 49, maxPrice: 89, catIndex: 6, desc: 'Educational robot for kids' },
      { name: 'Dash Cam 4K', minPrice: 79, maxPrice: 129, catIndex: 7, desc: '4K dashcam with night vision' },
      { name: 'Car Seat Covers Set', minPrice: 49, maxPrice: 79, catIndex: 7, desc: 'Universal car seat covers' },
      { name: 'Organic Green Tea Set', minPrice: 19, maxPrice: 39, catIndex: 8, desc: 'Premium organic green tea' },
      { name: 'Gourmet Coffee Beans 1kg', minPrice: 24, maxPrice: 39, catIndex: 8, desc: 'Single origin coffee beans' },
      { name: 'Baby Stroller', minPrice: 199, maxPrice: 349, catIndex: 9, desc: 'Lightweight foldable stroller' },
      { name: 'Baby Monitor WiFi', minPrice: 79, maxPrice: 129, catIndex: 9, desc: 'HD WiFi baby monitor with camera' },
      { name: 'Premium Dog Food 15kg', minPrice: 49, maxPrice: 69, catIndex: 10, desc: 'Grain-free premium dog food' },
      { name: 'Cat Tree Tower', minPrice: 59, maxPrice: 99, catIndex: 10, desc: 'Multi-level cat tower' },
      { name: 'Garden Tool Set', minPrice: 39, maxPrice: 69, catIndex: 11, desc: 'Complete garden tool kit' },
      { name: 'Outdoor Solar Lights Set', minPrice: 29, maxPrice: 49, catIndex: 11, desc: 'Solar pathway lights 10-pack' },
      { name: 'Indoor Herb Garden Kit', minPrice: 29, maxPrice: 49, catIndex: 11, desc: 'Smart herb growing kit' },
    ];

    for (let pi = 0; pi < productData.length; pi++) {
      const pd = productData[pi];
      const price = this.randFloat(pd.minPrice, pd.maxPrice);
      const compareAtPrice = Math.round(price * (1.15 + Math.random() * 0.35) * 100) / 100;
      const costPrice = Math.round(price * (0.5 + Math.random() * 0.2) * 100) / 100;
      const totalSold = this.rand(0, 999);
      const reviewCount = this.rand(5, 204);

      const catChildren = childCatsByParent[pd.catIndex] || childCatsByParent[0];
      const category = catChildren[pi % catChildren.length];
      const shopIdx = (shopOffsets[pd.catIndex] || 0) + (pi % 3);
      const shop = shops[shopIdx % shops.length];
      const brand = brands[pi % brands.length];

      const product = await this.prisma.products.create({
        data: {
          name: pd.name,
          slug: generateSlug(pd.name) + '-' + randomUUID().substring(0, 8),
          description: pd.desc,
          short_description: pd.desc.substring(0, 100),
          sku: 'SKU-' + randomUUID().substring(0, 10).toUpperCase(),
          price, compare_at_price: compareAtPrice, cost_price: costPrice,
          stock_quantity: this.rand(20, 520),
          low_stock_threshold: 10,
          status: 'ACTIVE',
          featured: pi < 20,
          average_rating: this.randFloat(3.5, 5.0),
          review_count: reviewCount, sales_count: totalSold,
          view_count: totalSold * this.rand(3, 12),
          category_id: category.id,
          brand_id: brand.id,
          shop_id: shop.id,
        },
      });

      // Add 2-5 images
      const imgCount = this.rand(2, 5);
      const imgData = [];
      for (let imgI = 0; imgI < imgCount; imgI++) {
        const seed = this.rand(1, 1000);
        imgData.push({
          product_id: product.id,
          image_url: `https://picsum.photos/seed/${seed}/800/800`,
          is_primary: imgI === 0,
          sort_order: imgI,
        });
      }
      await this.prisma.product_images.createMany({ data: imgData });

      allProducts.push(product);
    }
    } // end else (fallback hardcoded products)
    this.logger.log(`Created ${allProducts.length} products`);

    // ========== ADDRESSES ==========
    const cities = ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho', 'Nha Trang', 'Da Lat', 'Hue'];
    const streets = ['Nguyen Hue', 'Le Loi', 'Tran Hung Dao', 'Hai Ba Trung', 'Pham Ngu Lao', 'Dong Khoi', 'Le Duan', 'Vo Van Tan'];
    const districts = ['District 1', 'District 2', 'District 3', 'District 7', 'Binh Thanh', 'Thu Duc', 'Phu Nhuan', 'Tan Binh'];
    for (const customer of customers) {
      const addrCount = this.rand(1, 3);
      for (let a = 0; a < addrCount; a++) {
        await this.prisma.addresses.create({
          data: {
            user_id: customer.id,
            full_name: `${customer.first_name} ${customer.last_name}`,
            phone: customer.phone || '',
            address_line1: `${this.rand(1, 999)} ${this.pick(streets)} Street`,
            city: this.pick(cities),
            state: this.pick(districts),
            country: 'Vietnam',
            postal_code: `${this.rand(10000, 99999)}`,
            is_default: a === 0,
          },
        });
      }
    }
    this.logger.log('Created addresses');

    // ========== ORDERS ==========
    const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const paymentMethods = ['CREDIT_CARD', 'STRIPE', 'COD', 'BANK_TRANSFER', 'MOMO', 'VNPAY'];
    let orderNum = 10001;
    for (const customer of customers) {
      const orderCount = this.rand(3, 10);
      const customerAddresses = await this.prisma.addresses.findMany({ where: { user_id: customer.id } });
      const defaultAddr = customerAddresses[0];
      if (!defaultAddr) continue;

      for (let o = 0; o < orderCount; o++) {
        const itemCount = this.rand(1, 4);
        let subtotal = 0;
        const orderItems: { productId: string; quantity: number; price: number; productName: string }[] = [];
        for (let oi = 0; oi < itemCount; oi++) {
          const product = this.pick(allProducts);
          const qty = this.rand(1, 3);
          const price = Number(product.price);
          subtotal += price * qty;
          orderItems.push({ productId: product.id, quantity: qty, price, productName: product.name });
        }

        const tax = Math.round(subtotal * 0.1 * 100) / 100;
        const shipping = this.randFloat(3, 17);
        const discount = Math.random() < 0.25 ? Math.round(subtotal * this.randFloat(0.05, 0.2) * 100) / 100 : 0;
        const total = Math.round((subtotal + tax + shipping - discount) * 100) / 100;

        const statusIdx = Math.random() < 0.5 ? 4 : this.rand(0, 4);
        const daysAgo = this.rand(0, 180);
        const orderDate = new Date(Date.now() - daysAgo * 86400000);

        const order = await this.prisma.orders.create({
          data: {
            order_number: `ORD-${orderNum++}`,
            user_id: customer.id,
            status: statuses[statusIdx],
            payment_method: this.pick(paymentMethods),
            payment_status: statusIdx >= 1 ? 'PAID' : 'PENDING',
            subtotal, tax, shipping_fee: shipping, discount, total_amount: total,
            shipping_full_name: defaultAddr.full_name,
            shipping_phone: defaultAddr.phone,
            shipping_address_line1: defaultAddr.address_line1,
            shipping_city: defaultAddr.city,
            shipping_state: defaultAddr.state || '',
            shipping_country: 'Vietnam',
            created_at: orderDate,
          },
        });

        for (const item of orderItems) {
          await this.prisma.order_items.create({
            data: {
              order_id: order.id,
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
            },
          });
        }
      }
    }
    this.logger.log('Created orders');

    // ========== REVIEWS ==========
    const scrapedReviews = this.loadScrapedData('reviews.json');
    const reviewTitles5 = ['Amazing product!', 'Excellent quality!', 'Highly recommended!'];
    const reviewBodies5 = ['This product exceeded my expectations. The quality is outstanding!',
      'Best purchase this year. Premium quality and worth every penny.',
      'Absolutely love it! Works perfectly and looks great.'];
    const reviewTitles4 = ['Great product', 'Very good quality'];
    const reviewBodies4 = ['Very good product, minor improvements could be made but overall satisfied.',
      'Good quality and fair price. Would buy again.'];
    const reviewBodies3 = ['Product is decent for the price. Not exceptional but gets the job done.',
      'Average product, meets basic expectations.'];

    // Build product name -> id lookup for scraped reviews
    const productByName: Record<string, any> = {};
    for (const p of allProducts) productByName[p.name.toLowerCase()] = p;

    if (scrapedReviews && scrapedReviews.length > 0) {
      // Seed scraped reviews for matching products
      let scrapedReviewCount = 0;
      for (const sr of scrapedReviews) {
        const product = productByName[(sr.product_name || '').toLowerCase()];
        if (!product) continue;
        const customer = this.pick(customers);
        await this.prisma.reviews.create({
          data: {
            product_id: product.id, user_id: customer.id,
            rating: Math.min(5, Math.max(1, sr.rating || 5)),
            comment: sr.comment || 'Great product!',
            approved: true, helpful_count: sr.helpful_count || this.rand(0, 99),
          },
        });
        scrapedReviewCount++;
      }
      this.logger.log(`Created ${scrapedReviewCount} scraped reviews`);

      // Also generate some additional reviews for products that have few/no scraped reviews
      for (const product of allProducts) {
        const existingCount = scrapedReviews.filter((r: any) => (r.product_name || '').toLowerCase() === product.name.toLowerCase()).length;
        if (existingCount >= 3) continue;
        const additionalCount = this.rand(2, 5);
        for (let r = 0; r < additionalCount; r++) {
          const customer = this.pick(customers);
          const ratingRoll = Math.random();
          let rating: number, comment: string;
          if (ratingRoll < 0.40) { rating = 5; comment = this.pick(reviewBodies5); }
          else if (ratingRoll < 0.75) { rating = 4; comment = this.pick(reviewBodies4); }
          else if (ratingRoll < 0.90) { rating = 3; comment = this.pick(reviewBodies3); }
          else if (ratingRoll < 0.97) { rating = 2; comment = 'Product didn\'t meet my expectations.'; }
          else { rating = 1; comment = 'Very disappointed with this product.'; }
          await this.prisma.reviews.create({
            data: {
              product_id: product.id, user_id: customer.id,
              rating, comment,
              approved: true, helpful_count: this.rand(0, 99),
            },
          });
        }
      }
      this.logger.log('Supplemented with additional reviews');
    } else {
      // Fallback: generate all reviews
      for (const product of allProducts) {
        const revCount = this.rand(2, 9);
        for (let r = 0; r < revCount; r++) {
          const customer = this.pick(customers);
          const ratingRoll = Math.random();
          let rating: number, comment: string;
          if (ratingRoll < 0.40) { rating = 5; comment = this.pick(reviewBodies5); }
          else if (ratingRoll < 0.75) { rating = 4; comment = this.pick(reviewBodies4); }
          else if (ratingRoll < 0.90) { rating = 3; comment = this.pick(reviewBodies3); }
          else if (ratingRoll < 0.97) { rating = 2; comment = 'Product didn\'t meet my expectations.'; }
          else { rating = 1; comment = 'Very disappointed with this product.'; }

          await this.prisma.reviews.create({
            data: {
              product_id: product.id, user_id: customer.id,
              rating, comment,
              approved: true, helpful_count: this.rand(0, 99),
            },
          });
        }
      }
      this.logger.log('Created reviews');
    }

    // ========== COUPONS ==========
    const now = new Date();
    const couponData = [
      { code: 'WELCOME10', discount_type: 'PERCENTAGE', discount_value: 10, minimum_order_amount: 30, maximum_discount: 50, usage_limit: 10000, description: '10% off for new customers' },
      { code: 'SAVE20', discount_type: 'FIXED_AMOUNT', discount_value: 20, minimum_order_amount: 100, usage_limit: 5000, description: 'Save $20 on orders over $100' },
      { code: 'FREESHIP', discount_type: 'FREE_SHIPPING', discount_value: 0, minimum_order_amount: 50, usage_limit: 20000, description: 'Free shipping on orders over $50' },
      { code: 'SUMMER25', discount_type: 'PERCENTAGE', discount_value: 25, minimum_order_amount: 50, maximum_discount: 100, usage_limit: 3000, description: '25% summer discount' },
      { code: 'VIP50', discount_type: 'FIXED_AMOUNT', discount_value: 50, minimum_order_amount: 200, usage_limit: 500, description: 'VIP exclusive $50 off' },
      { code: 'FLASH15', discount_type: 'PERCENTAGE', discount_value: 15, minimum_order_amount: 40, maximum_discount: 75, usage_limit: 2000, description: '15% flash sale discount' },
      { code: 'NEWYEAR30', discount_type: 'PERCENTAGE', discount_value: 30, minimum_order_amount: 75, maximum_discount: 150, usage_limit: 5000, description: 'New Year 30% off' },
    ];
    for (const cd of couponData) {
      await this.prisma.coupons.create({
        data: {
          ...cd, active: true, usage_count: 0,
          start_date: new Date(now.getTime() - 30 * 86400000),
          end_date: new Date(now.getTime() + 180 * 86400000),
        },
      });
    }
    this.logger.log('Created coupons');

    // ========== BANNERS ==========
    const bannerData = [
      { title: 'Summer Sale Up To 50% Off', subtitle: 'Shop the hottest deals of the season', position: 'HOME_HERO' },
      { title: 'New Electronics Collection', subtitle: 'Latest gadgets and tech', position: 'HOME_HERO' },
      { title: 'Free Shipping Over $50', subtitle: 'Use code FREESHIP at checkout', position: 'HOME_HERO' },
      { title: 'Fashion Week Specials', subtitle: 'Exclusive designer collections', position: 'HOME_SECONDARY' },
      { title: 'Home Makeover Sale', subtitle: 'Transform your living space', position: 'HOME_SECONDARY' },
      { title: 'Back to School Deals', subtitle: 'Everything you need for school', position: 'HOME_SIDEBAR' },
      { title: 'Sports & Fitness Gear', subtitle: 'Get active with the best gear', position: 'CATEGORY_TOP' },
      { title: 'Beauty Essentials', subtitle: 'Glow up with our beauty picks', position: 'CATEGORY_TOP' },
    ];
    for (let i = 0; i < bannerData.length; i++) {
      await this.prisma.banners.create({
        data: {
          title: bannerData[i].title, subtitle: bannerData[i].subtitle,
          active: true, sort_order: i, position: bannerData[i].position,
          image_url: `https://placehold.co/1200x400?text=${encodeURIComponent(bannerData[i].title)}`,
          link: '/products',
          start_date: new Date(now.getTime() - 30 * 86400000),
          end_date: new Date(now.getTime() + 180 * 86400000),
        },
      });
    }
    this.logger.log('Created banners');

    // ========== BLOG ==========
    const blogCategories = ['Technology', 'Fashion & Style', 'Lifestyle', 'Deals & Guides'];
    const savedBlogCats: any[] = [];
    for (const name of blogCategories) {
      savedBlogCats.push(await this.prisma.blog_categories.create({ data: { name, slug: generateSlug(name) } }));
    }
    const blogPosts = [
      { title: 'Top 10 Smartphones of 2024', excerpt: 'Our picks for the best smartphones this year', catIdx: 0, featured: true },
      { title: 'Essential Wardrobe Staples Every Man Needs', excerpt: 'Build the perfect wardrobe', catIdx: 1, featured: true },
      { title: 'Home Office Setup Guide', excerpt: 'Create the perfect workspace at home', catIdx: 2, featured: true },
      { title: 'Black Friday 2024 Best Deals', excerpt: 'The ultimate guide to Black Friday shopping', catIdx: 3, featured: true },
      { title: 'Best Laptops for Students', excerpt: 'Affordable laptops for studying', catIdx: 0, featured: false },
      { title: 'Summer Fashion Trends', excerpt: 'What\'s hot this summer', catIdx: 1, featured: false },
      { title: 'Healthy Meal Prep Ideas', excerpt: 'Easy recipes for busy people', catIdx: 2, featured: false },
      { title: 'Cyber Monday Deals Guide', excerpt: 'Best online deals after Black Friday', catIdx: 3, featured: false },
      { title: 'Smart Home Gadgets You Need', excerpt: 'Transform your home with tech', catIdx: 0, featured: false },
      { title: 'Sustainable Fashion Guide', excerpt: 'Eco-friendly fashion choices', catIdx: 1, featured: false },
    ];
    for (const bp of blogPosts) {
      await this.prisma.blog_posts.create({
        data: {
          title: bp.title, slug: generateSlug(bp.title) + '-' + randomUUID().substring(0, 6),
          content: `<p>${bp.excerpt}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>`,
          excerpt: bp.excerpt,
          featured_image: `https://placehold.co/800x400?text=${encodeURIComponent(bp.title)}`,
          featured: bp.featured, published: true,
          author_id: admin.id, category_id: savedBlogCats[bp.catIdx].id,
          view_count: this.rand(100, 5000),
        },
      });
    }
    this.logger.log('Created blog posts');

    // ========== NOTIFICATIONS ==========
    for (let i = 0; i < Math.min(20, customers.length); i++) {
      await this.prisma.notifications.createMany({
        data: [
          { user_id: customers[i].id, type: 'SYSTEM', channel: 'IN_APP', title: 'Welcome to ECommerce!', message: 'Thank you for joining our platform. Enjoy shopping!', is_read: false },
          { user_id: customers[i].id, type: 'PROMOTION', channel: 'IN_APP', title: 'Welcome Discount!', message: 'Use code WELCOME10 to get 10% off your first order!', is_read: false },
        ],
      });
    }
    this.logger.log('Created notifications');

    // ========== WISHLISTS ==========
    for (const customer of customers) {
      const wishCount = this.rand(0, 7);
      const usedIds = new Set<string>();
      for (let w = 0; w < wishCount; w++) {
        const product = this.pick(allProducts);
        if (!usedIds.has(product.id)) {
          usedIds.add(product.id);
          await this.prisma.wishlists.create({ data: { user_id: customer.id, product_id: product.id } });
        }
      }
    }
    this.logger.log('Created wishlists');

    // ========== TAX RULES ==========
    await this.prisma.tax_rules.createMany({
      data: [
        { name: 'Standard VAT', rate: 10, country: 'Vietnam', active: true },
        { name: 'Reduced VAT', rate: 5, country: 'Vietnam', active: true },
        { name: 'US Sales Tax - California', rate: 7.25, country: 'United States', state: 'California', active: true },
        { name: 'US Sales Tax - New York', rate: 8.875, country: 'United States', state: 'New York', active: true },
        { name: 'Tax Exempt', rate: 0, active: true },
      ],
    });
    this.logger.log('Created tax rules');

    // ========== COLLECTIONS ==========
    const collData = [
      { name: 'Summer Essentials 2024', description: 'Must-have items for summer', featured: true },
      { name: 'Work From Home Setup', description: 'Everything for your home office', featured: true },
      { name: 'Gift Ideas Under $50', description: 'Great gifts that won\'t break the bank', featured: true },
      { name: 'Fitness Starter Pack', description: 'Begin your fitness journey', featured: false },
      { name: 'Tech Lover\'s Dream', description: 'Latest tech gadgets and electronics', featured: true },
      { name: 'New Arrivals This Month', description: 'Fresh products just landed', featured: false },
    ];
    for (const c of collData) {
      await this.prisma.collections.create({
        data: {
          name: c.name, slug: generateSlug(c.name), description: c.description,
          featured: c.featured, active: true,
          image_url: `https://placehold.co/600x400?text=${encodeURIComponent(c.name)}`,
        },
      });
    }
    this.logger.log('Created collections');

    // ========== CMS PAGES ==========
    const cmsData = [
      { title: 'About Us', slug: 'about-us', content: '<h2>About Our Store</h2><p>We are a leading e-commerce platform dedicated to providing the best products at competitive prices.</p>' },
      { title: 'Privacy Policy', slug: 'privacy-policy', content: '<h2>Privacy Policy</h2><p>We are committed to protecting your personal information.</p>' },
      { title: 'Terms of Service', slug: 'terms-of-service', content: '<h2>Terms of Service</h2><p>By using our platform, you agree to these terms.</p>' },
      { title: 'Return Policy', slug: 'return-policy', content: '<h2>Return & Refund Policy</h2><p>Items can be returned within 30 days of delivery.</p>' },
      { title: 'Contact Us', slug: 'contact-us', content: '<h2>Contact Us</h2><p>Email: support@ecommerce.com</p><p>Phone: 1-800-ECOMMERCE</p>' },
      { title: 'Shipping Information', slug: 'shipping-info', content: '<h2>Shipping Information</h2><p>We offer multiple shipping options.</p>' },
    ];
    for (const p of cmsData) {
      await this.prisma.cms_pages.create({ data: { ...p, published: true, meta_title: p.title, meta_description: p.content.substring(0, 160).replace(/<[^>]*>/g, '') } });
    }
    this.logger.log('Created CMS pages');

    // ========== FAQ ==========
    const faqData = [
      { question: 'How do I track my order?', answer: 'Go to My Orders in your account dashboard.', category: 'Orders', sort_order: 0 },
      { question: 'What payment methods do you accept?', answer: 'Visa, MasterCard, PayPal, MoMo, VNPay, and COD.', category: 'Payments', sort_order: 1 },
      { question: 'How long does shipping take?', answer: 'Standard: 5-7 days, Express: 2-3 days, Next day available.', category: 'Shipping', sort_order: 2 },
      { question: 'Can I return or exchange an item?', answer: 'Yes, within 30 days of delivery in original condition.', category: 'Returns', sort_order: 3 },
      { question: 'How do I use a coupon code?', answer: 'Enter code at checkout in the Apply Coupon field.', category: 'Promotions', sort_order: 4 },
      { question: 'How does the loyalty program work?', answer: 'Earn 1 point per $1 spent. Redeem for discounts.', category: 'Loyalty', sort_order: 5 },
      { question: 'Is my personal information secure?', answer: 'Yes, we use SSL encryption and never share your data.', category: 'Security', sort_order: 6 },
      { question: 'How do I become a seller?', answer: 'Register as a seller and submit business docs.', category: 'Sellers', sort_order: 7 },
      { question: 'Do you offer gift cards?', answer: 'Yes! Digital gift cards in $10, $25, $50, $100, $200.', category: 'Gift Cards', sort_order: 8 },
      { question: 'How do I contact customer support?', answer: 'Live chat, email, or create a support ticket.', category: 'Support', sort_order: 9 },
    ];
    for (const f of faqData) {
      await this.prisma.faqs.create({ data: { ...f, active: true } });
    }
    this.logger.log('Created FAQs');

    // ========== NEWSLETTER ==========
    const nlData = [];
    for (let i = 0; i < 30; i++) {
      nlData.push({ email: i < 20 ? `customer${i + 1}@gmail.com` : `subscriber${i}@example.com`, active: i < 25 });
    }
    await this.prisma.newsletters.createMany({ data: nlData });
    this.logger.log('Created newsletter subscribers');

    // ========== FLASH SALES ==========
    const flashSales = [
      { name: 'Flash Deal Friday', description: 'Massive discounts every Friday', active: true, daysOffset: -1, durationHours: 48 },
      { name: 'Weekend Special', description: 'Special weekend-only deals', active: true, daysOffset: 0, durationHours: 72 },
      { name: 'Tech Tuesday', description: 'Electronics at unbeatable prices', active: true, daysOffset: 2, durationHours: 24 },
      { name: 'Midnight Madness', description: 'Late night shopping deals', active: false, daysOffset: -10, durationHours: 6 },
    ];
    for (const fs of flashSales) {
      const startTime = new Date(now.getTime() + fs.daysOffset * 86400000);
      const endTime = new Date(startTime.getTime() + fs.durationHours * 3600000);
      const sale = await this.prisma.flash_sales.create({
        data: { name: fs.name, slug: generateSlug(fs.name), description: fs.description, start_time: startTime, end_time: endTime, active: fs.active },
      });
      const count = this.rand(3, 6);
      const usedIds = new Set<string>();
      for (let i = 0; i < count; i++) {
        const product = this.pick(allProducts);
        if (usedIds.has(product.id)) continue;
        usedIds.add(product.id);
        const discountPct = this.rand(15, 50);
        await this.prisma.flash_sale_items.create({
          data: {
            flash_sale_id: sale.id, product_id: product.id,
            sale_price: Math.round(Number(product.price) * (1 - discountPct / 100) * 100) / 100,
            discount_percent: discountPct,
            quantity_limit: this.rand(10, 100), quantity_sold: this.rand(0, 50),
          },
        });
      }
    }
    this.logger.log('Created flash sales');

    // ========== GIFT CARDS ==========
    const gcAmounts = [10, 25, 50, 100, 200];
    for (let i = 0; i < 12; i++) {
      const amount = this.pick(gcAmounts);
      const usedAmount = i < 3 ? this.randFloat(5, amount * 0.8) : 0;
      await this.prisma.gift_cards.create({
        data: {
          code: `GIFT-${randomUUID().substring(0, 8).toUpperCase()}`,
          initial_balance: amount, current_balance: amount - usedAmount,
          active: i < 10, expires_at: new Date(now.getTime() + 365 * 86400000),
          purchased_by: this.pick(customers).id,
        },
      });
    }
    this.logger.log('Created gift cards');

    // ========== PROMOTIONS ==========
    const promoData = [
      { name: 'Buy 2 Get 1 Free', description: 'Buy any 2 items and get the cheapest one free', discount_type: 'BUY_X_GET_Y', discount_value: 100, active: true },
      { name: 'Spend $100 Save $15', description: 'Spend $100 or more and save $15', discount_type: 'FIXED', discount_value: 15, active: true, minimum_order_amount: 100 },
      { name: 'New User 20% Off', description: 'First-time buyers get 20% off', discount_type: 'PERCENTAGE', discount_value: 20, active: true },
      { name: 'Bundle Deal 10% Off', description: 'Save 10% when you buy 3 or more items', discount_type: 'PERCENTAGE', discount_value: 10, active: true },
      { name: 'Clearance Sale 40% Off', description: 'Up to 40% off on clearance items', discount_type: 'PERCENTAGE', discount_value: 40, active: false },
    ];
    for (const p of promoData) {
      await this.prisma.promotions.create({
        data: { ...p, start_date: new Date(now.getTime() - 7 * 86400000), end_date: new Date(now.getTime() + 90 * 86400000) },
      });
    }
    this.logger.log('Created promotions');

    // ========== LOYALTY PROGRAM ==========
    const program = await this.prisma.loyalty_programs.create({
      data: { name: 'ECommerce Rewards', description: 'Earn points with every purchase', points_per_dollar: 1, point_value: 0.01, active: true },
    });
    for (let i = 0; i < 30; i++) {
      const points = this.rand(50, 2000);
      const totalRedeemed = this.rand(50, 300);
      const member = await this.prisma.loyalty_members.create({
        data: {
          program_id: program.id, user_id: customers[i].id,
          points_balance: points, total_points_earned: points + totalRedeemed + this.rand(100, 500),
          total_points_redeemed: totalRedeemed,
          tier: points > 1000 ? 'GOLD' : points > 500 ? 'SILVER' : 'BRONZE',
        },
      });
      const txCount = this.rand(2, 5);
      for (let t = 0; t < txCount; t++) {
        await this.prisma.loyalty_transactions.create({
          data: {
            member_id: member.id,
            type: t < txCount - 1 ? 'EARN' : (Math.random() < 0.3 ? 'REDEEM' : 'EARN'),
            points: this.rand(10, 200),
            description: t < txCount - 1 ? `Purchase reward - Order #${this.rand(10001, 20000)}` : 'Points redeemed for discount',
          },
        });
      }
    }
    this.logger.log('Created loyalty program with 30 members');

    // ========== SUBSCRIPTION PLANS ==========
    const plans: any[] = [];
    const planData = [
      { name: 'Basic', price: 9.99, billing_cycle: 'MONTHLY', features: ['Free shipping', '5% discount', 'Priority support'], active: true },
      { name: 'Premium', price: 19.99, billing_cycle: 'MONTHLY', features: ['Free express shipping', '10% discount', 'Priority support', 'Early access to sales', 'Birthday bonus'], active: true },
      { name: 'Annual Basic', price: 99.99, billing_cycle: 'YEARLY', features: ['Free shipping', '5% discount', 'Priority support', '2 months free'], active: true },
      { name: 'Annual Premium', price: 189.99, billing_cycle: 'YEARLY', features: ['Free express shipping', '15% discount', 'Priority support', 'Early access', 'Birthday bonus', 'Exclusive products'], active: true },
    ];
    for (const p of planData) {
      plans.push(await this.prisma.subscription_plans.create({ data: p }));
    }
    for (let i = 0; i < 15; i++) {
      const plan = plans[i % plans.length];
      await this.prisma.subscriptions.create({
        data: {
          plan_id: plan.id, user_id: customers[i].id,
          status: i < 12 ? 'ACTIVE' : 'CANCELLED',
          start_date: new Date(now.getTime() - this.rand(30, 180) * 86400000),
          end_date: new Date(now.getTime() + this.rand(30, 365) * 86400000),
        },
      });
    }
    this.logger.log('Created subscription plans and 15 subscribers');

    // ========== AFFILIATE PROGRAM ==========
    const affProgram = await this.prisma.affiliate_programs.create({
      data: { name: 'ECommerce Affiliate Program', description: 'Earn commissions by referring customers', commission_rate: 5, cookie_duration: 30, active: true },
    });
    for (let i = 0; i < 10; i++) {
      const c = customers[i + 20];
      await this.prisma.affiliates.create({
        data: {
          program_id: affProgram.id, user_id: c.id,
          referral_code: `REF-${c.first_name.toUpperCase()}-${this.rand(1000, 9999)}`,
          total_earnings: this.randFloat(50, 1500), pending_earnings: this.randFloat(10, 200),
          total_clicks: this.rand(50, 1000), total_conversions: this.rand(5, 100),
          status: 'ACTIVE',
        },
      });
    }
    this.logger.log('Created affiliate program with 10 affiliates');

    // ========== RETURNS ==========
    const returnReasons = ['Defective product', 'Wrong item received', 'Item not as described', 'Changed my mind', 'Better price found'];
    const returnStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'COMPLETED'];
    const someOrders = await this.prisma.orders.findMany({ take: 20, orderBy: { created_at: 'desc' } });
    for (let i = 0; i < 20 && i < someOrders.length; i++) {
      await this.prisma.return_requests.create({
        data: {
          return_number: `RET-${String(i + 1).padStart(6, '0')}`,
          user_id: this.pick(customers).id,
          order_id: someOrders[i].id,
          reason: this.pick(returnReasons),
          status: returnStatuses[i % returnStatuses.length],
        },
      });
    }
    this.logger.log('Created return requests');

    // ========== WALLETS ==========
    for (let i = 0; i < 25; i++) {
      const balance = this.randFloat(10, 500);
      const wallet = await this.prisma.user_wallets.create({
        data: { user_id: customers[i].id, balance },
      });
      const txCount = this.rand(2, 4);
      for (let t = 0; t < txCount; t++) {
        await this.prisma.wallet_transactions.create({
          data: {
            wallet_id: wallet.id,
            type: Math.random() < 0.7 ? 'DEPOSIT' : 'WITHDRAWAL',
            amount: this.randFloat(10, 100),
            description: Math.random() < 0.7 ? 'Deposit via credit card' : 'Payment for order',
          },
        });
      }
    }
    this.logger.log('Created 25 wallets');

    // ========== WAREHOUSES ==========
    const whData = [
      { name: 'HCM Central Warehouse', address: '123 Industrial Road', city: 'Ho Chi Minh City', country: 'Vietnam', active: true },
      { name: 'Hanoi Distribution Center', address: '456 Logistics Ave', city: 'Hanoi', country: 'Vietnam', active: true },
      { name: 'Da Nang Warehouse', address: '789 Port Street', city: 'Da Nang', country: 'Vietnam', active: true },
      { name: 'Singapore Hub', address: '10 Jurong East', city: 'Singapore', country: 'Singapore', active: true },
      { name: 'Returns Processing Center', address: '321 Return Lane', city: 'Ho Chi Minh City', country: 'Vietnam', active: false },
    ];
    const warehouses: any[] = [];
    for (const w of whData) {
      warehouses.push(await this.prisma.warehouses.create({ data: w }));
    }
    for (let i = 0; i < Math.min(50, allProducts.length); i++) {
      await this.prisma.warehouse_stocks.create({
        data: {
          warehouse_id: warehouses[i % warehouses.length].id,
          product_id: allProducts[i].id,
          quantity: this.rand(10, 500),
          reserved_quantity: this.rand(0, 10),
        },
      });
    }
    this.logger.log('Created warehouses and stock');

    // ========== SUPPORT TICKETS ==========
    const ticketSubjects = ['Order not received', 'Wrong item delivered', 'Refund not processed', 'Product quality issue',
      'Payment failed', 'Account access issue', 'Shipping delay inquiry', 'Coupon not working', 'Size exchange', 'Warranty claim'];
    const ticketStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'OPEN', 'IN_PROGRESS'];
    for (let i = 0; i < 15; i++) {
      const ticket = await this.prisma.support_tickets.create({
        data: {
          ticket_number: `TKT-${String(i + 1).padStart(6, '0')}`,
          user_id: customers[i % customers.length].id,
          subject: ticketSubjects[i % ticketSubjects.length],
          description: `I need help with: ${ticketSubjects[i % ticketSubjects.length]}`,
          status: ticketStatuses[i % ticketStatuses.length],
          priority: i < 5 ? 'HIGH' : i < 10 ? 'MEDIUM' : 'LOW',
        },
      });
      const msgCount = this.rand(1, 3);
      for (let m = 0; m < msgCount; m++) {
        await this.prisma.ticket_messages.create({
          data: {
            ticket_id: ticket.id,
            user_id: m === 0 ? customers[i % customers.length].id : admin.id,
            message: m === 0 ? `Hi, I need help: ${ticketSubjects[i % ticketSubjects.length]}` : 'Thank you for contacting us. We\'re looking into this.',
            is_staff: m > 0,
          },
        });
      }
    }
    this.logger.log('Created 15 support tickets');

    // ========== RECENTLY VIEWED ==========
    for (let i = 0; i < 30; i++) {
      const customer = customers[i % customers.length];
      const viewCount = this.rand(3, 8);
      const usedIds = new Set<string>();
      for (let v = 0; v < viewCount; v++) {
        const product = this.pick(allProducts);
        if (usedIds.has(product.id)) continue;
        usedIds.add(product.id);
        await this.prisma.recently_viewed.create({
          data: { user_id: customer.id, product_id: product.id, viewed_at: new Date(now.getTime() - this.rand(0, 30) * 86400000) },
        });
      }
    }
    this.logger.log('Created recently viewed entries');

    // ========== PRICE ALERTS ==========
    for (let i = 0; i < 25; i++) {
      const product = this.pick(allProducts);
      const targetPrice = Number(product.price) * (0.5 + Math.random() * 0.3);
      await this.prisma.price_alerts.create({
        data: {
          user_id: customers[i % customers.length].id,
          product_id: product.id,
          target_price: Math.round(targetPrice * 100) / 100,
          active: i < 20,
        },
      });
    }
    this.logger.log('Created 25 price alerts');

    // ========== PRODUCT QUESTIONS ==========
    const questions = ['Is this available in other colors?', 'Warranty period?', 'Does it come with a case?',
      'International voltage?', 'Exact dimensions?', 'Battery life?', 'Genuine leather?', 'Can I return it?',
      'Bluetooth 5.0?', 'Gift wrapping?'];
    const answers = ['Yes, multiple colors available.', '12-month manufacturer warranty.',
      'Yes, case included.', 'Yes, 100-240V universal voltage.',
      'See specifications tab.', '8-10 hours normal usage.',
      'Yes, 100% genuine.', 'Free returns within 30 days.',
      'Yes, Bluetooth 5.0 supported.', 'Gift wrapping available $3.99.'];
    for (let i = 0; i < 30; i++) {
      const product = allProducts[i % allProducts.length];
      await this.prisma.product_questions.create({
        data: {
          product_id: product.id, user_id: this.pick(customers).id,
          question: questions[i % questions.length],
          answer: i < 20 ? answers[i % answers.length] : null,
          answered_by: i < 20 ? admin.id : null,
          status: i < 20 ? 'ANSWERED' : 'PENDING',
        },
      });
    }
    this.logger.log('Created 30 product questions');

    // ========== AUDIT LOGS ==========
    const auditActions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT'];
    const auditEntities = ['PRODUCT', 'ORDER', 'USER', 'CATEGORY', 'COUPON', 'BANNER', 'REVIEW', 'SHOP'];
    const auditData = [];
    for (let i = 0; i < 50; i++) {
      const daysAgo = this.rand(0, 30);
      auditData.push({
        action: this.pick(auditActions),
        entity_type: this.pick(auditEntities),
        entity_id: randomUUID(),
        user_id: i < 40 ? admin.id : this.pick(sellers).id,
        user_email: i < 40 ? 'admin@ecommerce.com' : `seller${this.rand(1, 15)}@ecommerce.com`,
        details: `${this.pick(auditActions)} operation on ${this.pick(auditEntities)}`,
        ip_address: `192.168.1.${this.rand(1, 254)}`,
        created_at: new Date(now.getTime() - daysAgo * 86400000),
      });
    }
    await this.prisma.audit_logs.createMany({ data: auditData });
    this.logger.log('Created 50 audit log entries');

    // ========== PRODUCT TAGS (link tags to products) ==========
    try {
    for (let i = 0; i < allProducts.length; i++) {
      const tagCount = this.rand(1, 4);
      const usedTags = new Set<string>();
      for (let t = 0; t < tagCount; t++) {
        const tag = this.pick(tags);
        if (usedTags.has(tag.id)) continue;
        usedTags.add(tag.id);
        await this.prisma.product_tags.create({ data: { product_id: allProducts[i].id, tag_id: tag.id } });
      }
    }
    this.logger.log('Linked tags to products');

    // ========== PRODUCT VARIANTS ==========
    // Map category names to variant configs
    const variantConfigsByCat: Record<string, { options: [string, string[]][] }> = {
      'Electronics': { options: [['Color', ['Black', 'Silver', 'Gold', 'Blue']], ['Storage', ['128GB', '256GB', '512GB', '1TB']]] },
      'Smartphones': { options: [['Color', ['Black', 'Silver', 'Gold', 'Blue']], ['Storage', ['128GB', '256GB', '512GB', '1TB']]] },
      'Laptops': { options: [['Color', ['Silver', 'Space Gray', 'Black']], ['Storage', ['256GB', '512GB', '1TB']]] },
      'Tablets': { options: [['Color', ['Silver', 'Space Gray', 'Blue']], ['Storage', ['64GB', '128GB', '256GB']]] },
      'Headphones': { options: [['Color', ['Black', 'White', 'Silver', 'Blue']]] },
      'Fashion': { options: [['Size', ['XS', 'S', 'M', 'L', 'XL', 'XXL']], ['Color', ['Black', 'White', 'Navy', 'Red', 'Grey']]] },
      "Men's Clothing": { options: [['Size', ['S', 'M', 'L', 'XL', 'XXL']], ['Color', ['Black', 'White', 'Navy', 'Grey']]] },
      "Women's Clothing": { options: [['Size', ['XS', 'S', 'M', 'L', 'XL']], ['Color', ['Black', 'White', 'Red', 'Pink']]] },
      'Shoes': { options: [['Size', ['38', '39', '40', '41', '42', '43', '44']], ['Color', ['Black', 'White', 'Grey']]] },
      'Sports & Outdoors': { options: [['Size', ['S', 'M', 'L', 'XL']], ['Color', ['Black', 'Blue', 'Red', 'Green']]] },
      'Beauty & Health': { options: [['Size', ['30ml', '50ml', '100ml']]] },
      'Skincare': { options: [['Size', ['30ml', '50ml', '100ml']]] },
      'Perfumes': { options: [['Size', ['50ml', '100ml', '150ml']]] },
    };

    for (const product of allProducts) {
      // Find the category for this product to determine variant config
      const productCat = allCategories.find(c => c.id === product.category_id);
      const parentCat = productCat?.parent_id ? allCategories.find(c => c.id === productCat.parent_id) : null;
      const config = variantConfigsByCat[productCat?.name] || variantConfigsByCat[parentCat?.name] || null;
      if (!config) continue;
      const [opt1Name, opt1Values] = config.options[0];
      const opt2 = config.options[1];
      const combos = opt2
        ? opt1Values.flatMap(v1 => opt2[1].map(v2 => ({ v1, v2 })))
        : opt1Values.map(v1 => ({ v1, v2: null }));
      const selected = combos.slice(0, this.rand(2, Math.min(6, combos.length)));
      for (const combo of selected) {
        const variantName = combo.v2 ? `${combo.v1} / ${combo.v2}` : combo.v1;
        const priceAdj = this.randFloat(-20, 50);
        const variant = await this.prisma.product_variants.create({
          data: {
            product_id: product.id,
            name: variantName,
            sku: `${product.sku}-${variantName.replace(/[\s\/]/g, '-').toUpperCase().substring(0, 15)}`,
            price: Math.max(Number(product.price) + priceAdj, 5),
            stock_quantity: this.rand(5, 100),
            active: true,
          },
        });
        await this.prisma.variant_option_values.create({
          data: { variant_id: variant.id, option_name: opt1Name, option_value: combo.v1 },
        });
        if (combo.v2 && opt2) {
          await this.prisma.variant_option_values.create({
            data: { variant_id: variant.id, option_name: opt2[0], option_value: combo.v2 },
          });
        }
      }
    }
    this.logger.log('Created product variants');

    // ========== PRODUCT ATTRIBUTES ==========
    const attrDefs = [
      { name: 'Brand', sort_order: 0 },
      { name: 'Weight', sort_order: 1 },
      { name: 'Material', sort_order: 2 },
      { name: 'Dimensions', sort_order: 3 },
      { name: 'Warranty', sort_order: 4 },
      { name: 'Country of Origin', sort_order: 5 },
    ];
    const attrs: any[] = [];
    for (const ad of attrDefs) {
      attrs.push(await this.prisma.product_attributes.create({ data: ad }));
    }
    const materials = ['Plastic', 'Metal', 'Leather', 'Cotton', 'Polyester', 'Wood', 'Glass', 'Silicone', 'Stainless Steel', 'Aluminum'];
    const countries = ['China', 'Vietnam', 'Japan', 'South Korea', 'USA', 'Germany', 'Italy', 'India', 'Thailand', 'Taiwan'];
    const warranties = ['6 months', '12 months', '24 months', '36 months', 'Lifetime'];
    for (const product of allProducts) {
      await this.prisma.product_attribute_values.createMany({
        data: [
          { product_id: product.id, attribute_id: attrs[1].id, value: `${this.randFloat(0.1, 15)} kg` },
          { product_id: product.id, attribute_id: attrs[2].id, value: this.pick(materials) },
          { product_id: product.id, attribute_id: attrs[3].id, value: `${this.rand(5, 80)}x${this.rand(5, 60)}x${this.rand(2, 40)} cm` },
          { product_id: product.id, attribute_id: attrs[4].id, value: this.pick(warranties) },
          { product_id: product.id, attribute_id: attrs[5].id, value: this.pick(countries) },
        ],
      });
    }
    this.logger.log('Created product attributes');

    // ========== COLLECTION PRODUCTS ==========
    const savedColls = await this.prisma.collections.findMany();
    for (const coll of savedColls) {
      const count = this.rand(5, 15);
      const usedIds = new Set<string>();
      for (let i = 0; i < count; i++) {
        const product = this.pick(allProducts);
        if (usedIds.has(product.id)) continue;
        usedIds.add(product.id);
        await this.prisma.collection_products.create({ data: { collection_id: coll.id, product_id: product.id } });
      }
    }
    this.logger.log('Linked products to collections');

    // ========== SHOP FOLLOWERS ==========
    for (const customer of customers) {
      const followCount = this.rand(0, 4);
      const usedShopIds = new Set<string>();
      for (let f = 0; f < followCount; f++) {
        const shop = this.pick(shops);
        if (usedShopIds.has(shop.id)) continue;
        usedShopIds.add(shop.id);
        await this.prisma.shop_followers.create({ data: { user_id: customer.id, shop_id: shop.id } });
      }
    }
    this.logger.log('Created shop followers');

    // ========== CHAT ROOMS & MESSAGES ==========
    for (let i = 0; i < 10; i++) {
      const buyer = customers[i];
      const shopIdx = i % shops.length;
      const room = await this.prisma.chat_rooms.create({
        data: {
          buyer_id: buyer.id, seller_id: sellers[shopIdx].id, shop_id: shops[shopIdx].id,
          active: i < 8, last_message: 'Thanks for your help!',
          last_message_at: new Date(now.getTime() - this.rand(0, 7) * 86400000),
        },
      });
      const msgs = [
        { sender_id: buyer.id, content: `Hi, I have a question about a product in your shop`, is_read: true },
        { sender_id: sellers[shopIdx].id, content: `Hello! How can I help you today?`, is_read: true },
        { sender_id: buyer.id, content: `Is this product available for immediate shipping?`, is_read: true },
        { sender_id: sellers[shopIdx].id, content: `Yes, we can ship it within 24 hours!`, is_read: i < 5 },
        { sender_id: buyer.id, content: `Thanks for your help!`, is_read: i < 3 },
      ];
      for (const msg of msgs) {
        await this.prisma.chat_messages.create({
          data: { chat_room_id: room.id, sender_id: msg.sender_id, content: msg.content, is_read: msg.is_read },
        });
      }
    }
    this.logger.log('Created 10 chat rooms with messages');

    // ========== PAYMENTS ==========
    const paidOrders = await this.prisma.orders.findMany({ where: { payment_status: 'PAID' }, take: 100 });
    for (const order of paidOrders) {
      await this.prisma.payments.create({
        data: {
          order_id: order.id, user_id: order.user_id,
          amount: order.total_amount,
          method: order.payment_method,
          status: 'COMPLETED',
          transaction_id: `TXN-${randomUUID().substring(0, 12).toUpperCase()}`,
          created_at: order.created_at,
        },
      });
    }
    this.logger.log(`Created ${paidOrders.length} payment records`);

    // ========== ORDER STATUS HISTORY ==========
    const allOrders = await this.prisma.orders.findMany({ take: 50, orderBy: { created_at: 'desc' } });
    for (const order of allOrders) {
      const statusFlow = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
      const currentIdx = statusFlow.indexOf(order.status);
      if (currentIdx < 0) continue;
      for (let si = 0; si <= currentIdx; si++) {
        const daysAfterOrder = si * this.rand(1, 3);
        await this.prisma.order_status_history.create({
          data: {
            order_id: order.id,
            status: statusFlow[si],
            note: si === 0 ? 'Order placed' : `Status updated to ${statusFlow[si]}`,
            changed_by: si === 0 ? 'System' : 'admin@ecommerce.com',
            created_at: new Date(order.created_at.getTime() + daysAfterOrder * 86400000),
          },
        });
      }
    }
    this.logger.log('Created order status history');

    // ========== REVIEW REPLIES ==========
    const someReviews = await this.prisma.reviews.findMany({ take: 30 });
    for (const review of someReviews) {
      if (Math.random() < 0.6) {
        await this.prisma.review_replies.create({
          data: {
            review_id: review.id,
            user_id: admin.id,
            reply: this.pick([
              'Thank you for your feedback! We appreciate your support.',
              'We\'re glad you love the product! Thank you for sharing.',
              'Thank you for bringing this to our attention. We\'ll work on improving.',
              'We appreciate your honest review. Your feedback helps us improve.',
              'Thank you for shopping with us! We hope to serve you again.',
            ]),
          },
        });
      }
    }
    this.logger.log('Created review replies');

    // ========== BLOG COMMENTS ==========
    const blogPostList = await this.prisma.blog_posts.findMany();
    for (const post of blogPostList) {
      const commentCount = this.rand(2, 8);
      for (let c = 0; c < commentCount; c++) {
        await this.prisma.blog_comments.create({
          data: {
            post_id: post.id,
            user_id: this.pick(customers).id,
            content: this.pick([
              'Great article! Very informative and well-written.',
              'Thanks for sharing these insights. Really helpful!',
              'I learned a lot from this post. Keep up the great work!',
              'Interesting perspective. Would love to see more content like this.',
              'This is exactly what I was looking for. Thank you!',
              'Well researched article. Bookmarked for future reference.',
              'Amazing tips! Going to try these out.',
              'Could you do a follow-up article on this topic?',
            ]),
            approved: Math.random() < 0.8,
          },
        });
      }
    }
    this.logger.log('Created blog comments');

    // ========== MEDIA FILES ==========
    const mediaData = [];
    for (let i = 0; i < 20; i++) {
      const isImage = i < 15;
      mediaData.push({
        file_name: isImage ? `product-photo-${i + 1}.jpg` : `document-${i + 1}.pdf`,
        original_name: isImage ? `photo_${i + 1}.jpg` : `report_${i + 1}.pdf`,
        content_type: isImage ? 'image/jpeg' : 'application/pdf',
        file_size: this.rand(50000, 5000000),
        url: isImage ? `https://picsum.photos/seed/${this.rand(1, 1000)}/800/800` : `https://placehold.co/800x1100?text=PDF+Document`,
        folder: isImage ? 'products' : 'documents',
      });
    }
    await this.prisma.media_files.createMany({ data: mediaData });
    this.logger.log('Created 20 media files');
    } catch (err) {
      this.logger.error('Error in extended seed sections: ' + (err as Error).message);
      this.logger.error((err as Error).stack);
    }

    // ========== ANALYTICS EVENTS ==========
    const eventTypes = ['PAGE_VIEW', 'PRODUCT_VIEW', 'ADD_TO_CART', 'PURCHASE', 'SEARCH', 'CHECKOUT_START'];
    const aeData = [];
    for (let i = 0; i < 100; i++) {
      const daysAgo = this.rand(0, 30);
      aeData.push({
        event_type: this.pick(eventTypes),
        user_id: Math.random() < 0.7 ? this.pick(customers).id : null,
        product_id: Math.random() < 0.5 ? this.pick(allProducts).id : null,
        session_id: randomUUID(),
        metadata: { source: this.pick(['organic', 'direct', 'social', 'email']), device: this.pick(['desktop', 'mobile', 'tablet']) },
        created_at: new Date(now.getTime() - daysAgo * 86400000),
      });
    }
    await this.prisma.analytics_events.createMany({ data: aeData });
    this.logger.log('Created 100 analytics events');

    // ========== DAILY ANALYTICS ==========
    const daData = [];
    for (let d = 0; d < 30; d++) {
      const date = new Date(now.getTime() - d * 86400000);
      date.setHours(0, 0, 0, 0);
      daData.push({
        date,
        order_count: this.rand(20, 80),
        revenue: this.randFloat(2000, 15000),
        new_customers: this.rand(5, 40),
        returning_customers: this.rand(10, 50),
        page_views: this.rand(1000, 10000),
        unique_visitors: this.rand(200, 2000),
        product_views: this.rand(500, 5000),
        add_to_cart_count: this.rand(100, 800),
        checkout_count: this.rand(30, 150),
        conversion_rate: this.randFloat(1.5, 5.0),
      });
    }
    await this.prisma.daily_analytics.createMany({ data: daData });
    this.logger.log('Created 30 days of analytics');

    this.logger.log('=== SEEDING COMPLETE ===');
    this.logger.log(`Users: ${2 + sellers.length + customers.length}`);
    this.logger.log(`Categories: ${allCategories.length}`);
    this.logger.log(`Brands: ${brands.length}`);
    this.logger.log(`Shops: ${shops.length}`);
    this.logger.log(`Products: ${allProducts.length}`);
  }
}
