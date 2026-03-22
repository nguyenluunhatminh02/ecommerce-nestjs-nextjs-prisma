import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  async getPrograms() {
    return this.prisma.loyalty_programs.findMany({ where: { active: true }, orderBy: { points_per_dollar: 'desc' } });
  }

  async getMyMembership(userId: string) {
    return this.prisma.loyalty_members.findFirst({
      where: { user_id: userId },
      include: { loyalty_programs: true },
    });
  }

  async join(userId: string, programId: number) {
    const existing = await this.prisma.loyalty_members.findFirst({ where: { user_id: userId } });
    if (existing) throw new BadRequestException('Already a loyalty member');
    return this.prisma.loyalty_members.create({
      data: { user_id: userId, program_id: programId, points_balance: 0, tier: 'BRONZE' },
      include: { loyalty_programs: true },
    });
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const member = await this.prisma.loyalty_members.findFirst({ where: { user_id: userId } });
    if (!member) return { items: [], total: 0, page, limit, balance: 0 };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.loyalty_transactions.findMany({
        where: { member_id: member.id }, skip, take: limit, orderBy: { created_at: 'desc' },
      }),
      this.prisma.loyalty_transactions.count({ where: { member_id: member.id } }),
    ]);
    return { items, total, page, limit, balance: member.points_balance };
  }

  async earnPoints(userId: string, points: number, description: string) {
    const member = await this.prisma.loyalty_members.findFirst({ where: { user_id: userId } });
    if (!member) return;
    await this.prisma.loyalty_members.update({ where: { id: member.id }, data: { points_balance: { increment: points }, total_points_earned: { increment: points } } });
    await this.prisma.loyalty_transactions.create({
      data: { member_id: member.id, type: 'EARN', points, description },
    });
  }

  async redeemPoints(userId: string, points: number, description: string) {
    const member = await this.prisma.loyalty_members.findFirst({ where: { user_id: userId } });
    if (!member) throw new NotFoundException();
    if (member.points_balance < points) throw new BadRequestException('Insufficient points');
    await this.prisma.loyalty_members.update({ where: { id: member.id }, data: { points_balance: { decrement: points }, total_points_redeemed: { increment: points } } });
    await this.prisma.loyalty_transactions.create({
      data: { member_id: member.id, type: 'REDEEM', points: -points, description },
    });
    return { message: 'Points redeemed', remaining: member.points_balance - points };
  }

  // Admin
  async createProgram(dto: any) {
    return this.prisma.loyalty_programs.create({
      data: { name: dto.name, description: dto.description, points_per_dollar: dto.pointsPerDollar },
    });
  }
}
