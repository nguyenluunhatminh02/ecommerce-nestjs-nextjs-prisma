'use client';

import { useEffect, useState } from 'react';
import { Store, Save, Globe, Phone, Mail, MapPin, FileText, Loader2, CheckCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { getImageUrl } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

interface ShopData {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  coverImage: string | null;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  websiteUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  returnPolicy: string;
  shippingPolicy: string;
  isVerified: boolean;
  rating: number;
  totalFollowers: number;
  totalProducts: number;
}

export default function SellerSettingsPage() {
  const [shop, setShop] = useState<ShopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    taxId: '',
    websiteUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    returnPolicy: '',
    shippingPolicy: '',
  });

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await apiClient.get('/shops/my-shop');
        const data = res.data.data;
        if (!data) {
          setShop(null);
          return;
        }
        setShop(data);
        setForm({
          name: data.name || '',
          description: data.description || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          taxId: data.taxId || '',
          websiteUrl: data.websiteUrl || '',
          facebookUrl: data.facebookUrl || '',
          instagramUrl: data.instagramUrl || '',
          returnPolicy: data.returnPolicy || '',
          shippingPolicy: data.shippingPolicy || '',
        });
      } catch (err) {
        console.error('Failed to fetch shop:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShop();
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    try {
      setIsSaving(true);
      await apiClient.put(`/shops/${shop.id}`, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Failed to save:', err);
      alert(err.response?.data?.message || 'Không thể lưu thay đổi');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-20">
        <Store className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Không thể tải thông tin shop</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cài đặt shop</h1>
          <p className="text-muted-foreground">Quản lý thông tin và cấu hình cửa hàng</p>
        </div>
        {shop.isVerified && (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" /> Đã xác minh
          </span>
        )}
      </div>

      {/* Shop Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-border overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 relative">
          {shop.coverImage && (
            <img src={getImageUrl(shop.coverImage)} alt="cover" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="px-5 pb-5 -mt-8 flex items-end gap-4">
          <div className="w-16 h-16 rounded-xl border-4 border-white dark:border-gray-800 bg-primary/10 flex items-center justify-center overflow-hidden">
            {shop.logo ? (
              <img src={getImageUrl(shop.logo)} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-7 h-7 text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold">{shop.name}</h2>
            <p className="text-sm text-muted-foreground">
              ★ {shop.rating?.toFixed(1)} · {shop.totalFollowers} followers · {shop.totalProducts} sản phẩm
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" /> Thông tin cơ bản
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Tên shop *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Mã số thuế</label>
              <input
                type="text"
                value={form.taxId}
                onChange={(e) => handleChange('taxId', e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Mô tả</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background min-h-[100px] resize-none"
                placeholder="Giới thiệu về cửa hàng..."
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" /> Thông tin liên hệ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Số điện thoại</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Địa chỉ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-1 block">Địa chỉ</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Thành phố</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Quốc gia</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" /> Liên kết mạng xã hội
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Website</label>
              <input
                type="url"
                value={form.websiteUrl}
                onChange={(e) => handleChange('websiteUrl', e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background"
                placeholder="https://"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Facebook</label>
              <input
                type="url"
                value={form.facebookUrl}
                onChange={(e) => handleChange('facebookUrl', e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Instagram</label>
              <input
                type="url"
                value={form.instagramUrl}
                onChange={(e) => handleChange('instagramUrl', e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background"
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Chính sách
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Chính sách đổi trả</label>
              <textarea
                value={form.returnPolicy}
                onChange={(e) => handleChange('returnPolicy', e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background min-h-[80px] resize-none"
                placeholder="Chính sách đổi trả hàng của cửa hàng..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Chính sách giao hàng</label>
              <textarea
                value={form.shippingPolicy}
                onChange={(e) => handleChange('shippingPolicy', e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background min-h-[80px] resize-none"
                placeholder="Chính sách giao hàng..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
            ) : saved ? (
              <><CheckCircle className="w-4 h-4" /> Đã lưu!</>
            ) : (
              <><Save className="w-4 h-4" /> Lưu thay đổi</>
            )}
          </button>
          {saved && <span className="text-green-600 text-sm">Cập nhật thành công!</span>}
        </div>
      </form>
    </div>
  );
}
