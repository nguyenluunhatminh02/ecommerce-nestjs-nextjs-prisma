import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.carts.findFirst({ where: { user_id: userId } });
    if (!cart) {
      cart = await this.prisma.carts.create({ data: { user_id: userId } });
    }
    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const raw = await this.prisma.carts.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            products: {
              select: {
                id: true, name: true, slug: true, price: true, compare_at_price: true, stock_quantity: true,
                shop_id: true,
                shops: { select: { id: true, name: true, slug: true } },
                images: { take: 1, orderBy: { sort_order: 'asc' } },
              },
            },
            product_variants: true,
          },
        },
      },
    });
    return this.mapCartToResponse(raw);
  }

  private mapCartToResponse(cart: any) {
    if (!cart) return null;
    const items = (cart.items || []).map((item: any) => {
      const product = item.products;
      const variant = item.product_variants;
      const price = Number(variant?.price ?? item.price);
      const compareAtPrice = variant?.compare_at_price != null
        ? Number(variant.compare_at_price)
        : product?.compare_at_price != null
          ? Number(product.compare_at_price)
          : null;
      return {
        id: item.id,
        productId: product?.id ?? item.product_id,
        productName: product?.name ?? 'Sản phẩm',
        productSlug: product?.slug ?? '',
        productImage: product?.images?.[0]?.image_url ?? null,
        variantId: item.variant_id ?? null,
        variantName: variant?.name ?? null,
        shopId: product?.shop_id ?? '',
        shopName: product?.shops?.name ?? 'Shop',
        shopSlug: product?.shops?.slug ?? '',
        price,
        compareAtPrice,
        quantity: item.quantity,
        subtotal: price * item.quantity,
        maxQuantity: variant?.stock_quantity ?? product?.stock_quantity ?? 99,
        inStock: (variant?.stock_quantity ?? product?.stock_quantity ?? 0) > 0,
      };
    });
    const subtotal = items.reduce((s: number, i: any) => s + i.subtotal, 0);
    const discount = Number(cart.discount_amount ?? 0);
    return {
      id: cart.id,
      items,
      totalItems: items.reduce((s: number, i: any) => s + i.quantity, 0),
      subtotal,
      discount,
      total: subtotal - discount,
      couponCode: cart.coupon_code ?? null,
    };
  }

  async addItem(userId: string, dto: { productId: string; variantId?: string; quantity: number }) {
    const cart = await this.getOrCreateCart(userId);
    const product = await this.prisma.products.findUnique({ where: { id: dto.productId } });
    if (!product || product.deleted) throw new NotFoundException('Product not found');
    if (product.stock_quantity < dto.quantity) throw new BadRequestException('Insufficient stock');

    const existingItem = await this.prisma.cart_items.findFirst({
      where: { cart_id: cart.id, product_id: dto.productId, variant_id: dto.variantId || null },
    });

    if (existingItem) {
      await this.prisma.cart_items.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + dto.quantity },
      });
    } else {
      await this.prisma.cart_items.create({
        data: {
          cart_id: cart.id,
          product_id: dto.productId,
          variant_id: dto.variantId,
          quantity: dto.quantity,
          price: product.price,
        },
      });
    }
    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cart_items.findFirst({ where: { id: itemId, cart_id: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');
    if (quantity <= 0) {
      await this.prisma.cart_items.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cart_items.update({ where: { id: itemId }, data: { quantity } });
    }
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cart_items.findFirst({ where: { id: itemId, cart_id: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');
    await this.prisma.cart_items.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cart_items.deleteMany({ where: { cart_id: cart.id } });
    return { message: 'Cart cleared' };
  }

  async applyCoupon(userId: string, couponCode: string) {
    const cart = await this.getOrCreateCart(userId);
    const coupon = await this.prisma.coupons.findFirst({
      where: { code: couponCode, active: true, deleted: false, end_date: { gt: new Date() } },
    });
    if (!coupon) throw new NotFoundException('Invalid coupon');
    if (coupon.usage_count >= coupon.usage_limit) throw new BadRequestException('Coupon usage limit reached');
    await this.prisma.carts.update({ where: { id: cart.id }, data: { coupon_code: couponCode } });
    return this.getCart(userId);
  }

  async removeCoupon(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.carts.update({ where: { id: cart.id }, data: { coupon_code: null } });
    return this.getCart(userId);
  }

  async getCount(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    return this.prisma.cart_items.aggregate({
      where: { cart_id: cart.id },
      _sum: { quantity: true },
    }).then((res) => res._sum.quantity ?? 0);
  }
}
