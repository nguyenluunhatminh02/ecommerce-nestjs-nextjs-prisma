import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async getAll(userId: string) {
    return this.prisma.addresses.findMany({
      where: { user_id: userId, deleted: false },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });
  }

  async getDefault(userId: string) {
    return this.prisma.addresses.findFirst({
      where: { user_id: userId, is_default: true, deleted: false },
    });
  }

  async getById(id: string, userId: string) {
    const addr = await this.prisma.addresses.findFirst({
      where: { id, user_id: userId, deleted: false },
    });
    if (!addr) throw new NotFoundException('Address not found');
    return addr;
  }

  async create(userId: string, dto: any) {
    if (dto.isDefault) {
      await this.prisma.addresses.updateMany({
        where: { user_id: userId },
        data: { is_default: false },
      });
    }
    return this.prisma.addresses.create({
      data: {
        user_id: userId,
        full_name: dto.fullName,
        phone: dto.phone,
        address_line1: dto.addressLine1,
        address_line2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        district: dto.district,
        ward: dto.ward,
        postal_code: dto.postalCode,
        country: dto.country || 'Vietnam',
        address_type: dto.addressType || 'HOME',
        is_default: dto.isDefault || false,
      },
    });
  }

  async update(id: string, userId: string, dto: any) {
    await this.getById(id, userId);
    if (dto.isDefault) {
      await this.prisma.addresses.updateMany({
        where: { user_id: userId },
        data: { is_default: false },
      });
    }
    return this.prisma.addresses.update({
      where: { id },
      data: {
        full_name: dto.fullName,
        phone: dto.phone,
        address_line1: dto.addressLine1,
        address_line2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        district: dto.district,
        ward: dto.ward,
        postal_code: dto.postalCode,
        country: dto.country,
        address_type: dto.addressType,
        is_default: dto.isDefault,
      },
    });
  }

  async delete(id: string, userId: string) {
    await this.getById(id, userId);
    return this.prisma.addresses.update({
      where: { id },
      data: { deleted: true },
    });
  }

  async setDefault(id: string, userId: string) {
    await this.getById(id, userId);
    await this.prisma.addresses.updateMany({
      where: { user_id: userId },
      data: { is_default: false },
    });
    return this.prisma.addresses.update({
      where: { id },
      data: { is_default: true },
    });
  }
}
