import { Controller, Get, Post, Put, Delete, Body, Param, Query, Patch } from '@nestjs/common';
import { ShopService } from './shop.service';
import { Public } from '../common/decorators/auth/public.decorator';
import { CurrentUser } from '../common/decorators/auth/current-user.decorator';

@Controller('shops')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Public()
  @Get()
  getAll(@Query('search') search?: string, @Query('page') page?: string, @Query('limit') limit?: string, @Query('size') size?: string) {
    return this.shopService.getAll(search, +(page || 0), +(size || limit || 20));
  }

  @Get('my-shop')
  getMyShop(@CurrentUser('id') userId: string) {
    return this.shopService.getMyShop(userId);
  }

  @Public()
  @Get('slug/:slug')
  getBySlugPath(@Param('slug') slug: string) {
    return this.shopService.getBySlug(slug);
  }

  @Public()
  @Get('search')
  search(@Query('keyword') keyword: string, @Query('page') page?: string, @Query('size') size?: string) {
    return this.shopService.getAll(keyword, Math.max(0, +(page || 0)), Math.max(1, +(size || 10)));
  }

  @Public()
  @Get('top')
  getTopShops(@Query('limit') limit?: string) {
    return this.shopService.getTopShops(+(limit || 10));
  }

  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.shopService.getBySlug(slug);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.shopService.create(userId, dto);
  }

  @Put(':id')
  update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: any) {
    return this.shopService.update(userId, id, dto);
  }

  @Post(':id/follow')
  follow(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.shopService.follow(userId, id);
  }

  @Delete(':id/follow')
  unfollow(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.shopService.unfollow(userId, id);
  }

  @Delete(':id')
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.shopService.delete(userId, id);
  }
}
