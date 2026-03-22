'use client';

import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, Smartphone, Key } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { userService } from '@/services';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function SecurityPage() {
  const { user } = useAuthStore();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!passwordForm.currentPassword) errs.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    if (!passwordForm.newPassword) errs.newPassword = 'Vui lòng nhập mật khẩu mới';
    else if (passwordForm.newPassword.length < 8) errs.newPassword = 'Mật khẩu tối thiểu 8 ký tự';
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      errs.confirmPassword = 'Mật khẩu không khớp';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setIsChangingPassword(true);
      await userService.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
      toast.success('Đổi mật khẩu thành công!');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Bảo mật tài khoản</h2>

      {/* Change Password */}
      <div className="bg-card border rounded-xl p-6 mb-6">
        <h3 className="font-bold flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-primary" />
          Đổi mật khẩu
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <Input
            label="Mật khẩu hiện tại"
            type={showCurrentPassword ? 'text' : 'password'}
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            error={errors.currentPassword}
            rightIcon={
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            }
          />
          <Input
            label="Mật khẩu mới"
            type={showNewPassword ? 'text' : 'password'}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            error={errors.newPassword}
            rightIcon={
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}>
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            }
          />
          <Input
            label="Nhập lại mật khẩu mới"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
          />
          <Button type="submit" isLoading={isChangingPassword}>
            Đổi mật khẩu
          </Button>
        </form>
      </div>

      {/* Login Devices */}
      <div className="bg-card border rounded-xl p-6 mb-6">
        <h3 className="font-bold flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-primary" />
          Thiết bị đăng nhập
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Quản lý các thiết bị đã đăng nhập vào tài khoản của bạn
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Thiết bị hiện tại</p>
                <p className="text-xs text-muted-foreground">Chrome trên Windows</p>
              </div>
            </div>
            <span className="text-xs text-green-600 font-medium">Đang hoạt động</span>
          </div>
        </div>
      </div>

      {/* Two-Factor Auth */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-bold flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-primary" />
          Xác thực hai yếu tố (2FA)
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Thêm một lớp bảo mật bổ sung cho tài khoản của bạn
        </p>
        <Button variant="outline">Thiết lập 2FA</Button>
      </div>
    </div>
  );
}
