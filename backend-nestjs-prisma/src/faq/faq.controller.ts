import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { FaqService } from './faq.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('faqs')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Public()
  @Get()
  getAll(@Query('category') category?: string) {
    return this.faqService.getAll(category);
  }

  @Post()
  create(@Body() dto: any) {
    return this.faqService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.faqService.update(+id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.faqService.delete(+id);
  }
}
