'use client';

import { useEffect, useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, Star, Check } from 'lucide-react';
import { AddressResponse } from '@/types';
import { addressService } from '@/services';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

const emptyAddress = {
  fullName: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  ward: '',
  addressLine1: '',
  country: 'Vietnam',
  isDefault: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressResponse | null>(null);
  const [formData, setFormData] = useState(emptyAddress);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch {
      toast.error('Không thể tải danh sách địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setFormData(emptyAddress);
    setShowModal(true);
  };

  const openEditModal = (addr: AddressResponse) => {
    setEditingAddress(addr);
    setFormData({
      fullName: addr.fullName,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      ward: addr.ward || '',
      addressLine1: addr.addressLine1,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.phone || !formData.province || !formData.district || !formData.addressLine1) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        city: formData.city || formData.province,
        country: formData.country || 'Vietnam',
      };
      if (editingAddress) {
        const updated = await addressService.updateAddress(editingAddress.id, payload);
        setAddresses(addresses.map((a) => (a.id === editingAddress.id ? updated : a)));
        toast.success('Đã cập nhật địa chỉ');
      } else {
        const created = await addressService.createAddress(payload);
        setAddresses([...addresses, created]);
        toast.success('Đã thêm địa chỉ mới');
      }
      setShowModal(false);
    } catch {
      toast.error('Không thể lưu địa chỉ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    try {
      await addressService.deleteAddress(id);
      setAddresses(addresses.filter((a) => a.id !== id));
      toast.success('Đã xóa địa chỉ');
    } catch {
      toast.error('Không thể xóa địa chỉ');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressService.setDefaultAddress(id);
      setAddresses(
        addresses.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );
      toast.success('Đã đặt địa chỉ mặc định');
    } catch {
      toast.error('Không thể cập nhật');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Sổ địa chỉ</h2>
        <Button onClick={openAddModal} leftIcon={<Plus className="w-4 h-4" />}>
          Thêm địa chỉ
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-xl">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Bạn chưa có địa chỉ nào</p>
          <Button onClick={openAddModal}>Thêm địa chỉ đầu tiên</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="bg-card border rounded-xl p-4 flex items-start justify-between"
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{addr.fullName}</span>
                    <span className="text-sm text-muted-foreground">| {addr.phone}</span>
                    {addr.isDefault && (
                      <Badge variant="success" size="sm">
                        Mặc định
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {addr.addressLine1}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!addr.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Mặc định
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => openEditModal(addr)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(addr.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Họ tên"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Nguyễn Văn A"
            />
            <Input
              label="Số điện thoại"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0912345678"
            />
          </div>
          <Input
            label="Tỉnh/Thành phố"
            value={formData.province}
            onChange={(e) => setFormData({ ...formData, province: e.target.value, city: e.target.value })}
            placeholder="Hồ Chí Minh"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quận/Huyện"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              placeholder="Quận 1"
            />
            <Input
              label="Phường/Xã"
              value={formData.ward}
              onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
              placeholder="Phường Bến Nghé"
            />
          </div>
          <Input
            label="Địa chỉ cụ thể"
            value={formData.addressLine1}
            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            placeholder="Số 123, Đường Lê Lợi"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="accent-primary"
            />
            Đặt làm địa chỉ mặc định
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              {editingAddress ? 'Cập nhật' : 'Thêm địa chỉ'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
