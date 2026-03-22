import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  private orderInclude = {
    items: { include: { products: { select: { id: true, name: true, slug: true, images: { take: 1 } } } } },
    status_history: { orderBy: { created_at: 'desc' as const } },
  };

  async getMyOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.orders.findMany({ where: { user_id: userId }, skip, take: limit, orderBy: { created_at: 'desc' }, include: this.orderInclude }),
      this.prisma.orders.count({ where: { user_id: userId } }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return { content: items, items, total, totalElements: total, page, size: limit, limit, totalPages, first: page <= 1, last: page >= totalPages };
  }

  async getById(userId: string, id: string) {
    const order = await this.prisma.orders.findFirst({ where: { id, user_id: userId }, include: this.orderInclude });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(userId: string, dto: any) {
    const cart = await this.prisma.carts.findFirst({
      where: { user_id: userId },
      include: { items: { include: { products: { include: { images: { take: 1, orderBy: { sort_order: 'asc' as const } } } }, product_variants: true } } },
    });
    if (!cart || !cart.items.length) throw new BadRequestException('Cart is empty');

    let subtotal = 0;
    for (const item of cart.items) {
      if (item.products.stock_quantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${item.products.name}`);
      }
      subtotal += Number(item.price) * item.quantity;
    }

    let discount = 0;
    if (cart.coupon_code) {
      const coupon = await this.prisma.coupons.findFirst({ where: { code: cart.coupon_code, active: true } });
      if (coupon) {
        discount = coupon.discount_type === 'PERCENTAGE'
          ? subtotal * Number(coupon.discount_value) / 100
          : Number(coupon.discount_value);
        if (coupon.maximum_discount && discount > Number(coupon.maximum_discount)) discount = Number(coupon.maximum_discount);
      }
    }

    const shippingFee = dto.shippingFee || 0;
    const tax = dto.tax || 0;
    const totalAmount = subtotal - discount + shippingFee + tax;

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const order = await this.prisma.orders.create({
      data: {
        order_number: orderNumber,
        user_id: userId,
        subtotal,
        discount,
        shipping_fee: shippingFee,
        tax,
        total_amount: totalAmount,
        coupon_code: cart.coupon_code,
        payment_method: dto.paymentMethod || 'COD',
        note: dto.note,
        shipping_full_name: dto.shippingFullName,
        shipping_phone: dto.shippingPhone,
        shipping_address_line1: dto.shippingAddressLine1,
        shipping_address_line2: dto.shippingAddressLine2,
        shipping_city: dto.shippingCity,
        shipping_state: dto.shippingState,
        shipping_postal_code: dto.shippingPostalCode,
        shipping_country: dto.shippingCountry,
        status: 'PENDING',
        items: {
          create: cart.items.map((item) => ({
            product_id: item.product_id,
            product_name: item.products.name,
            product_image: item.products.images?.[0]?.image_url ?? null,
            variant_name: item.product_variants?.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: Number(item.price) * item.quantity,
          })),
        },
        status_history: {
          create: { status: 'PENDING', note: 'Order placed' },
        },
      },
      include: this.orderInclude,
    });

    // Update stock
    for (const item of cart.items) {
      await this.prisma.products.update({
        where: { id: item.product_id },
        data: { stock_quantity: { decrement: item.quantity }, sales_count: { increment: item.quantity } },
      });
    }

    // Update coupon usage
    if (cart.coupon_code) {
      await this.prisma.coupons.updateMany({
        where: { code: cart.coupon_code },
        data: { usage_count: { increment: 1 } },
      });
    }

    // Clear cart
    await this.prisma.cart_items.deleteMany({ where: { cart_id: cart.id } });
    await this.prisma.carts.update({ where: { id: cart.id }, data: { coupon_code: null } });

    return order;
  }

  async cancelOrder(userId: string, id: string) {
    const order = await this.getById(userId, id);
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException('Cannot cancel this order');
    }
    // Restore stock
    for (const item of order.items) {
      await this.prisma.products.update({
        where: { id: item.product_id },
        data: { stock_quantity: { increment: item.quantity }, sales_count: { decrement: item.quantity } },
      });
    }
    return this.prisma.orders.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        status_history: { create: { status: 'CANCELLED', note: 'Cancelled by user' } },
      },
      include: this.orderInclude,
    });
  }

  // Admin methods
  async getAllOrders(query: any) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (+page - 1) * +limit;
    const where: any = {};
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      this.prisma.orders.findMany({ where, skip, take: +limit, orderBy: { created_at: 'desc' }, include: { ...this.orderInclude, users: { select: { id: true, first_name: true, last_name: true, email: true } } } }),
      this.prisma.orders.count({ where }),
    ]);
    const totalPages = Math.ceil(total / +limit);
    return { content: items, items, total, totalElements: total, page: +page, size: +limit, limit: +limit, totalPages, first: +page <= 1, last: +page >= totalPages };
  }

  async updateStatus(id: string, status: string, note?: string) {
    return this.prisma.orders.update({
      where: { id },
      data: {
        status,
        status_history: { create: { status, note } },
      },
      include: this.orderInclude,
    });
  }

  async findByNumber(orderNumber: string, userId?: string) {
    const where: any = { order_number: orderNumber };
    if (userId) where.user_id = userId;
    const order = await this.prisma.orders.findFirst({ where, include: this.orderInclude });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getShopOrders(shopId: string, query: any) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (+page - 1) * +limit;
    const where: any = {};
    if (status) where.status = status;
    // Filter orders that contain items from this shop's products
    where.items = { some: { products: { shop_id: shopId } } };
    const [items, total] = await Promise.all([
      this.prisma.orders.findMany({ where, skip, take: +limit, orderBy: { created_at: 'desc' }, include: { ...this.orderInclude, users: { select: { id: true, first_name: true, last_name: true, email: true } } } }),
      this.prisma.orders.count({ where }),
    ]);
    const totalPages = Math.ceil(total / +limit);
    return { content: items, items, total, totalElements: total, page: +page, size: +limit, limit: +limit, totalPages, first: +page <= 1, last: +page >= totalPages };
  }
}
