import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AffiliateService {
  constructor(private prisma: PrismaService) {}

  async getPrograms() {
    return this.prisma.affiliate_programs.findMany({ where: { active: true } });
  }

  async getMyAffiliate(userId: string) {
    const affiliate = await this.prisma.affiliates.findFirst({
      where: { user_id: userId },
      include: { affiliate_programs: true },
    });
    if (!affiliate) return null;
    return this.withReferralLink(affiliate);
  }

  async join(userId: string, programId: number) {
    const existing = await this.prisma.affiliates.findFirst({ where: { user_id: userId } });
    if (existing) throw new BadRequestException('Already an affiliate');
    const code = randomBytes(6).toString('hex').toUpperCase();
    const affiliate = await this.prisma.affiliates.create({
      data: { user_id: userId, program_id: programId, referral_code: code, status: 'ACTIVE' },
      include: { affiliate_programs: true },
    });
    return this.withReferralLink(affiliate);
  }

  async getStats(userId: string) {
    const affiliate = await this.prisma.affiliates.findFirst({ where: { user_id: userId } });
    // Return empty stats if user is not yet an affiliate (no 404)
    if (!affiliate) {
      return { totalEarnings: 0, totalClicks: 0, totalConversions: 0, totalReferrals: 0, pendingEarnings: 0, referralCode: null };
    }
    return {
      totalEarnings: affiliate.total_earnings ?? 0,
      totalClicks: affiliate.total_clicks ?? 0,
      totalConversions: affiliate.total_conversions ?? 0,
      totalReferrals: affiliate.total_clicks ?? 0,
      pendingEarnings: 0,
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

  // ── Admin ──────────────────────────────────────────────────────────────────

  async getAllPrograms() {
    return this.prisma.affiliate_programs.findMany({ orderBy: { id: 'asc' } });
  }

  async createProgram(dto: any) {
    return this.prisma.affiliate_programs.create({
      data: { name: dto.name, description: dto.description, commission_rate: dto.commissionRate },
    });
  }

  async getAdminAffiliates(params: { page: number; size: number; keyword?: string; status?: string }) {
    const { page, size, keyword, status } = params;
    const where: any = {};
    if (status) where.status = status;
    if (keyword) {
      where.users = { OR: [{ first_name: { contains: keyword, mode: 'insensitive' } }, { last_name: { contains: keyword, mode: 'insensitive' } }, { email: { contains: keyword, mode: 'insensitive' } }] };
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.affiliates.findMany({
        where,
        skip: page * size,
        take: size,
        include: { users: { select: { first_name: true, last_name: true, email: true } }, affiliate_programs: true },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.affiliates.count({ where }),
    ]);
    return {
      content: items.map((a: any) => ({
        id: a.id,
        userName: a.users ? `${a.users.first_name} ${a.users.last_name}`.trim() : '',
        userEmail: a.users?.email ?? '',
        referralCode: a.referral_code,
        totalEarnings: a.total_earnings ?? 0,
        totalClicks: a.total_clicks ?? 0,
        totalConversions: a.total_conversions ?? 0,
        status: a.status,
        createdAt: a.created_at,
      })),
      total,
      totalPages: Math.ceil(total / size),
      totalElements: total,
    };
  }

  async getAdminSummary() {
    const [totalAffiliates, earnings] = await this.prisma.$transaction([
      this.prisma.affiliates.count(),
      this.prisma.affiliates.aggregate({ _sum: { total_earnings: true, total_clicks: true, total_conversions: true } }),
    ]);
    return {
      totalAffiliates,
      totalEarnings: earnings._sum.total_earnings ?? 0,
      totalClicks: earnings._sum.total_clicks ?? 0,
      totalConversions: earnings._sum.total_conversions ?? 0,
    };
  }

  async updateAffiliateStatus(id: string, status: string) {
    return this.prisma.affiliates.update({ where: { id: parseInt(id, 10) }, data: { status } });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private withReferralLink(affiliate: any) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return {
      ...affiliate,
      referralCode: affiliate.referral_code,
      referralLink: `${baseUrl}/?ref=${affiliate.referral_code}`,
    };
  }
}
