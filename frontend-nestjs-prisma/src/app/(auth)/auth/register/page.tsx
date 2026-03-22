'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!formData.firstName.trim()) errs.firstName = 'Vui lòng nhập họ';
    if (!formData.lastName.trim()) errs.lastName = 'Vui lòng nhập tên';
    if (!formData.phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^(0|\+84)\d{9}$/.test(formData.phone.replace(/\s/g, '')))
      errs.phone = 'Số điện thoại không hợp lệ';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!formData.email) errs.email = 'Vui lòng nhập email';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errs.email = 'Email không hợp lệ';
    if (!formData.password) errs.password = 'Vui lòng nhập mật khẩu';
    else if (formData.password.length < 8)
      errs.password = 'Mật khẩu tối thiểu 8 ký tự';
    else if (!/(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])/.test(formData.password))
      errs.password = 'Mật khẩu cần có chữ hoa, chữ thường và số';
    if (formData.password !== formData.confirmPassword)
      errs.confirmPassword = 'Mật khẩu không khớp';
    if (!formData.agreeToTerms) errs.agreeToTerms = 'Bạn cần đồng ý với điều khoản';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      toast.success('Đăng ký thành công! Vui lòng xác thực email.');
      router.push('/auth/login');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Đăng ký thất bại';
      toast.error(msg);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-black text-primary">ShopVN</h1>
          </Link>
          <h2 className="text-xl font-semibold mt-4">Tạo tài khoản</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Đăng ký để mua sắm & nhận ưu đãi
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {s}
              </div>
              <span className={`text-xs ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s === 1 ? 'Thông tin' : 'Tài khoản'}
              </span>
              {s < 2 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Họ"
                  placeholder="Nguyễn"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  error={errors.firstName}
                  leftIcon={<User className="w-4 h-4" />}
                />
                <Input
                  label="Tên"
                  placeholder="Văn A"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  error={errors.lastName}
                />
              </div>
              <Input
                label="Số điện thoại"
                placeholder="0912345678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
                leftIcon={<Phone className="w-4 h-4" />}
              />
              <Button type="button" onClick={handleNext} className="w-full" size="lg">
                Tiếp tục
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <Input
                label="Email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                leftIcon={<Mail className="w-4 h-4" />}
              />
              <Input
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 8 ký tự"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <Input
                label="Nhập lại mật khẩu"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
                leftIcon={<Lock className="w-4 h-4" />}
              />

              {/* Password strength hints */}
              <div className="space-y-1">
                {[
                  { test: formData.password.length >= 8, text: 'Tối thiểu 8 ký tự' },
                  { test: /[A-Z]/.test(formData.password), text: 'Có chữ hoa' },
                  { test: /[a-z]/.test(formData.password), text: 'Có chữ thường' },
                  { test: /[0-9]/.test(formData.password), text: 'Có số' },
                ].map((hint, i) => (
                  <p
                    key={i}
                    className={`text-xs flex items-center gap-1 ${
                      hint.test ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${hint.test ? 'bg-green-600' : 'bg-muted-foreground'}`} />
                    {hint.text}
                  </p>
                ))}
              </div>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-muted-foreground">
                  Tôi đồng ý với{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Điều khoản dịch vụ
                  </Link>{' '}
                  và{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Chính sách bảo mật
                  </Link>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="text-xs text-destructive">{errors.agreeToTerms}</p>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Quay lại
                </Button>
                <Button type="submit" isLoading={isLoading} className="flex-1" size="lg">
                  Đăng ký
                </Button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Đã có tài khoản?{' '}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
