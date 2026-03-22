'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import apiClient from '@/lib/api-client';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  linkUrl: string | null;
  imageUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

const normalizeNotification = (item: any): NotificationItem => ({
  id: String(item.id),
  title: item.title || 'Thông báo',
  message: item.message || '',
  type: item.type || 'SYSTEM',
  linkUrl: item.linkUrl ?? item.link ?? null,
  imageUrl: item.imageUrl ?? null,
  isRead: Boolean(item.isRead ?? item.read),
  createdAt: item.createdAt || new Date().toISOString(),
});

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/notifications', { params: { page: 0, size: 50 } });
      const items = response.data?.data?.content || [];
      setNotifications(items.map(normalizeNotification));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Không thể tải thông báo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
      );
    } catch {
      toast.error('Không thể cập nhật trạng thái thông báo');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      await apiClient.put('/notifications/read-all');
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch {
      toast.error('Không thể cập nhật thông báo');
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="container-custom py-8 max-w-4xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Thông báo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi trạng thái đơn hàng, thanh toán và các cập nhật hệ thống.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleMarkAllAsRead}
          isLoading={isMarkingAll}
          leftIcon={<CheckCheck className="w-4 h-4" />}
          disabled={!notifications.some((item) => !item.isRead)}
        >
          Đánh dấu đã đọc
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Chưa có thông báo nào</h2>
          <p className="text-muted-foreground">Khi có cập nhật mới, bạn sẽ thấy tại đây.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`bg-card border rounded-xl p-5 transition-colors ${
                item.isRead ? 'border-border' : 'border-primary/40 bg-primary/5'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {item.type.replace(/_/g, ' ')}
                    </span>
                    {!item.isRead && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary text-primary-foreground">
                        Mới
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{item.message}</p>
                  <p className="text-xs text-muted-foreground mt-3">{formatDateTime(item.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!item.isRead && (
                    <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(item.id)}>
                      Đã đọc
                    </Button>
                  )}
                  {item.linkUrl && (
                    <Link href={item.linkUrl}>
                      <Button variant="ghost" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />}>
                        Mở
                      </Button>
                    </Link>
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