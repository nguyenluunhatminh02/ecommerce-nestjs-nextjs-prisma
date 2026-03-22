'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, RotateCcw, Package, Plus, AlertCircle } from 'lucide-react';
import { returnService, orderService } from '@/services';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-700' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Hoàn tất', color: 'bg-gray-100 text-gray-700' },
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ orderId: '', reason: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setIsLoading(true);
      const data = await returnService.getMyReturns();
      setReturns(Array.isArray(data) ? data : ((data as any)?.content ?? []));
    } catch (error) {
      console.error('Failed to fetch returns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderId || !form.reason) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setIsSubmitting(true);
    try {
      await returnService.create(form);
      toast.success('Gửi yêu cầu đổi trả thành công!');
      setShowForm(false);
      setForm({ orderId: '', reason: '', description: '' });
      fetchReturns();
    } catch {
      toast.error('Không thể gửi yêu cầu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-custom py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/account" className="hover:text-primary">Tài khoản</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Đổi trả hàng</span>
      </nav>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-primary" />
            Yêu Cầu Đổi Trả
          </h1>
          <p className="text-muted-foreground mt-1">Quản lý yêu cầu đổi trả hàng</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tạo yêu cầu
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6">
          <h3 className="font-semibold mb-4">Yêu cầu đổi trả mới</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã đơn hàng *</label>
              <input
                type="text"
                value={form.orderId}
                onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                className="input-field"
                placeholder="Nhập mã đơn hàng..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lý do *</label>
              <select
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="input-field"
              >
                <option value="">Chọn lý do</option>
                <option value="DEFECTIVE">Sản phẩm lỗi</option>
                <option value="WRONG_ITEM">Giao sai hàng</option>
                <option value="NOT_AS_DESCRIBED">Không đúng mô tả</option>
                <option value="CHANGED_MIND">Đổi ý</option>
                <option value="OTHER">Lý do khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mô tả chi tiết</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field min-h-24"
                placeholder="Mô tả chi tiết vấn đề..."
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
                Hủy
              </button>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : returns.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Chưa có yêu cầu đổi trả nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((ret: any) => {
            const status = statusMap[ret.status] || { label: ret.status, color: 'bg-gray-100 text-gray-700' };
            return (
              <div key={ret.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-primary" />
                    <span className="font-medium">#{ret.id}</span>
                    {ret.orderId && (
                      <span className="text-sm text-muted-foreground">Đơn hàng: {ret.orderId}</span>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{ret.reason}</p>
                {ret.description && <p className="text-sm mt-1">{ret.description}</p>}
                <p className="text-xs text-muted-foreground mt-2">{formatDateTime(ret.createdAt)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
