'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Users, LinkIcon, BarChart3, Copy, DollarSign } from 'lucide-react';
import { affiliateService } from '@/services';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AffiliatePage() {
  const [myAffiliate, setMyAffiliate] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [myData, programsData, statsData] = await Promise.allSettled([
          affiliateService.getMyAffiliate(),
          affiliateService.getPrograms(),
          affiliateService.getStats(),
        ]);
        if (myData.status === 'fulfilled') setMyAffiliate(myData.value);
        if (programsData.status === 'fulfilled') setPrograms(Array.isArray(programsData.value) ? programsData.value : []);
        if (statsData.status === 'fulfilled') setStats(statsData.value);
      } catch (error) {
        console.error('Failed to fetch affiliate data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleJoin = async (programId: number) => {
    try {
      const data = await affiliateService.join(programId);
      setMyAffiliate(data);
      toast.success('Tham gia chương trình thành công!');
    } catch {
      toast.error('Không thể tham gia');
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Đã sao chép link giới thiệu!');
  };

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <div className="h-48 bg-muted/50 rounded-xl animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
          ))}
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
        <span className="text-foreground">Affiliate</span>
      </nav>

      {myAffiliate ? (
        <>
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Chương Trình Affiliate</h1>
            </div>
            <p className="text-white/80 mb-4">Mã giới thiệu: <span className="font-mono font-bold">{myAffiliate.code || myAffiliate.referralCode}</span></p>
            {myAffiliate.referralLink && (
              <div className="flex items-center gap-2 bg-white/20 rounded-lg p-3">
                <LinkIcon className="w-4 h-4 shrink-0" />
                <span className="text-sm truncate flex-1">{myAffiliate.referralLink}</span>
                <button
                  onClick={() => copyLink(myAffiliate.referralLink)}
                  className="bg-white/30 p-2 rounded hover:bg-white/40 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card p-4 text-center">
                <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.totalReferrals ?? 0}</p>
                <p className="text-xs text-muted-foreground">Lượt giới thiệu</p>
              </div>
              <div className="card p-4 text-center">
                <BarChart3 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.totalConversions ?? 0}</p>
                <p className="text-xs text-muted-foreground">Chuyển đổi</p>
              </div>
              <div className="card p-4 text-center">
                <DollarSign className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{formatCurrency(stats.totalEarnings ?? 0)}</p>
                <p className="text-xs text-muted-foreground">Thu nhập</p>
              </div>
              <div className="card p-4 text-center">
                <DollarSign className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{formatCurrency(stats.pendingEarnings ?? 0)}</p>
                <p className="text-xs text-muted-foreground">Chờ thanh toán</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <Users className="w-20 h-20 text-purple-500/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Chương Trình Affiliate</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Giới thiệu bạn bè mua sắm và nhận hoa hồng hấp dẫn
          </p>
          {programs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {programs.map((program: any) => (
                <div key={program.id} className="card p-6">
                  <h3 className="font-semibold text-lg mb-2">{program.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{program.description}</p>
                  <p className="text-primary font-bold mb-4">
                    Hoa hồng: {program.commissionRate || program.commission}%
                  </p>
                  <button onClick={() => handleJoin(program.id)} className="btn-primary w-full">
                    Tham gia ngay
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Chưa có chương trình nào. Vui lòng quay lại sau.</p>
          )}
        </div>
      )}
    </div>
  );
}
