'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  CreditCard,
  MessageSquare,
  ArrowLeft,
  Copy,
  Star,
} from 'lucide-react';
import { OrderResponse } from '@/types';
import { orderService } from '@/services';
import { cn, formatCurrency, formatDate, formatDateTime, getImageUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

const statusSteps = [
  { key: 'PENDING', label: 'Đặt hàng', icon: Clock },
  { key: 'CONFIRMED', label: 'Xác nhận', icon: CheckCircle2 },
  { key: 'PROCESSING', label: 'Đang xử lý', icon: Package },
  { key: 'SHIPPED', label: 'Đang giao', icon: Truck },
  { key: 'DELIVERED', label: 'Hoàn thành', icon: CheckCircle2 },
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

const paymentMethodMap: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng',
  STRIPE: 'Thẻ tín dụng / Ghi nợ',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
};

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const isSuccess = searchParams.get('success') === 'true';

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      toast.success('Đặt hàng thành công!', { duration: 5000 });
    }
  }, [isSuccess]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const data = await orderService.getOrderById(orderId);
        setOrder(data);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!order || !confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    try {
      setIsCancelling(true);
      await orderService.cancelOrder(order.id);
      setOrder({ ...order, status: 'CANCELLED' as any });
      toast.success('Đã hủy đơn hàng');
    } catch {
      toast.error('Không thể hủy đơn hàng');
    } finally {
      setIsCancelling(false);
    }
  };

  const copyOrderNumber = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderNumber);
    toast.success('Đã sao chép mã đơn hàng');
  };

  const getStepIndex = () => {
    if (!order) return -1;
    const normalizedStatus =
      order.status === 'IN_TRANSIT' || order.status === 'OUT_FOR_DELIVERY'
        ? 'SHIPPED'
        : order.status;
    return statusSteps.findIndex((s) => s.key === normalizedStatus);
  };

  if (isLoading) {
    return (
      <div className="container-custom py-8 max-w-4xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-24 rounded-xl mb-6" />
        <Skeleton className="h-64 rounded-xl mb-6" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-custom py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy đơn hàng</h2>
        <Link href="/orders">
          <Button>Xem đơn hàng của tôi</Button>
        </Link>
      </div>
    );
  }

  const currentStep = getStepIndex();
  const isCancelled = order.status === 'CANCELLED' || order.status === 'RETURNED';
  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';

  return (
    <div className="container-custom py-8 max-w-4xl">
      {/* Back */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Đơn hàng của tôi
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Đơn hàng #{order.orderNumber}
            <button onClick={copyOrderNumber} className="text-muted-foreground hover:text-primary">
              <Copy className="w-4 h-4" />
            </button>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ngày đặt: {formatDateTime(order.createdAt)}
          </p>
        </div>
        <Badge variant={isCancelled ? 'destructive' : 'success'} className="text-sm">
          {statusLabelMap[order.status]}
        </Badge>
      </div>

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="bg-card border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            {statusSteps.map((step, idx) => {
              const isActive = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={step.key} className="flex flex-col items-center relative flex-1">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center z-10',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span
                    className={cn(
                      'text-xs mt-2',
                      isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                  {idx < statusSteps.length - 1 && (
                    <div
                      className={cn(
                        'absolute top-5 left-1/2 w-full h-0.5',
                        idx < currentStep ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl overflow-hidden">
            <div className="border-b p-4">
              <h2 className="font-bold">Sản phẩm đã đặt</h2>
            </div>
            <div className="divide-y">
              {order.items?.map((item) => (
                <div key={item.id} className="p-4 flex gap-4">
                  <Link href={`/products/${item.productSlug || item.productId}`} className="shrink-0">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={getImageUrl(item.productImage)}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.productSlug || item.productId}`}
                      className="text-sm font-medium hover:text-primary line-clamp-2"
                    >
                      {item.productName}
                    </Link>
                    {item.variantName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Phân loại: {item.variantName}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                      <span className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-card border rounded-xl p-4">
              <h2 className="font-bold mb-4">Lịch sử đơn hàng</h2>
              <div className="space-y-4">
                {order.statusHistory.map((history, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="relative">
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full mt-1',
                          idx === 0 ? 'bg-primary' : 'bg-muted'
                        )}
                      />
                      {idx < order.statusHistory!.length - 1 && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-px h-full bg-muted" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">{statusLabelMap[history.status] || history.status}</p>
                      {history.note && (
                        <p className="text-xs text-muted-foreground">{history.note}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(history.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Address */}
          <div className="bg-card border rounded-xl p-4">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary" />
              Địa chỉ nhận hàng
            </h3>
            {order.shippingAddress && (
              <div className="text-sm">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
                <p className="text-muted-foreground mt-1">
                  {[order.shippingAddress.addressLine1, order.shippingAddress.city, order.shippingAddress.province, order.shippingAddress.country].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-card border rounded-xl p-4">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-primary" />
              Thanh toán
            </h3>
            <p className="text-sm">{paymentMethodMap[order.paymentMethod] || order.paymentMethod}</p>
            <Badge
              variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
              className="mt-2"
            >
              {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </Badge>
          </div>

          {/* Summary */}
          <div className="bg-card border rounded-xl p-4">
            <h3 className="font-bold text-sm mb-3">Chi tiết thanh toán</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span>{order.shippingFee === 0 ? 'Miễn phí' : formatCurrency(order.shippingFee)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Tổng cộng</span>
                <span className="text-destructive text-lg">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {canCancel && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleCancelOrder}
                isLoading={isCancelling}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Hủy đơn hàng
              </Button>
            )}
            {order.status === 'DELIVERED' && (
              <Link href={`/reviews/create?orderId=${order.id}`}>
                <Button variant="outline" className="w-full">
                  <Star className="w-4 h-4 mr-2" />
                  Đánh giá sản phẩm
                </Button>
              </Link>
            )}
            <Link href={`/chat?orderId=${order.id}`}>
              <Button variant="outline" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                Liên hệ hỗ trợ
              </Button>
            </Link>
          </div>

          {/* Note */}
          {order.note && (
            <div className="bg-muted/30 border rounded-xl p-4">
              <h3 className="font-bold text-sm mb-2">Ghi chú</h3>
              <p className="text-sm text-muted-foreground">{order.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
