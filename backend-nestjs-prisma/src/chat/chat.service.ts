import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getMyRooms(userId: string) {
    return this.prisma.chat_rooms.findMany({
      where: { OR: [{ buyer_id: userId }, { seller_id: userId }] },
      include: {
        buyer: { select: { id: true, first_name: true, last_name: true, avatar_url: true } },
        seller: { select: { id: true, first_name: true, last_name: true, avatar_url: true } },
        messages: { take: 1, orderBy: { created_at: 'desc' } },
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async getOrCreateRoom(userId: string, shopId: string) {
    const shop = await this.prisma.shops.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    let room = await this.prisma.chat_rooms.findFirst({
      where: { buyer_id: userId, shop_id: shopId },
    });
    if (!room) {
      room = await this.prisma.chat_rooms.create({ data: { buyer_id: userId, seller_id: shop.user_id, shop_id: shopId } });
    }
    return room;
  }

  async getMessages(userId: string, roomId: string, page = 0, size = 50) {
    const skip = page * size;
    const room = await this.prisma.chat_rooms.findFirst({
      where: { id: roomId, OR: [{ buyer_id: userId }, { seller_id: userId }] },
    });
    if (!room) throw new NotFoundException();
    const [items, total] = await Promise.all([
      this.prisma.chat_messages.findMany({
        where: { chat_room_id: roomId },
        skip, take: size, orderBy: { created_at: 'desc' },
        include: { users: { select: { id: true, first_name: true, last_name: true, avatar_url: true } } },
      }),
      this.prisma.chat_messages.count({ where: { chat_room_id: roomId } }),
    ]);
    const totalPages = Math.ceil(total / size);
    return { content: items.reverse(), page, size, totalElements: total, totalPages, first: page === 0, last: page >= totalPages - 1 };
  }

  async sendMessage(userId: string, roomId: string, content: string) {
    const room = await this.prisma.chat_rooms.findFirst({
      where: { id: roomId, OR: [{ buyer_id: userId }, { seller_id: userId }] },
    });
    if (!room) throw new NotFoundException();
    const message = await this.prisma.chat_messages.create({
      data: { chat_room_id: roomId, sender_id: userId, content },
      include: { users: { select: { id: true, first_name: true, last_name: true, avatar_url: true } } },
    });
    await this.prisma.chat_rooms.update({ where: { id: roomId }, data: { last_message: content, last_message_at: new Date() } });
    return message;
  }

  async markRead(userId: string, roomId: string) {
    await this.prisma.chat_messages.updateMany({
      where: { chat_room_id: roomId, sender_id: { not: userId }, is_read: false },
      data: { is_read: true },
    });
    return { message: 'Messages marked as read' };
  }

  async getUnreadCount(userId: string) {
    const rooms = await this.prisma.chat_rooms.findMany({
      where: { OR: [{ buyer_id: userId }, { seller_id: userId }] },
      select: { id: true },
    });
    const roomIds = rooms.map(r => r.id);
    if (!roomIds.length) return 0;
    return this.prisma.chat_messages.count({
      where: { chat_room_id: { in: roomIds }, sender_id: { not: userId }, is_read: false },
    });
  }
}
