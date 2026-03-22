'use client';

import { useState, useEffect } from 'react';
import { Camera, Save, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { userService, fileService } from '@/services';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const updated = await userService.updateProfile(formData);
      setUser(updated);
      toast.success('Cập nhật thành công!');
    } catch {
      toast.error('Không thể cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tối đa 5MB');
      return;
    }
    try {
      setIsUploading(true);
      const avatarUrl = await fileService.uploadAvatar(file);
      const updated = await userService.updateProfile({ avatarUrl });
      setUser(updated);
      toast.success('Đã cập nhật ảnh đại diện');
    } catch {
      toast.error('Không thể tải ảnh lên');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Thông tin cá nhân</h2>

      <div className="bg-card border rounded-xl p-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-6 mb-8 pb-6 border-b">
          <div className="relative">
              {user.avatarUrl ? (
              <img
                  src={user.avatarUrl}
                alt={user.fullName}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">
                  {user.firstName?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
              {isUploading ? (
                <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-primary-foreground" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
          <div>
            <h3 className="font-semibold text-lg">{user.fullName}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Thành viên từ {new Date(user.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Họ"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Nhập họ"
            />
            <Input
              label="Tên"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Nhập tên"
            />
          </div>

          <Input
            label="Email"
            value={user.email}
            disabled
            helperText="Email không thể thay đổi"
          />

          <Input
            label="Số điện thoại"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Nhập số điện thoại"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Giới tính</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="input-field"
              >
                <option value="">Chọn giới tính</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <Input
              label="Ngày sinh"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isLoading} leftIcon={<Save className="w-4 h-4" />}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
