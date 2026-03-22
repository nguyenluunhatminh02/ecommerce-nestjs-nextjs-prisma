import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug } from '../common/utils/slug.util';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  private productInclude = {
    categories: true,
    brands: true,
    shops: { select: { id: true, name: true, slug: true, logo_url: true, verified: true, rating: true } },
    images: { orderBy: { sort_order: 'asc' as const } },
    variants: { include: { option_values: true } },
    attribute_values: { include: { product_attributes: true } },
    product_tags: { include: { tags: true } },
  };

  private mapToResponse(product: any) {
    if (!product) return null;
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.short_description,
      price: Number(product.price),
      compareAtPrice: product.compare_at_price ? Number(product.compare_at_price) : null,
      costPrice: product.cost_price ? Number(product.cost_price) : null,
      sku: product.sku,
      stockQuantity: product.stock_quantity,
      lowStockThreshold: product.low_stock_threshold,
      trackQuantity: product.track_quantity,
      allowBackorder: product.allow_backorder,
      weight: product.weight,
      weightUnit: product.weight_unit,
      categoryId: product.category_id,
      brandId: product.brand_id,
      shopId: product.shop_id,
      status: product.status,
      featured: product.featured,
      isFeatured: product.featured,
      averageRating: product.average_rating ?? 0,
      reviewCount: product.review_count ?? 0,
      totalReviews: product.review_count ?? 0,
      salesCount: product.sales_count ?? 0,
      totalSold: product.sales_count ?? 0,
      viewCount: product.view_count ?? 0,
      quantity: product.stock_quantity ?? 0,
      metaTitle: product.meta_title,
      metaDescription: product.meta_description,
      freeShipping: product.free_shipping,
      isDigital: product.is_digital,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      category: product.categories ? { id: product.categories.id, name: product.categories.name, slug: product.categories.slug } : null,
      brand: product.brands ? { id: product.brands.id, name: product.brands.name, slug: product.brands.slug, logoUrl: product.brands.logo_url } : null,
      shop: product.shops ? { id: product.shops.id, name: product.shops.name, slug: product.shops.slug, logoUrl: product.shops.logo_url, verified: product.shops.verified, isVerified: product.shops.verified, rating: product.shops.rating } : null,
      images: (product.images || []).map((img: any) => ({ id: img.id, url: img.image_url, imageUrl: img.image_url, altText: img.alt_text, sortOrder: img.sort_order, isPrimary: img.is_primary })),
      variants: (product.variants || []).map((v: any) => ({
        id: v.id, name: v.name, sku: v.sku, price: Number(v.price),
        compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : null,
        stockQuantity: v.stock_quantity, quantity: v.stock_quantity, imageUrl: v.image_url, active: v.active,
        optionValues: (v.option_values || []).map((ov: any) => ({ id: ov.id, optionName: ov.option_name, optionValue: ov.option_value })),
      })),
      attributeValues: (product.attribute_values || []).map((av: any) => ({
        id: av.id, value: av.value, displayValue: av.value,
        attributeId: av.product_attributes?.id, attributeName: av.product_attributes?.name,
        attribute: av.product_attributes ? { id: av.product_attributes.id, name: av.product_attributes.name } : null,
      })),
      tags: (product.product_tags || []).map((pt: any) => ({ id: pt.tags?.id, name: pt.tags?.name, slug: pt.tags?.slug })),
    };
  }

  async filter(params: {
    page?: number; size?: number; search?: string; categoryId?: string; categorySlug?: string;
    brandId?: string; shopId?: string; minPrice?: number; maxPrice?: number;
    minRating?: number; status?: string; featured?: boolean; sortBy?: string; sortDir?: string;
    inStock?: boolean; onSale?: boolean;
  }) {
    const page = +(params.page ?? 0);
    const size = +(params.size ?? 20);
    const where: any = { deleted: false, status: params.status || 'ACTIVE' };
    if (params.search) where.OR = [{ name: { contains: params.search, mode: 'insensitive' } }, { description: { contains: params.search, mode: 'insensitive' } }];
    if (params.categoryId) {
      // Include products from child categories when filtering by parent
      const childCats = await this.prisma.categories.findMany({ where: { parent_id: params.categoryId, deleted: false }, select: { id: true } });
      if (childCats.length > 0) {
        where.category_id = { in: [params.categoryId, ...childCats.map(c => c.id)] };
      } else {
        where.category_id = params.categoryId;
      }
    }
    if (params.categorySlug) where.categories = { slug: params.categorySlug };
    if (params.brandId) where.brand_id = params.brandId;
    if (params.shopId) where.shop_id = params.shopId;
    if (Number.isFinite(+params.minPrice)) where.price = { ...(where.price || {}), gte: +params.minPrice };
    if (Number.isFinite(+params.maxPrice)) where.price = { ...(where.price || {}), lte: +params.maxPrice };
    if (Number.isFinite(+params.minRating)) where.average_rating = { gte: +params.minRating };
    if (params.featured === true || params.featured === ('true' as any)) where.featured = true;
    if (params.inStock) where.stock_quantity = { gt: 0 };
    if (params.onSale) where.compare_at_price = { not: null };
    const sortMap: Record<string, string> = { createdAt: 'created_at', price: 'price', name: 'name', rating: 'average_rating', sales: 'sales_count', views: 'view_count' };
    const sortField = sortMap[params.sortBy] || 'created_at';
    const sortDir = (params.sortDir || 'desc').toLowerCase() as 'asc' | 'desc';
    const [products, total] = await Promise.all([
      this.prisma.products.findMany({ where, skip: page * size, take: size, orderBy: { [sortField]: sortDir }, include: this.productInclude }),
      this.prisma.products.count({ where }),
    ]);
    const totalPages = Math.ceil(total / Math.max(size, 1));
    return { content: products.map(p => this.mapToResponse(p)), page, size, totalElements: total, totalPages, first: page === 0, last: page >= totalPages - 1 };
  }

  async findById(id: string) {
    const product = await this.prisma.products.findUnique({ where: { id }, include: this.productInclude });
    if (!product || product.deleted) throw new NotFoundException('Product not found');
    return this.mapToResponse(product);
  }

  async findBySlug(slug: string) {
    let product = await this.prisma.products.findUnique({ where: { slug }, include: this.productInclude });
    if (!product || product.deleted) {
      product = await this.prisma.products.findFirst({ where: { slug: { startsWith: slug }, deleted: false }, include: this.productInclude });
    }
    if (!product) throw new NotFoundException('Product not found');
    await this.prisma.products.update({ where: { id: product.id }, data: { view_count: { increment: 1 } } });
    return this.mapToResponse(product);
  }

  async findByIds(ids: string[]) {
    if (!ids.length) return [];
    const products = await this.prisma.products.findMany({ where: { id: { in: ids }, deleted: false }, include: this.productInclude });
    return products.map(p => this.mapToResponse(p));
  }

  async getFeatured(page = 0, size = 20) { return this.filter({ page, size, featured: true }); }
  async getNewArrivals(page = 0, size = 20) { return this.filter({ page, size, sortBy: 'createdAt', sortDir: 'desc' }); }
  async getBestSellers(page = 0, size = 20) { return this.filter({ page, size, sortBy: 'sales', sortDir: 'desc' }); }
  async getDeals(page = 0, size = 20) { return this.filter({ page, size, onSale: true }); }

  async getRelated(productId: string, size = 10) {
    const product = await this.prisma.products.findUnique({ where: { id: productId } });
    if (!product) return { content: [], page: 0, size, totalElements: 0, totalPages: 0, first: true, last: true };
    const products = await this.prisma.products.findMany({
      where: { category_id: product.category_id, id: { not: productId }, deleted: false, status: 'ACTIVE' },
      take: size, orderBy: { sales_count: 'desc' }, include: this.productInclude,
    });
    return { content: products.map(p => this.mapToResponse(p)), page: 0, size, totalElements: products.length, totalPages: 1, first: true, last: true };
  }

  async getShopProducts(shopId: string, page = 0, size = 20) { return this.filter({ page, size, shopId }); }

  async create(data: any, userId: string) {
    const shop = await this.prisma.shops.findFirst({ where: { user_id: userId, deleted: false } });
    if (!shop) throw new ForbiddenException('You must have a shop to create products');
    const slug = generateSlug(data.name) + '-' + Date.now().toString(36);
    const product = await this.prisma.products.create({
      data: {
        name: data.name, slug, description: data.description, short_description: data.shortDescription,
        price: data.price, compare_at_price: data.compareAtPrice, cost_price: data.costPrice,
        sku: data.sku, stock_quantity: data.stockQuantity ?? 0, low_stock_threshold: data.lowStockThreshold ?? 10,
        track_quantity: data.trackQuantity ?? true, weight: data.weight, weight_unit: data.weightUnit,
        category_id: data.categoryId, brand_id: data.brandId, shop_id: shop.id,
        status: data.status || 'ACTIVE', featured: data.featured ?? false,
        free_shipping: data.freeShipping ?? false, is_digital: data.isDigital ?? false,
        meta_title: data.metaTitle, meta_description: data.metaDescription,
      },
    });
    if (data.images?.length) {
      await this.prisma.product_images.createMany({
        data: data.images.map((img: any, i: number) => ({ product_id: product.id, image_url: img.url || img.imageUrl, alt_text: img.alt || img.altText, sort_order: i, is_primary: i === 0 })),
      });
    }
    if (data.variants?.length) {
      for (const v of data.variants) {
        const variant = await this.prisma.product_variants.create({
          data: { product_id: product.id, name: v.name, sku: v.sku, price: v.price, compare_at_price: v.compareAtPrice, stock_quantity: v.stockQuantity ?? v.stock ?? 0, image_url: v.imageUrl },
        });
        if (v.optionValues?.length) {
          await this.prisma.variant_option_values.createMany({ data: v.optionValues.map((ov: any) => ({ variant_id: variant.id, option_name: ov.optionName, option_value: ov.optionValue })) });
        }
      }
    }
    if (data.tagIds?.length) { await this.prisma.product_tags.createMany({ data: data.tagIds.map((tagId: string) => ({ product_id: product.id, tag_id: tagId })) }); }
    return this.findById(product.id);
  }

  async update(id: string, data: any, userId: string) {
    const product = await this.prisma.products.findUnique({ where: { id } });
    if (!product || product.deleted) throw new NotFoundException('Product not found');
    const shop = await this.prisma.shops.findFirst({ where: { user_id: userId, deleted: false } });
    if (!shop || product.shop_id !== shop.id) throw new ForbiddenException();
    const u: any = {};
    if (data.name) { u.name = data.name; u.slug = generateSlug(data.name) + '-' + Date.now().toString(36); }
    if (data.description !== undefined) u.description = data.description;
    if (data.shortDescription !== undefined) u.short_description = data.shortDescription;
    if (data.price !== undefined) u.price = data.price;
    if (data.compareAtPrice !== undefined) u.compare_at_price = data.compareAtPrice;
    if (data.costPrice !== undefined) u.cost_price = data.costPrice;
    if (data.sku !== undefined) u.sku = data.sku;
    if (data.stockQuantity !== undefined) u.stock_quantity = data.stockQuantity;
    if (data.featured !== undefined) u.featured = data.featured;
    if (data.status !== undefined) u.status = data.status;
    if (data.categoryId !== undefined) u.category_id = data.categoryId;
    if (data.brandId !== undefined) u.brand_id = data.brandId;
    if (data.metaTitle !== undefined) u.meta_title = data.metaTitle;
    if (data.metaDescription !== undefined) u.meta_description = data.metaDescription;
    await this.prisma.products.update({ where: { id }, data: u });
    return this.findById(id);
  }

  async delete(id: string, userId: string) {
    const product = await this.prisma.products.findUnique({ where: { id } });
    if (!product || product.deleted) throw new NotFoundException();
    const shop = await this.prisma.shops.findFirst({ where: { user_id: userId, deleted: false } });
    if (!shop || product.shop_id !== shop.id) throw new ForbiddenException();
    await this.prisma.products.update({ where: { id }, data: { deleted: true } });
  }

  async publish(id: string) {
    await this.prisma.products.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  async recordView(userId: string, productId: string) {
    const existing = await this.prisma.recently_viewed.findFirst({ where: { user_id: userId, product_id: productId } });
    if (existing) await this.prisma.recently_viewed.update({ where: { id: existing.id }, data: { viewed_at: new Date() } });
    else await this.prisma.recently_viewed.create({ data: { user_id: userId, product_id: productId } });
  }

  async getRecentlyViewed(userId: string, limit = 20) {
    const views = await this.prisma.recently_viewed.findMany({ where: { user_id: userId }, orderBy: { viewed_at: 'desc' }, take: +limit, include: { products: { include: this.productInclude } } });
    return views.map(v => this.mapToResponse(v.products));
  }
}
