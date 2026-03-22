'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Crown, Gift, Star, TrendingUp } from 'lucide-react';
import { loyaltyService } from '@/services';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function LoyaltyPage() {
  const [membership, setMembership] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membershipData, programsData, txData] = await Promise.allSettled([
          loyaltyService.getMembership(),
          loyaltyService.getPrograms(),
          loyaltyService.getTransactions(),
        ]);
        if (membershipData.status === 'fulfilled') setMembership(membershipData.value);
        if (programsData.status === 'fulfilled') setPrograms(Array.isArray(programsData.value) ? programsData.value : []);
        if (txData.status === 'fulfilled') setTransactions(Array.isArray(txData.value) ? txData.value : []);
      } catch (error) {
        console.error('Failed to fetch loyalty data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleJoin = async (programId: number) => {
    try {
      const data = await loyaltyService.join(programId);
      setMembership(data);
      toast.success('Tham gia thành công!');
    } catch {
      toast.error('Không thể tham gia chương trình');
    }
  };

  const handleRedeem = async (points: number) => {
    try {
      await loyaltyService.redeem(points);
      toast.success('Đổi điểm thành công!');
      const data = await loyaltyService.getMembership();
      setMembership(data);
    } catch {
      toast.error('Không thể đổi điểm');
    }
  };

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <div className="space-y-6">
          <div className="h-48 bg-muted/50 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
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
        <span className="text-foreground">Loyalty</span>
      </nav>

      {membership ? (
        <>
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Crown className="w-10 h-10" />
              <div>
                <h1 className="text-2xl font-bold">Chương Trình Khách Hàng Thân Thiết</h1>
                <p className="text-white/80">Hạng: {membership.tier || 'Silver'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/20 rounded-xl p-4">
                <p className="text-sm text-white/80">Điểm hiện tại</p>
                <p className="text-2xl font-bold">{membership.points ?? 0}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4">
                <p className="text-sm text-white/80">Tổng điểm tích lũy</p>
                <p className="text-2xl font-bold">{membership.totalPoints ?? 0}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4">
                <p className="text-sm text-white/80">Giá trị</p>
                <p className="text-2xl font-bold">{formatCurrency((membership.points ?? 0) * 100)}</p>
              </div>
              <div className="bg-white/20 rounded-xl p-4">
                <button
                  onClick={() => handleRedeem(100)}
                  className="w-full h-full flex flex-col items-center justify-center hover:scale-105 transition-transform"
                >
                  <Gift className="w-6 h-6 mb-1" />
                  <span className="text-sm font-medium">Đổi điểm</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
            >
              Tổng quan
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
            >
              Lịch sử giao dịch
            </button>
          </div>

          {activeTab === 'history' && (
            <div className="card">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Chưa có giao dịch nào</div>
              ) : (
                <div className="divide-y">
                  {transactions.map((tx: any, i: number) => (
                    <div key={i} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tx.description || tx.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <span className={`font-semibold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points} điểm
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <Crown className="w-20 h-20 text-yellow-500/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Chương Trình Khách Hàng Thân Thiết</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Tích điểm với mỗi đơn hàng, đổi điểm lấy phần thưởng hấp dẫn
          </p>
          {programs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {programs.map((program: any) => (
                <div key={program.id} className="card p-6 text-center">
                  <Star className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-2">{program.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{program.description}</p>
                  <button onClick={() => handleJoin(program.id)} className="btn-primary w-full">
                    Tham gia ngay
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <Link href="/products" className="btn-primary inline-flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Bắt đầu mua sắm
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
