import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AffiliateService {
  constructor(private prisma: PrismaService) {}

  async getPrograms() {
    return this.prisma.affiliate_programs.findMany({ where: { active: true } });
  }

  async getMyAffiliate(userId: string) {
    return this.prisma.affiliates.findFirst({
      where: { user_id: userId },
      include: { affiliate_programs: true },
    });
  }

  async join(userId: string, programId: number) {
    const existing = await this.prisma.affiliates.findFirst({ where: { user_id: userId } });
    if (existing) throw new BadRequestException('Already an affiliate');
    const code = randomBytes(6).toString('hex').toUpperCase();
    return this.prisma.affiliates.create({
      data: { user_id: userId, program_id: programId, referral_code: code, status: 'ACTIVE' },
      include: { affiliate_programs: true },
    });
  }

  async getStats(userId: string) {
    const affiliate = await this.prisma.affiliates.findFirst({ where: { user_id: userId } });
    if (!affiliate) throw new NotFoundException();
    return {
      totalEarnings: affiliate.total_earnings,
      totalClicks: affiliate.total_clicks,
      totalConversions: affiliate.total_conversions,
      referralCode: affiliate.referral_code,
    };
  }

  async trackReferral(referralCode: string) {
    const affiliate = await this.prisma.affiliates.findFirst({ where: { referral_code: referralCode } });
    if (!affiliate) return null;
    await this.prisma.affiliates.update({
      where: { id: affiliate.id },
      data: { total_clicks: { increment: 1 } },
    });
    return affiliate;
  }

  // Admin
  async createProgram(dto: any) {
    return this.prisma.affiliate_programs.create({
      data: { name: dto.name, description: dto.description, commission_rate: dto.commissionRate },
    });
  }
}
