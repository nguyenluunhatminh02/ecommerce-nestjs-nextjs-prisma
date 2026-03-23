import {
  Controller, Get, Post, Put, Body, Param, Query,
  BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { Public } from '../common/decorators/auth/public.decorator';
import { CurrentUser } from '../common/decorators/auth/current-user.decorator';

@Controller('affiliates')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  // ── Public ──────────────────────────────────────────────────────────────────

  @Public()
  @Get('programs')
  getPrograms() {
    return this.affiliateService.getPrograms();
  }

  @Public()
  @Get('track/:code')
  trackReferral(@Param('code') code: string) {
    return this.affiliateService.trackReferral(code);
  }

  // ── Authenticated user ───────────────────────────────────────────────────────

  @Get('my')
  getMyAffiliate(@CurrentUser('id') userId: string) {
    return this.affiliateService.getMyAffiliate(userId);
  }

  @Post('join')
  join(
    @CurrentUser('id') userId: string,
    @Body('programId') programId: string,
  ) {
    const id = parseInt(programId, 10);
    if (isNaN(id)) throw new BadRequestException('programId must be a number');
    return this.affiliateService.join(userId, id);
  }

  @Get('stats')
  getStats(@CurrentUser('id') userId: string) {
    return this.affiliateService.getStats(userId);
  }

  // ── Admin ────────────────────────────────────────────────────────────────────

  private requireAdmin(user: any) {
    const isAdmin = (user?.roles ?? []).some(
      (r: any) => r?.name === 'ADMIN' || r?.name === 'admin',
    );
    if (!isAdmin) throw new ForbiddenException('Admin only');
  }

  @Post('programs')
  createProgram(@CurrentUser() user: any, @Body() dto: any) {
    this.requireAdmin(user);
    return this.affiliateService.createProgram(dto);
  }

  @Get('programs/all')
  getAllPrograms(@CurrentUser() user: any) {
    this.requireAdmin(user);
    return this.affiliateService.getAllPrograms();
  }

  @Get('admin/all')
  getAdminAffiliates(
    @CurrentUser() user: any,
    @Query('page') page = '0',
    @Query('size') size = '20',
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    this.requireAdmin(user);
    return this.affiliateService.getAdminAffiliates({
      page: parseInt(page, 10) || 0,
      size: parseInt(size, 10) || 20,
      keyword,
      status,
    });
  }

  @Get('admin/summary')
  getAdminSummary(@CurrentUser() user: any) {
    this.requireAdmin(user);
    return this.affiliateService.getAdminSummary();
  }

  @Put('admin/:id/approve')
  approveAffiliate(@CurrentUser() user: any, @Param('id') id: string) {
    this.requireAdmin(user);
    return this.affiliateService.updateAffiliateStatus(id, 'APPROVED');
  }

  @Put('admin/:id/suspend')
  suspendAffiliate(@CurrentUser() user: any, @Param('id') id: string) {
    this.requireAdmin(user);
    return this.affiliateService.updateAffiliateStatus(id, 'SUSPENDED');
  }
}
