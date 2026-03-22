'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Gift, CreditCard, Sparkles } from 'lucide-react';
import { giftCardService } from '@/services';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function GiftCardsPage() {
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [redeemCode, setRedeemCode] = useState('');

  useEffect(() => {
    const fetchGiftCards = async () => {
      try {
        const data = await giftCardService.getAll();
        setGiftCards(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch gift cards:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGiftCards();
  }, []);

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      toast.error('Vui lòng nhập mã thẻ quà tặng');
      return;
    }
    try {
      await giftCardService.redeem(redeemCode.trim());
      toast.success('Đã sử dụng thẻ quà tặng thành công!');
      setRedeemCode('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Mã thẻ không hợp lệ');
    }
  };

  return (
    <div className="container-custom py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Thẻ quà tặng</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gift className="w-6 h-6 text-primary" />
          Thẻ Quà Tặng
        </h1>
        <p className="text-muted-foreground mt-1">Mua thẻ quà tặng cho người thân hoặc sử dụng mã thẻ</p>
      </div>

      {/* Redeem Section */}
      <div className="card p-6 mb-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Sử dụng thẻ quà tặng
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
            placeholder="Nhập mã thẻ quà tặng..."
            className="input flex-1"
          />
          <button onClick={handleRedeem} className="btn-primary whitespace-nowrap">
            Sử dụng
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : giftCards.length === 0 ? (
        <div className="text-center py-20">
          <Sparkles className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Hiện chưa có thẻ quà tặng nào</p>
          <Link href="/products" className="btn-primary">Xem sản phẩm</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {giftCards.map((card: any) => (
            <div
              key={card.id}
              className="card overflow-hidden hover:shadow-md transition-all"
            >
              <div className="bg-gradient-to-br from-primary to-primary/70 p-6 text-white">
                <Gift className="w-8 h-8 mb-2 opacity-80" />
                <p className="text-3xl font-bold">{formatCurrency(card.amount || card.value || 0)}</p>
                <p className="text-sm opacity-80 mt-1">Thẻ quà tặng</p>
              </div>
              <div className="p-4">
                {card.code && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Mã: <code className="bg-muted px-2 py-0.5 rounded font-mono">{card.code}</code>
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    card.status === 'ACTIVE' || card.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {card.status === 'ACTIVE' || card.isActive ? 'Đang hoạt động' : 'Đã sử dụng'}
                  </span>
                  {card.balance !== undefined && (
                    <span className="font-medium">Còn lại: {formatCurrency(card.balance)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
