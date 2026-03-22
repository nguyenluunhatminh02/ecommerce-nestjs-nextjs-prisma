import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserManagementController } from './user-management.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [UsersController, UserManagementController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
