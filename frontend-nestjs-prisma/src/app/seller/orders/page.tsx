'use client';

import { useEffect, useState, useCallback } from 'react';
import { ShoppingBag, CheckCircle, Package, Truck, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatCurrency, getImageUrl } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  shippingFee: number;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    province: string;
  };
  createdAt: string;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default'; icon: typeof CheckCircle }> = {
  PENDING: { label: 'Chờ xác nhận', variant: 'warning', icon: Package },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'info', icon: CheckCircle },
  PROCESSING: { label: 'Đang xử lý', variant: 'info', icon: Package },
  SHIPPED: { label: 'Đang giao', variant: 'default', icon: Truck },
  DELIVERED: { label: 'Đã giao', variant: 'success', icon: CheckCircle },
  CANCELLED: { label: 'Đã hủy', variant: 'error', icon: XCircle },
};

const nextStatusMap: Record<string, { status: string; label: string; color: string }> = {
  PENDING: { status: 'CONFIRMED', label: 'Xác nhận đơn', color: 'bg-blue-600 hover:bg-blue-700' },
  CONFIRMED: { status: 'PROCESSING', label: 'Bắt đầu xử lý', color: 'bg-indigo-600 hover:bg-indigo-700' },
  PROCESSING: { status: 'SHIPPED', label: 'Giao cho vận chuyển', color: 'bg-purple-600 hover:bg-purple-700' },
  SHIPPED: { status: 'DELIVERED', label: 'Xác nhận đã giao', color: 'bg-green-600 hover:bg-green-700' },
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [shopId, setShopId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelNote, setCancelNote] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await apiClient.get('/shops/my-shop');
        if (!res.data.data) return;
        setShopId(res.data.data.id);
      } catch (err) {
        console.error('Failed to fetch shop:', err);
      }
    };
    fetchShop();
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!shopId) return;
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10',
      });
      if (statusFilter) params.set('status', statusFilter);
      const res = await apiClient.get(`/orders/shop/${shopId}?${params}`);
      const data = res.data.data;
      setOrders(data.content || data.items || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string, note?: string) => {
    setUpdatingOrderId(orderId);
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status: newStatus, note });
      setToast({ message: `Cập nhật trạng thái thành công!`, type: 'success' });
      setCancellingOrderId(null);
      setCancelNote('');
      await fetchOrders();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Cập nhật thất bại';
      setToast({ message: msg, type: 'error' });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <p className="text-muted-foreground">{totalElements} đơn hàng</p>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setStatusFilter(''); setPage(0); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            !statusFilter ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 border border-border hover:bg-muted'
          }`}
        >
          Tất cả
        </button>
        {Object.entries(statusConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => { setStatusFilter(key); setPage(0); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === key ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 border border-border hover:bg-muted'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
              <Skeleton className="h-32 w-full" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-12 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Không có đơn hàng nào</p>
          </div>
        ) : (
          orders.map((order) => {
            const status = statusConfig[order.status] || { label: order.status, variant: 'default' as const, icon: Package };
            const nextAction = nextStatusMap[order.status];
            const isUpdating = updatingOrderId === order.id;
            const isCancelling = cancellingOrderId === order.id;
            const canCancel = !['DELIVERED', 'CANCELLED', 'SHIPPED'].includes(order.status);
            const StatusIcon = status.icon;

            return (
              <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl border border-border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-3">
                    <StatusIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">#{order.orderNumber}</span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {order.paymentStatus && (
                      <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                        {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa TT'}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                </div>

                {/* Items */}
                <div className="p-5">
                  <div className="space-y-3">
                    {(order.items || []).slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <img
                          src={getImageUrl(item.productImage)}
                          alt={item.productName}
                          className="w-12 h-12 rounded-lg object-cover bg-muted"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">x{item.quantity} · {formatCurrency(item.price)}</p>
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                    {(order.items || []).length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{order.items.length - 3} sản phẩm khác
                      </p>
                    )}
                  </div>

                  {/* Address + Total */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      {order.shippingAddress?.fullName} · {order.shippingAddress?.phone}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{formatCurrency(order.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {order.paymentMethod?.replace(/_/g, ' ')?.toLowerCase() || 'COD'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {(nextAction || canCancel) && (
                    <div className="mt-4 pt-4 border-t border-border">
                      {/* Cancel confirmation */}
                      {isCancelling ? (
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            placeholder="Lý do hủy đơn..."
                            value={cancelNote}
                            onChange={(e) => setCancelNote(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'CANCELLED', cancelNote || 'Người bán hủy đơn')}
                            disabled={isUpdating}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Xác nhận hủy
                          </button>
                          <button
                            onClick={() => { setCancellingOrderId(null); setCancelNote(''); }}
                            className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted"
                          >
                            Không
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 justify-end">
                          {canCancel && (
                            <button
                              onClick={() => setCancellingOrderId(order.id)}
                              className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Hủy đơn
                            </button>
                          )}
                          {nextAction && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, nextAction.status)}
                              disabled={isUpdating}
                              className={`px-5 py-2 rounded-lg text-sm font-medium text-white ${nextAction.color} disabled:opacity-50 flex items-center gap-2`}
                            >
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  {nextAction.label}
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={page + 1}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p - 1)}
        />
      )}
    </div>
  );
}
