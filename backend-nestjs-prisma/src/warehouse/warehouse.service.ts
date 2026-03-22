import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarehouseService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.warehouses.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  }

  async getById(id: number) {
    const wh = await this.prisma.warehouses.findUnique({ where: { id } });
    if (!wh) throw new NotFoundException();
    return wh;
  }

  async create(dto: any) {
    return this.prisma.warehouses.create({
      data: { name: dto.name, code: dto.code, address: dto.address, city: dto.city, state: dto.state, country: dto.country, phone: dto.phone },
    });
  }

  async update(id: number, dto: any) {
    return this.prisma.warehouses.update({ where: { id }, data: dto });
  }

  async delete(id: number) {
    return this.prisma.warehouses.update({ where: { id }, data: { active: false } });
  }

  async getStocks(warehouseId: number) {
    return this.prisma.warehouse_stocks.findMany({
      where: { warehouse_id: warehouseId },
      include: { products: { select: { id: true, name: true, sku: true } } },
    });
  }

  async updateStock(warehouseId: number, productId: string, quantity: number) {
    const existing = await this.prisma.warehouse_stocks.findFirst({
      where: { warehouse_id: warehouseId, product_id: productId },
    });
    if (existing) {
      return this.prisma.warehouse_stocks.update({ where: { id: existing.id }, data: { quantity } });
    }
    return this.prisma.warehouse_stocks.create({
      data: { warehouse_id: warehouseId, product_id: productId, quantity },
    });
  }
}
