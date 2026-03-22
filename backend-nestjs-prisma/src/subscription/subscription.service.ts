import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    return this.prisma.subscription_plans.findMany({ where: { active: true }, orderBy: { price: 'asc' } });
  }

  async getMySubscription(userId: string) {
    return this.prisma.subscriptions.findFirst({
      where: { user_id: userId, status: 'ACTIVE' },
      include: { subscription_plans: true },
    });
  }

  async subscribe(userId: string, planId: number) {
    const existing = await this.prisma.subscriptions.findFirst({ where: { user_id: userId, status: 'ACTIVE' } });
    if (existing) throw new BadRequestException('Already subscribed');
    const plan = await this.prisma.subscription_plans.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    const now = new Date();
    const endDate = new Date(now);
    if (plan.billing_cycle === 'MONTHLY') endDate.setMonth(endDate.getMonth() + 1);
    else if (plan.billing_cycle === 'YEARLY') endDate.setFullYear(endDate.getFullYear() + 1);
    return this.prisma.subscriptions.create({
      data: { user_id: userId, plan_id: planId, status: 'ACTIVE', start_date: now, end_date: endDate },
      include: { subscription_plans: true },
    });
  }

  async cancel(userId: string) {
    const sub = await this.prisma.subscriptions.findFirst({ where: { user_id: userId, status: 'ACTIVE' } });
    if (!sub) throw new NotFoundException();
    return this.prisma.subscriptions.update({
      where: { id: sub.id },
      data: { status: 'CANCELLED' },
    });
  }

  // Admin
  async createPlan(dto: any) {
    return this.prisma.subscription_plans.create({
      data: { name: dto.name, description: dto.description, price: dto.price, billing_cycle: dto.billingCycle, features: dto.features || {} },
    });
  }

  async updatePlan(id: number, dto: any) {
    return this.prisma.subscription_plans.update({ where: { id }, data: dto });
  }

  async getAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.subscriptions.findMany({ skip, take: limit, orderBy: { created_at: 'desc' }, include: { users: { select: { id: true, first_name: true, last_name: true, email: true } }, subscription_plans: true } }),
      this.prisma.subscriptions.count(),
    ]);
    return { items, total, page, limit };
  }
}
