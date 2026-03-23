import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ProductQuestionService } from './product-question.service';
import { Public } from '../common/decorators/auth/public.decorator';
import { CurrentUser } from '../common/decorators/auth/current-user.decorator';

@Controller('product-questions')
export class ProductQuestionController {
  constructor(private readonly productQuestionService: ProductQuestionService) {}

  @Public()
  @Get('product/:productId')
  getByProduct(@Param('productId') productId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.productQuestionService.getByProduct(productId, +(page || 1), +(limit || 10));
  }

  @Post()
  ask(@CurrentUser('id') userId: string, @Body() dto: { productId: string; question: string }) {
    return this.productQuestionService.ask(userId, dto.productId, dto.question);
  }

  @Post(':id/answer')
  answer(@CurrentUser('id') userId: string, @Param('id') id: string, @Body('answer') answer: string) {
    return this.productQuestionService.answer(+id, answer, userId);
  }
}
