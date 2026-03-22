import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CmsService } from './cms.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Public()
  @Get('pages')
  getPages() {
    return this.cmsService.getPages();
  }

  @Public()
  @Get('pages/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.cmsService.getBySlug(slug);
  }

  @Post('pages')
  create(@Body() dto: any) {
    return this.cmsService.create(dto);
  }

  @Put('pages/:id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.cmsService.update(+id, dto);
  }

  @Delete('pages/:id')
  delete(@Param('id') id: string) {
    return this.cmsService.delete(+id);
  }
}
