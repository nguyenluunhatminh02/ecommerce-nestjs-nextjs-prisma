'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Headset, LifeBuoy, SendHorizontal } from 'lucide-react';
import apiClient from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface TicketItem {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

const normalizeTicket = (item: any): TicketItem => ({
  id: String(item.id),
  ticketNumber: item.ticketNumber || `#${String(item.id).slice(0, 8)}`,
  subject: item.subject || 'Hỗ trợ khách hàng',
  description: item.description || '',
  status: item.status || 'OPEN',
  priority: item.priority || 'MEDIUM',
  createdAt: item.createdAt || new Date().toISOString(),
});

export default function SupportPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    message: '',
    priority: 'MEDIUM',
  });

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/support/tickets', { params: { page: 0, size: 20 } });
      const items = response.data?.data?.content || [];
      setTickets(items.map(normalizeTicket));
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
      toast.error('Không thể tải yêu cầu hỗ trợ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    try {
      setIsSubmitting(true);
      const params = new URLSearchParams({
        subject: form.subject.trim(),
        message: form.message.trim(),
        priority: form.priority,
      });
      await apiClient.post(`/support/tickets?${params.toString()}`);
      setForm({ subject: '', message: '', priority: 'MEDIUM' });
      toast.success('Đã gửi yêu cầu hỗ trợ');
      fetchTickets();
    } catch (error) {
      console.error('Failed to create support ticket:', error);
      toast.error('Không thể gửi yêu cầu hỗ trợ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      await apiClient.put(`/support/tickets/${ticketId}/close`);
      setTickets((current) =>
        current.map((ticket) => (ticket.id === ticketId ? { ...ticket, status: 'CLOSED' } : ticket))
      );
      toast.success('Đã đóng ticket');
    } catch {
      toast.error('Không thể đóng ticket');
    }
  };

  return (
    <div className="container-custom py-8 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
        <section className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Headset className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Trung tâm hỗ trợ</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gửi ticket trực tiếp tới hệ thống CSKH bằng backend thật.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Tiêu đề"
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Ví dụ: Cần hỗ trợ đơn hàng bị giao chậm"
            />

            <div>
              <label className="block text-sm font-medium mb-1.5">Mức độ ưu tiên</label>
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                className="input-field"
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn cấp</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Nội dung</label>
              <textarea
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                className="input-field min-h-36 resize-y"
                placeholder="Mô tả chi tiết vấn đề của bạn..."
              />
            </div>

            <Button type="submit" isLoading={isSubmitting} leftIcon={<SendHorizontal className="w-4 h-4" />}>
              Gửi yêu cầu
            </Button>
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Yêu cầu gần đây</h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
              Bạn chưa có yêu cầu hỗ trợ nào.
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="bg-card border rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {ticket.priority}
                      </span>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                        {ticket.status}
                      </span>
                    </div>
                    <h3 className="font-semibold">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                    <p className="text-xs text-muted-foreground mt-3">{formatDateTime(ticket.createdAt)}</p>
                  </div>
                  {ticket.status !== 'CLOSED' && (
                    <Button variant="outline" size="sm" onClick={() => handleCloseTicket(ticket.id)}>
                      Đóng ticket
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}