import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAdminDashboard() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers, totalOrders, totalProducts, totalShops,
      todayOrders, monthOrders, pendingOrders, totalRevenue,
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.orders.count(),
      this.prisma.products.count({ where: { deleted: false } }),
      this.prisma.shops.count({ where: { deleted: false } }),
      this.prisma.orders.count({ where: { created_at: { gte: todayStart } } }),
      this.prisma.orders.count({ where: { created_at: { gte: monthStart } } }),
      this.prisma.orders.count({ where: { status: 'PENDING' } }),
      this.prisma.orders.aggregate({ _sum: { total_amount: true } }),
    ]);

    return {
      totalUsers, totalOrders, totalProducts, totalShops,
      todayOrders, monthOrders, pendingOrders,
      totalRevenue: Number(totalRevenue._sum.total_amount || 0),
    };
  }

  async getSellerDashboard(shopId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const [
      shop, totalProducts, totalOrders, monthOrders, todayOrders,
      revenue, monthRevenue, todayRevenue, pendingOrders, lowStockProducts,
      orderStatusRows, topProductRows, topCategoryRows, revenueChartRows,
    ] = await Promise.all([
      this.prisma.shops.findUnique({ where: { id: shopId }, select: { id: true, name: true, follower_count: true, rating: true } }),
      this.prisma.products.count({ where: { shop_id: shopId, deleted: false } }),
      this.prisma.order_items.count({ where: { products: { shop_id: shopId } } }),
      this.prisma.order_items.count({ where: { products: { shop_id: shopId }, orders: { created_at: { gte: monthStart } } } }),
      this.prisma.order_items.count({ where: { products: { shop_id: shopId }, orders: { created_at: { gte: todayStart } } } }),
      this.prisma.order_items.aggregate({ where: { products: { shop_id: shopId } }, _sum: { subtotal: true } }),
      this.prisma.order_items.aggregate({ where: { products: { shop_id: shopId }, orders: { created_at: { gte: monthStart } } }, _sum: { subtotal: true } }),
      this.prisma.order_items.aggregate({ where: { products: { shop_id: shopId }, orders: { created_at: { gte: todayStart } } }, _sum: { subtotal: true } }),
      this.prisma.order_items.count({ where: { products: { shop_id: shopId }, orders: { status: 'PENDING' } } }),
      this.prisma.products.count({ where: { shop_id: shopId, deleted: false, stock_quantity: { lte: 5 } } }),
      this.prisma.$queryRawUnsafe(`
        SELECT o.status, COUNT(DISTINCT o.id)::int as count
        FROM orders o JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE p.shop_id = $1
        GROUP BY o.status
      `, shopId) as Promise<{ status: string; count: number }[]>,
      this.prisma.$queryRawUnsafe(`
        SELECT p.name as "productName",
          (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) as "productImage",
          COALESCE(SUM(oi.quantity), 0)::int as "totalSold",
          COALESCE(SUM(oi.subtotal), 0) as revenue
        FROM order_items oi JOIN products p ON oi.product_id = p.id
        WHERE p.shop_id = $1
        GROUP BY p.id, p.name
        ORDER BY "totalSold" DESC LIMIT 5
      `, shopId) as Promise<any[]>,
      this.prisma.$queryRawUnsafe(`
        SELECT c.name as "categoryName", COUNT(DISTINCT p.id)::int as "productCount",
          COALESCE(SUM(oi.subtotal), 0) as revenue
        FROM products p JOIN categories c ON p.category_id = c.id
        LEFT JOIN order_items oi ON oi.product_id = p.id
        WHERE p.shop_id = $1 AND p.deleted = false
        GROUP BY c.id, c.name ORDER BY revenue DESC LIMIT 5
      `, shopId) as Promise<any[]>,
      this.prisma.$queryRawUnsafe(`
        SELECT DATE(o.created_at) as date, COALESCE(SUM(oi.subtotal), 0) as revenue,
          COUNT(DISTINCT o.id)::int as orders
        FROM orders o JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE p.shop_id = $1 AND o.created_at >= $2
        GROUP BY DATE(o.created_at) ORDER BY date
      `, shopId, thirtyDaysAgo) as Promise<any[]>,
    ]);

    const orderStatusDistribution: Record<string, number> = {};
    for (const row of (orderStatusRows as any[])) {
      orderStatusDistribution[row.status] = Number(row.count);
    }

    return {
      shop, totalProducts, totalOrders, monthOrders, todayOrders, pendingOrders,
      lowStockProducts,
      totalRevenue: Number(revenue._sum.subtotal || 0),
      monthlyRevenue: Number(monthRevenue._sum.subtotal || 0),
      todayRevenue: Number(todayRevenue._sum.subtotal || 0),
      orderStatusDistribution,
      topProducts: (topProductRows as any[]).map(r => ({ ...r, revenue: Number(r.revenue) })),
      topCategories: (topCategoryRows as any[]).map(r => ({ ...r, revenue: Number(r.revenue) })),
      revenueChart: (revenueChartRows as any[]).map(r => ({ date: r.date, revenue: Number(r.revenue), orders: Number(r.orders) })),
    };
  }

  async getRevenueChart(days = 30) {
    const from = new Date(Date.now() - days * 86400000);
    const rows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT DATE(created_at) as date, SUM(total_amount) as revenue, COUNT(*) as orders
      FROM orders WHERE created_at >= $1
      GROUP BY DATE(created_at) ORDER BY date
    `, from);
    return rows.map(r => ({ date: r.date, revenue: Number(r.revenue || 0), orders: Number(r.orders) }));
  }

  async getOrdersChart(days = 30) {
    const from = new Date(Date.now() - days * 86400000);
    const rows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT DATE(created_at) as date, status, COUNT(*) as count
      FROM orders WHERE created_at >= $1
      GROUP BY DATE(created_at), status ORDER BY date
    `, from);
    return rows.map(r => ({ date: r.date, status: r.status, count: Number(r.count) }));
  }
}
