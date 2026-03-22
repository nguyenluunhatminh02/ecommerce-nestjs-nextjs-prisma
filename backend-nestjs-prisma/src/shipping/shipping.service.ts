import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  async getMethods() {
    return this.prisma.shipping_methods.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  }

  async calculateCost(methodId: number, orderTotal: number, weight?: number) {
    const method = await this.prisma.shipping_methods.findUnique({ where: { id: methodId } });
    if (!method) throw new NotFoundException('Shipping method not found');
    let cost = Number(method.base_cost || 0);
    if (weight && weight > 1) cost += (weight - 1) * 2; // $2 per additional kg
    if (orderTotal >= 100) cost = 0; // Free shipping over $100
    return cost;
  }

  async getAllMethods() {
    return this.prisma.shipping_methods.findMany({ orderBy: { name: 'asc' } });
  }

  async createMethod(dto: any) {
    return this.prisma.shipping_methods.create({
      data: { name: dto.name, description: dto.description, base_cost: dto.baseCost, estimated_days: dto.estimatedDays },
    });
  }

  async updateMethod(id: number, dto: any) {
    return this.prisma.shipping_methods.update({ where: { id }, data: dto });
  }

  async deleteMethod(id: number) {
    return this.prisma.shipping_methods.delete({ where: { id } });
  }

  // Shipments
  async getShipment(id: string) {
    const shipment = await this.prisma.shipments.findUnique({ where: { id }, include: { orders: true } });
    if (!shipment) throw new NotFoundException();
    return shipment;
  }

  async createShipment(dto: any) {
    return this.prisma.shipments.create({
      data: {
        order_id: dto.orderId,
        tracking_number: dto.trackingNumber,
        carrier: dto.carrier,
        status: 'PENDING',
        estimated_delivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : null,
      },
    });
  }

  async updateShipment(id: string, dto: any) {
    const data: any = {};
    if (dto.status) data.status = dto.status;
    if (dto.trackingNumber) data.tracking_number = dto.trackingNumber;
    if (dto.status === 'SHIPPED') data.shipped_at = new Date();
    if (dto.status === 'DELIVERED') data.delivered_at = new Date();
    return this.prisma.shipments.update({ where: { id }, data });
  }

  async getByOrder(orderId: string) {
    return this.prisma.shipments.findMany({ where: { order_id: orderId } });
  }
}
