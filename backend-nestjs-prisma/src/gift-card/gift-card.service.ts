import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class GiftCardService {
  constructor(private prisma: PrismaService) {}

  async getMyCards(userId: string) {
    return this.prisma.gift_cards.findMany({
      where: { OR: [{ purchased_by: userId }, { redeemed_by: userId }] },
      orderBy: { created_at: 'desc' },
    });
  }

  async getByCode(code: string) {
    const card = await this.prisma.gift_cards.findUnique({ where: { code } });
    if (!card) throw new NotFoundException();
    return card;
  }

  async create(userId: string, dto: any) {
    const code = randomBytes(8).toString('hex').toUpperCase();
    return this.prisma.gift_cards.create({
      data: {
        code, initial_balance: dto.amount, current_balance: dto.amount,
        purchased_by: userId,
        expires_at: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async redeem(userId: string, code: string) {
    const card = await this.prisma.gift_cards.findUnique({ where: { code } });
    if (!card || !card.active) throw new NotFoundException('Invalid gift card');
    if (card.expires_at && card.expires_at < new Date()) throw new BadRequestException('Gift card expired');
    if (Number(card.current_balance) <= 0) throw new BadRequestException('Gift card has no balance');
    return this.prisma.gift_cards.update({
      where: { code },
      data: { redeemed_by: userId },
    });
  }

  async applyToOrder(code: string, amount: number) {
    const card = await this.getByCode(code);
    if (Number(card.current_balance) < amount) throw new BadRequestException('Insufficient gift card balance');
    return this.prisma.gift_cards.update({
      where: { code },
      data: { current_balance: { decrement: amount } },
    });
  }
}
