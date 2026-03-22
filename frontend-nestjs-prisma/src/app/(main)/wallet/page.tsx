'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Wallet, ArrowUpCircle, ArrowDownCircle, Plus } from 'lucide-react';
import { walletService } from '@/services';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletData, txData] = await Promise.allSettled([
          walletService.getWallet(),
          walletService.getTransactions(),
        ]);
        if (walletData.status === 'fulfilled') setWallet(walletData.value);
        if (txData.status === 'fulfilled') setTransactions(Array.isArray(txData.value) ? txData.value : []);
      } catch (error) {
        console.error('Failed to fetch wallet:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    try {
      await walletService.topUp({ amount });
      toast.success('Nạp tiền thành công!');
      setShowTopUp(false);
      setTopUpAmount('');
      const [w, t] = await Promise.all([walletService.getWallet(), walletService.getTransactions()]);
      setWallet(w);
      setTransactions(Array.isArray(t) ? t : []);
    } catch {
      toast.error('Nạp tiền thất bại');
    }
  };

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <div className="h-48 bg-muted/50 rounded-xl animate-pulse mb-6" />
        <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/account" className="hover:text-primary">Tài khoản</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Ví của tôi</span>
      </nav>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Ví ShopVN</h1>
            </div>
            <p className="text-white/70 text-sm">Số dư khả dụng</p>
            <p className="text-4xl font-bold mt-1">{formatCurrency(wallet?.balance ?? 0)}</p>
          </div>
          <button
            onClick={() => setShowTopUp(!showTopUp)}
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nạp tiền
          </button>
        </div>
      </div>

      {showTopUp && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4">Nạp tiền vào ví</h3>
          <div className="flex gap-2 mb-4">
            {[50000, 100000, 200000, 500000].map((amount) => (
              <button
                key={amount}
                onClick={() => setTopUpAmount(String(amount))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  topUpAmount === String(amount) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              type="number"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="Nhập số tiền..."
              className="input-field flex-1"
            />
            <button onClick={handleTopUp} className="btn-primary px-6">Nạp</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Lịch sử giao dịch</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Chưa có giao dịch nào</div>
        ) : (
          <div className="divide-y">
            {transactions.map((tx: any, i: number) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {tx.type === 'CREDIT' || tx.amount > 0 ? (
                    <ArrowDownCircle className="w-8 h-8 text-green-500" />
                  ) : (
                    <ArrowUpCircle className="w-8 h-8 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">{tx.description || tx.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(tx.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${(tx.type === 'CREDIT' || tx.amount > 0) ? 'text-green-600' : 'text-red-600'}`}>
                  {(tx.type === 'CREDIT' || tx.amount > 0) ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
