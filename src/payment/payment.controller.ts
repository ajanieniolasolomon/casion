import { Controller, Post, Body, Get, Param, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create crypto payment' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPayment(createPaymentDto);
  }

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'NOWPayments webhook endpoint' })
  async handleWebhook(@Body() webhookData: any) {
    return this.paymentService.handleWebhook(webhookData);
  }

  @Get('transactions/:userId')
  @ApiOperation({ summary: 'Get user transaction history' })
  async getTransactionHistory(@Param('userId') userId: string) {
    return this.paymentService.getTransactionHistory(userId);
  }
}