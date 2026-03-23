import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../common/decorators/auth/current-user.decorator';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@CurrentUser('id') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Get('transactions')
  getTransactions(@CurrentUser('id') userId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const normalizedPage = Math.max(1, +(page || 1));
    const normalizedLimit = Math.max(1, +(limit || 20));
    return this.walletService.getTransactions(userId, normalizedPage, normalizedLimit);
  }

  @Get('admin/all')
  async getAllWallets(@Query('page') page?: string, @Query('size') size?: string) {
    return this.walletService.getAllWallets(Math.max(1, +(page || 1)), Math.max(1, +(size || 20)));
  }

  @Post('top-up')
  topUp(@CurrentUser('id') userId: string, @Body() dto: { amount: number; method: string }) {
    return this.walletService.topUp(userId, dto.amount, dto.method);
  }
}
