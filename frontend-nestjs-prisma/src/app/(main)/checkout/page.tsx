'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import {
  MapPin,
  CreditCard,
  Wallet,
  Banknote,
  ChevronRight,
  Plus,
  Check,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Landmark,
  Smartphone,
  QrCode,
  Copy,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { AddressResponse, OrderResponse, ShippingMethodResponse } from '@/types';
import { addressService, orderService, paymentService, shippingService } from '@/services';
import { cn, formatCurrency, getImageUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type PaymentMethod = 'COD' | 'STRIPE' | 'BANK_TRANSFER' | 'PAYPAL' | 'MOMO' | 'VNPAY';

function StripeCheckoutForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Validation error');
      setIsProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/orders' },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={!stripe || isProcessing} isLoading={isProcessing} className="w-full">
        Thanh toán bằng thẻ
      </Button>
    </form>
  );
}

function BankTransferInfo({ bankInfo }: { bankInfo: any }) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  return (
    <div className="mt-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-3">
      <h3 className="font-bold text-sm">Thông tin chuyển khoản</h3>
      {[
        { label: 'Ngân hàng', value: bankInfo.bankName },
        { label: 'Số tài khoản', value: bankInfo.accountNumber },
        { label: 'Tên tài khoản', value: bankInfo.accountName },
        { label: 'Số tiền', value: formatCurrency(bankInfo.amount) },
        { label: 'Nội dung CK', value: bankInfo.content },
      ].map((item) => (
        <div key={item.label} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{item.label}:</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.value}</span>
            <button onClick={() => copyToClipboard(String(item.value))} className="p-1 hover:bg-muted rounded">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground mt-2">
        Vui lòng chuyển khoản đúng số tiền và nội dung. Đơn hàng sẽ được xác nhận sau khi nhận được thanh toán.
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { cart, fetchCart } = useCartStore();

  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodResponse[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [shippingMethodId, setShippingMethodId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [bankTransferInfo, setBankTransferInfo] = useState<any>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // New address form
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    ward: '',
    addressLine1: '',
    country: 'Vietnam',
    isDefault: false,
  });

  useEffect(() => {
    if (!user) {
      // Don't redirect if there's a valid access token — store is still hydrating
      const accessToken = Cookies.get('accessToken');
      if (!accessToken) {
        router.push('/auth/login?redirect=/checkout');
      }
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [addressData, shippingData] = await Promise.all([
        addressService.getAddresses(),
        shippingService.getActiveMethods(),
        fetchCart(),
      ]);
      setAddresses(addressData);
      setShippingMethods(shippingData);
      const defaultAddr = addressData.find((a: AddressResponse) => a.isDefault);
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
      if (shippingData.length > 0) setShippingMethodId(shippingData[0].id);
    } catch (error) {
      console.error('Failed to load checkout data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async () => {
    try {
      const addr = await addressService.createAddress(newAddress);
      setAddresses([...addresses, addr]);
      setSelectedAddress(addr.id);
      setShowAddressModal(false);
      setNewAddress({
        fullName: '',
        phone: '',
        province: '',
        city: '',
        district: '',
        ward: '',
        addressLine1: '',
        country: 'Vietnam',
        isDefault: false,
      });
      toast.success('Đã thêm địa chỉ mới');
    } catch {
      toast.error('Không thể thêm địa chỉ');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    if (!cart?.items?.length) {
      toast.error('Giỏ hàng trống');
      return;
    }

    try {
      setIsPlacingOrder(true);

      const orderData = {
        shippingAddressId: selectedAddress,
        paymentMethod,
        couponCode: cart?.couponCode || undefined,
        note,
        items: cart.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
        })),
      };

      const order: OrderResponse = await orderService.createOrder(orderData);
      setCreatedOrderId(order.id);

      if (paymentMethod === 'STRIPE') {
        const intent = await paymentService.createPaymentIntent(order.id);
        if (intent.clientSecret) {
          setStripeClientSecret(intent.clientSecret);
        } else {
          router.push(`/orders/${order.id}?success=true`);
          toast.success('Đặt hàng thành công!');
        }
      } else if (paymentMethod === 'BANK_TRANSFER') {
        const result = await paymentService.confirmBankTransfer(order.id);
        setBankTransferInfo(result.bankInfo);
        toast.success('Đã tạo đơn hàng. Vui lòng chuyển khoản.');
      } else {
        // COD, PAYPAL, MOMO, VNPAY
        if (paymentMethod === 'COD') {
          await paymentService.confirmCOD(order.id);
        }
        router.push(`/orders/${order.id}?success=true`);
        toast.success('Đặt hàng thành công!');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể đặt hàng');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleStripeSuccess = async () => {
    if (createdOrderId) {
      router.push(`/orders/${createdOrderId}?success=true`);
      toast.success('Thanh toán thành công!');
    }
  };

  const selectedShipping = shippingMethods.find((m) => m.id === shippingMethodId) ?? null;
  const subtotal = cart?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const discount = cart?.discount || 0;
  const shippingCost = selectedShipping?.baseCost ?? selectedShipping?.baseRate ?? 0;
  const total = subtotal + shippingCost - discount;

  if (isLoading) {
    return (
      <div className="container-custom py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Address */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Địa chỉ nhận hàng
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddressModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Thêm mới
              </Button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-3">Bạn chưa có địa chỉ nào</p>
                <Button variant="outline" onClick={() => setShowAddressModal(true)}>
                  Thêm địa chỉ
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={cn(
                      'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                      selectedAddress === addr.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-muted-foreground/30'
                    )}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress === addr.id}
                      onChange={() => setSelectedAddress(addr.id)}
                      className="mt-1 accent-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{addr.fullName}</span>
                        <span className="text-sm text-muted-foreground">| {addr.phone}</span>
                        {addr.isDefault && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {[addr.addressLine1, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    {selectedAddress === addr.id && (
                      <Check className="w-5 h-5 text-primary shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Shipping */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-primary" />
              Phương thức vận chuyển
            </h2>
            <div className="space-y-3">
              {shippingMethods.length === 0 ? (
                <p className="text-sm text-muted-foreground">Đang tải phương thức vận chuyển...</p>
              ) : (
                shippingMethods.map((method) => (
                  <label
                    key={method.id}
                    className={cn(
                      'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all',
                      shippingMethodId === method.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-muted-foreground/30'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingMethodId === method.id}
                        onChange={() => setShippingMethodId(method.id)}
                        className="accent-primary"
                      />
                      <div>
                        <span className="font-medium text-sm">{method.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {method.description ?? `${method.minDeliveryDays}-${method.maxDeliveryDays} ngày làm việc`}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {Number(method.baseCost ?? method.baseRate) === 0 ? (
                        <span className="text-green-600">Miễn phí</span>
                      ) : (
                        formatCurrency(Number(method.baseCost ?? method.baseRate))
                      )}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Step 3: Payment */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              {[
                {
                  id: 'COD' as const,
                  icon: Banknote,
                  name: 'Thanh toán khi nhận hàng (COD)',
                  desc: 'Trả tiền mặt khi nhận hàng',
                },
                {
                  id: 'STRIPE' as const,
                  icon: CreditCard,
                  name: 'Thẻ tín dụng / Ghi nợ (Stripe)',
                  desc: 'Visa, Mastercard, JCB, AMEX',
                },
                {
                  id: 'BANK_TRANSFER' as const,
                  icon: Landmark,
                  name: 'Chuyển khoản ngân hàng',
                  desc: 'Chuyển khoản qua tài khoản ngân hàng',
                },
                {
                  id: 'PAYPAL' as const,
                  icon: Wallet,
                  name: 'PayPal',
                  desc: 'Thanh toán quốc tế qua PayPal',
                },
                {
                  id: 'MOMO' as const,
                  icon: Smartphone,
                  name: 'Ví MoMo',
                  desc: 'Thanh toán qua ví MoMo',
                },
                {
                  id: 'VNPAY' as const,
                  icon: QrCode,
                  name: 'VNPay',
                  desc: 'Thanh toán qua VNPay QR / ATM nội địa',
                },
              ].map((method) => (
                <label
                  key={method.id}
                  className={cn(
                    'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                    paymentMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/30'
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === method.id}
                    onChange={() => {
                      setPaymentMethod(method.id);
                      setStripeClientSecret(null);
                      setBankTransferInfo(null);
                    }}
                    className="accent-primary"
                  />
                  <method.icon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <span className="font-medium text-sm">{method.name}</span>
                    <p className="text-xs text-muted-foreground">{method.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Stripe Elements Form */}
            {stripeClientSecret && paymentMethod === 'STRIPE' && stripePromise && (
              <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret, appearance: { theme: 'stripe' } }}>
                <StripeCheckoutForm clientSecret={stripeClientSecret} onSuccess={handleStripeSuccess} />
              </Elements>
            )}

            {/* Bank Transfer Info */}
            {bankTransferInfo && paymentMethod === 'BANK_TRANSFER' && (
              <BankTransferInfo bankInfo={bankTransferInfo} />
            )}
          </div>

          {/* Order Note */}
          <div className="bg-card border rounded-xl p-6">
            <h2 className="font-bold mb-3">Ghi chú đơn hàng</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú cho người bán (ví dụ: giao hàng giờ hành chính)"
              rows={3}
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Right Col - Order Summary */}
        <div>
          <div className="bg-card border rounded-xl p-6 sticky top-4">
            <h2 className="font-bold mb-4">Đơn hàng của bạn</h2>

            <div className="divide-y max-h-[300px] overflow-y-auto scrollbar-thin">
              {cart?.items?.map((item) => (
                <div key={item.id} className="flex gap-3 py-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
                    <img
                      src={getImageUrl(item.productImage)}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{item.productName}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span>
                  {shippingCost === 0 ? (
                    <span className="text-green-600">Miễn phí</span>
                  ) : (
                    formatCurrency(shippingCost)
                  )}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-destructive">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              onClick={handlePlaceOrder}
              isLoading={isPlacingOrder}
              className="w-full mt-4"
              size="lg"
              disabled={!selectedAddress}
            >
              Đặt hàng
            </Button>

            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Giao dịch an toàn và bảo mật</span>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      <Modal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        title="Thêm địa chỉ mới"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Họ tên"
              value={newAddress.fullName}
              onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
              placeholder="Nhập họ tên"
            />
            <Input
              label="Số điện thoại"
              value={newAddress.phone}
              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
              placeholder="Nhập số điện thoại"
            />
          </div>
          <Input
            label="Tỉnh/Thành phố"
            value={newAddress.province}
              onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value, city: e.target.value })}
            placeholder="Nhập tỉnh/thành phố"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quận/Huyện"
              value={newAddress.district}
              onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
              placeholder="Nhập quận/huyện"
            />
            <Input
              label="Phường/Xã"
              value={newAddress.ward}
              onChange={(e) => setNewAddress({ ...newAddress, ward: e.target.value })}
              placeholder="Nhập phường/xã"
            />
          </div>
          <Input
            label="Địa chỉ cụ thể"
            value={newAddress.addressLine1}
            onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
            placeholder="Số nhà, tên đường..."
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={newAddress.isDefault}
              onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
              className="accent-primary"
            />
            Đặt làm địa chỉ mặc định
          </label>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowAddressModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddAddress}>Thêm địa chỉ</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
