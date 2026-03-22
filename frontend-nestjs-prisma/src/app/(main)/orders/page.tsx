'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Clock,
  ChevronRight,
  Search,
  Filter,
  ShoppingBag,
} from 'lucide-react';
import { OrderResponse, PageResponse, OrderStatus } from '@/types';
import { orderService } from '@/services';
import { cn, formatCurrency, formatDate, getOrderStatusColor, getImageUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';

const ORDER_STATUSES: { value: string; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'PROCESSING', label: 'Đang xử lý' },
  { value: 'SHIPPED', label: 'Đã bàn giao vận chuyển' },
  { value: 'IN_TRANSIT', label: 'Đang vận chuyển' },
  { value: 'OUT_FOR_DELIVERY', label: 'Đang giao tới bạn' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'RETURNED', label: 'Trả hàng' },
];

const statusLabelMap: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPED: 'Đã bàn giao vận chuyển',
  IN_TRANSIT: 'Đang vận chuyển',
  OUT_FOR_DELIVERY: 'Đang giao tới bạn',
  DELIVERED: 'Đã giao hàng',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Trả hàng',
  REFUNDED: 'Đã hoàn tiền',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<PageResponse<OrderResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await orderService.getMyOrders({
        page,
        size: 10,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchOrders();
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>

      {/* Filters */}
      <div className="bg-card border rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {ORDER_STATUSES.map((status) => (
            <button
              key={status.value}
              onClick={() => {
                setStatusFilter(status.value);
                setPage(0);
              }}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                statusFilter === status.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {status.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Tìm theo mã đơn hàng hoặc tên sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="flex-1"
          />
          <Button type="submit" variant="outline">
            Tìm kiếm
          </Button>
        </form>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : !orders?.content || orders.content.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Chưa có đơn hàng nào</h2>
          <p className="text-muted-foreground mb-6">Bắt đầu mua sắm để tạo đơn hàng đầu tiên</p>
          <Link href="/products">
            <Button>Mua sắm ngay</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.content.map((order) => {
            const statusColor = getOrderStatusColor(order.status);
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">#{order.orderNumber}</span>
                    <span className="text-xs text-muted-foreground">|</span>
                    <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                  </div>
                  <Badge variant={statusColor as any}>
                    {statusLabelMap[order.status] || order.status}
                  </Badge>
                </div>

                {/* Items */}
                <div className="p-4">
                  <div className="space-y-3">
                    {order.items?.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img
                            src={getImageUrl(item.productImage)}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                          {item.variantName && (
                            <p className="text-xs text-muted-foreground">
                              Phân loại: {item.variantName}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <span className="text-sm font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    {order.items && order.items.length > 2 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{order.items.length - 2} sản phẩm khác
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {order.items?.length} sản phẩm
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Tổng:</span>
                      <span className="text-lg font-bold text-destructive">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {orders && orders.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={page + 1}
            totalPages={orders.totalPages}
            onPageChange={(p) => setPage(p - 1)}
          />
        </div>
      )}
    </div>
  );
}
