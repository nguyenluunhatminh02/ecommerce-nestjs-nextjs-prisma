import { Controller, Get, Post, Body } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('affiliates')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Public()
  @Get('programs')
  getPrograms() {
    return this.affiliateService.getPrograms();
  }

  @Get('my')
  getMyAffiliate(@CurrentUser('id') userId: string) {
    return this.affiliateService.getMyAffiliate(userId);
  }

  @Post('join')
  join(@CurrentUser('id') userId: string, @Body('programId') programId: string) {
    return this.affiliateService.join(userId, +programId);
  }

  @Get('stats')
  getStats(@CurrentUser('id') userId: string) {
    return this.affiliateService.getStats(userId);
  }

  @Post('programs')
  createProgram(@Body() dto: any) {
    return this.affiliateService.createProgram(dto);
  }
}
