'use client';

import React, { useState } from 'react';
import { PageHeader, Card, InputGroup } from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
    const [general, setGeneral] = useState({ siteName: 'E-Commerce Store', siteDescription: 'Nền tảng thương mại điện tử', contactEmail: 'admin@ecommerce.com', phone: '', address: '' });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Settings save would go through a dedicated settings API
            await new Promise(r => setTimeout(r, 500));
            toast.success('Đã lưu cài đặt');
        } catch { toast.error('Không thể lưu'); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Cài đặt hệ thống" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Settings' }]} />

            <Card title="Thông tin chung">
                <div className="space-y-4 max-w-xl">
                    <InputGroup label="Tên website" value={general.siteName} onChange={e => setGeneral(p => ({ ...p, siteName: e.target.value }))} />
                    <InputGroup label="Mô tả" value={general.siteDescription} onChange={e => setGeneral(p => ({ ...p, siteDescription: e.target.value }))} />
                    <InputGroup label="Email liên hệ" type="email" value={general.contactEmail} onChange={e => setGeneral(p => ({ ...p, contactEmail: e.target.value }))} />
                    <InputGroup label="Số điện thoại" value={general.phone} onChange={e => setGeneral(p => ({ ...p, phone: e.target.value }))} />
                    <InputGroup label="Địa chỉ" value={general.address} onChange={e => setGeneral(p => ({ ...p, address: e.target.value }))} />
                    <div className="pt-2">
                        <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
                        </button>
                    </div>
                </div>
            </Card>

            <Card title="Cài đặt thanh toán">
                <div className="space-y-4 max-w-xl">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div><div className="font-medium">COD (Thanh toán khi nhận hàng)</div><div className="text-sm text-gray-500">Cho phép thanh toán tiền mặt</div></div>
                        <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" /></div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div><div className="font-medium">VNPay</div><div className="text-sm text-gray-500">Thanh toán qua VNPay</div></div>
                        <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" /></div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div><div className="font-medium">Stripe</div><div className="text-sm text-gray-500">Thanh toán quốc tế qua Stripe</div></div>
                        <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" /></div>
                    </div>
                </div>
            </Card>

            <Card title="Cài đặt email">
                <div className="space-y-4 max-w-xl">
                    <InputGroup label="SMTP Host" value="smtp.gmail.com" onChange={() => {}} />
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="SMTP Port" value="587" onChange={() => {}} />
                        <InputGroup label="SMTP User" value="noreply@ecommerce.com" onChange={() => {}} />
                    </div>
                    <p className="text-sm text-gray-500">Cấu hình SMTP để gửi email thông báo, xác nhận đơn hàng, reset mật khẩu...</p>
                </div>
            </Card>

            <Card title="Bảo trì">
                <div className="space-y-4 max-w-xl">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div><div className="font-medium">Chế độ bảo trì</div><div className="text-sm text-gray-500">Tạm thời đóng website để bảo trì</div></div>
                        <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" /></div>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                        <div><div className="font-medium text-red-700">Xóa cache</div><div className="text-sm text-gray-500">Xóa toàn bộ cache hệ thống</div></div>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">Xóa cache</button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
