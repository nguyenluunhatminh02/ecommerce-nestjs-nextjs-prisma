import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(userId: string) {
    let wallet = await this.prisma.user_wallets.findUnique({ where: { user_id: userId } });
    if (!wallet) {
      wallet = await this.prisma.user_wallets.create({ data: { user_id: userId, balance: 0 } });
    }
    return wallet;
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await this.getWallet(userId);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.wallet_transactions.findMany({
        where: { wallet_id: wallet.id }, skip, take: limit, orderBy: { created_at: 'desc' },
      }),
      this.prisma.wallet_transactions.count({ where: { wallet_id: wallet.id } }),
    ]);
    return { items, total, page, limit, balance: wallet.balance };
  }

  async topUp(userId: string, amount: number, method: string) {
    const wallet = await this.getWallet(userId);
    await this.prisma.user_wallets.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } });
    await this.prisma.wallet_transactions.create({
      data: { wallet_id: wallet.id, type: 'CREDIT', amount, description: `Top up via ${method}` },
    });
    return this.getWallet(userId);
  }

  async debit(userId: string, amount: number, description: string, referenceId?: string) {
    const wallet = await this.getWallet(userId);
    if (Number(wallet.balance) < amount) throw new BadRequestException('Insufficient balance');
    await this.prisma.user_wallets.update({ where: { id: wallet.id }, data: { balance: { decrement: amount } } });
    await this.prisma.wallet_transactions.create({
      data: { wallet_id: wallet.id, type: 'DEBIT', amount: -amount, description, reference_id: referenceId },
    });
    return this.getWallet(userId);
  }

  async credit(userId: string, amount: number, description: string, referenceId?: string) {
    const wallet = await this.getWallet(userId);
    await this.prisma.user_wallets.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } });
    await this.prisma.wallet_transactions.create({
      data: { wallet_id: wallet.id, type: 'CREDIT', amount, description, reference_id: referenceId },
    });
    return this.getWallet(userId);
  }

  async getAllWallets(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.user_wallets.findMany({ skip, take: limit, orderBy: { created_at: 'desc' }, include: { users: { select: { id: true, first_name: true, last_name: true, email: true } } } }),
      this.prisma.user_wallets.count(),
    ]);
    return { items, total, page, limit };
  }
}
