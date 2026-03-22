import { Controller, Get, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserManagementController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  async getMe(@CurrentUser('id') userId: string) {
    return this.prisma.users.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        avatar_url: true,
        is_active: true,
        created_at: true,
        user_roles: { include: { roles: true } },
      },
    });
  }

  @Get()
  async getAll(
    @Query('keyword') keyword?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    const take = Math.min(+(size || 20), 100);
    const skip = +(page || 0) * take;
    const where: any = {};
    if (keyword) {
      where.OR = [
        { first_name: { contains: keyword, mode: 'insensitive' } },
        { last_name: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.user_roles = { some: { roles: { name: role } } };
    }
    const [items, total] = await Promise.all([
      this.prisma.users.findMany({
        where, skip, take, orderBy: { created_at: 'desc' },
        select: { id: true, first_name: true, last_name: true, email: true, phone: true, avatar_url: true, is_active: true, created_at: true, user_roles: { include: { roles: true } } },
      }),
      this.prisma.users.count({ where }),
    ]);
    const totalPages = Math.ceil(total / take);
    return { content: items, page: +(page || 0), size: take, totalElements: total, totalPages, first: +(page || 0) === 0, last: +(page || 0) >= totalPages - 1 };
  }

  @Get('id/:id')
  async getById(@Param('id') id: string) {
    return this.prisma.users.findUniqueOrThrow({
      where: { id },
      select: { id: true, first_name: true, last_name: true, email: true, phone: true, avatar_url: true, is_active: true, created_at: true, user_roles: { include: { roles: true } } },
    });
  }

  @Put(':id/toggle-status')
  async toggleStatus(@Param('id') id: string) {
    const user = await this.prisma.users.findUniqueOrThrow({ where: { id } });
    return this.prisma.users.update({ where: { id }, data: { is_active: !user.is_active } });
  }

  @Put(':id/role')
  async updateRole(@Param('id') id: string, @Query('role') role: string) {
    const roleRecord = await this.prisma.roles.findFirst({ where: { name: role as any } });
    if (!roleRecord) throw new Error(`Role ${role} not found`);
    await this.prisma.user_roles.deleteMany({ where: { users_id: id } });
    await this.prisma.user_roles.create({ data: { users_id: id, roles_id: roleRecord.id } });
    return { message: `Role updated to ${role}` };
  }

  @Put('me/password')
  async changePassword() {
    // Delegates to auth/change-password - this is a redirect alias
    return { message: 'Use POST /auth/change-password instead' };
  }
}
