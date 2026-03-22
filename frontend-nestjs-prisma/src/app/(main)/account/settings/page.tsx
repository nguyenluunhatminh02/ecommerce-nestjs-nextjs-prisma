'use client';

import { useState } from 'react';
import { Settings, Moon, Sun, Globe, Bell, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/auth-store';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuthStore();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    orderUpdates: true,
    promotions: true,
    newsletter: false,
  });

  const handleDeleteAccount = () => {
    if (!confirm('Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác.')) return;
    toast.error('Tính năng đang phát triển');
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Cài đặt</h2>

      {/* Theme */}
      <div className="bg-card border rounded-xl p-6 mb-6">
        <h3 className="font-bold flex items-center gap-2 mb-4">
          <Sun className="w-5 h-5 text-primary" />
          Giao diện
        </h3>
        <div className="flex gap-3">
          {[
            { value: 'light', label: 'Sáng', icon: Sun },
            { value: 'dark', label: 'Tối', icon: Moon },
            { value: 'system', label: 'Hệ thống', icon: Settings },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-all ${
                theme === opt.value ? 'border-primary bg-primary/5 text-primary' : 'hover:border-muted-foreground/30'
              }`}
            >
              <opt.icon className="w-4 h-4" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="bg-card border rounded-xl p-6 mb-6">
        <h3 className="font-bold flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          Ngôn ngữ
        </h3>
        <select className="input-field max-w-xs">
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* Notifications */}
      <div className="bg-card border rounded-xl p-6 mb-6">
        <h3 className="font-bold flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-primary" />
          Thông báo
        </h3>
        <div className="space-y-4">
          {[
            { key: 'email', label: 'Thông báo qua email', desc: 'Nhận thông báo qua email' },
            { key: 'push', label: 'Thông báo đẩy', desc: 'Nhận thông báo trên trình duyệt' },
            { key: 'sms', label: 'Thông báo SMS', desc: 'Nhận tin nhắn SMS' },
            { key: 'orderUpdates', label: 'Cập nhật đơn hàng', desc: 'Trạng thái đơn hàng thay đổi' },
            { key: 'promotions', label: 'Khuyến mãi', desc: 'Ưu đãi và giảm giá mới' },
            { key: 'newsletter', label: 'Bản tin', desc: 'Tin tức và bài viết hàng tuần' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[item.key as keyof typeof notifications]}
                  onChange={(e) =>
                    setNotifications({ ...notifications, [item.key]: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-destructive/20 rounded-xl p-6">
        <h3 className="font-bold flex items-center gap-2 mb-2 text-destructive">
          <Trash2 className="w-5 h-5" />
          Vùng nguy hiểm
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Xóa vĩnh viễn tài khoản và tất cả dữ liệu liên quan
        </p>
        <Button variant="destructive" onClick={handleDeleteAccount}>
          Xóa tài khoản
        </Button>
      </div>
    </div>
  );
}
