import { Controller, Get, Post, Patch, Body, Param, Query, Headers } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Public } from '../common/decorators/auth/public.decorator';
import { CurrentUser } from '../common/decorators/auth/current-user.decorator';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @Get('methods')
  getMethods() {
    return this.paymentService.getMethods();
  }

  @Get('order/:orderId')
  getByOrder(@Param('orderId') orderId: string) {
    return this.paymentService.getByOrder(orderId);
  }

  // ─── Stripe ────────────────────────────────────────────────────────────

  @Post('create-intent/:orderId')
  createPaymentIntent(@CurrentUser('id') userId: string, @Param('orderId') orderId: string) {
    return this.paymentService.createPaymentIntent(userId, orderId);
  }

  @Post('confirm')
  confirmPayment(@Query('paymentIntentId') paymentIntentId: string) {
    return this.paymentService.confirmPayment(paymentIntentId);
  }

  // ─── PayPal ────────────────────────────────────────────────────────────

  @Post('paypal/create-order/:orderId')
  createPayPalOrder(@CurrentUser('id') userId: string, @Param('orderId') orderId: string) {
    return this.paymentService.createPayPalOrder(userId, orderId);
  }

  @Post('paypal/capture-order/:paypalOrderId')
  capturePayPalOrder(@Param('paypalOrderId') paypalOrderId: string) {
    return this.paymentService.capturePayPalOrder(paypalOrderId);
  }

  @Get('paypal/order/:paypalOrderId')
  getPayPalOrderDetails(@Param('paypalOrderId') paypalOrderId: string) {
    return this.paymentService.getPayPalOrderDetails(paypalOrderId);
  }

  // ─── COD & Bank Transfer ──────────────────────────────────────────────

  @Post('cod/:orderId')
  confirmCOD(@CurrentUser('id') userId: string, @Param('orderId') orderId: string) {
    return this.paymentService.confirmCOD(userId, orderId);
  }

  @Post('bank-transfer/:orderId')
  confirmBankTransfer(@CurrentUser('id') userId: string, @Param('orderId') orderId: string) {
    return this.paymentService.confirmBankTransfer(userId, orderId);
  }

  @Post('refund/:orderId')
  requestRefund(@CurrentUser('id') userId: string, @Param('orderId') orderId: string, @Query('amount') amount: string, @Query('reason') reason?: string) {
    return this.paymentService.requestRefund(userId, orderId, +amount, reason);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.paymentService.create(userId, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: { status: string }) {
    return this.paymentService.updateStatus(id, dto.status);
  }

  @Public()
  @Post('webhook/:provider')
  webhook(@Param('provider') provider: string, @Body() payload: any, @Headers('stripe-signature') signature?: string) {
    return this.paymentService.processWebhook(provider, payload, signature);
  }
}
