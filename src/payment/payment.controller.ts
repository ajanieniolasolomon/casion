import { Controller, Post, Body, Get, Param, HttpCode, BadRequestException, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'NOWPayments webhook endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully',
    schema: {
      example: {
        success: true,
        message: 'Webhook processed successfully'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid webhook data' 
  })
  async handleWebhook(
    @Body() webhookData: any,

    @Req() request: Request
  ) {
    try {
      // Log the raw webhook data for debugging

      console.log('Webhook Body:', JSON.stringify(webhookData, null, 2));
      console.log('Request Content-Type:', request.headers['content-type']);

      // Validate that we received JSON data
      if (!webhookData || typeof webhookData !== 'object') {
        throw new BadRequestException('Invalid JSON data received');
      }

      // Process the webhook
      const result = await this.paymentService.handleWebhook(JSON.parse(webhookData));
      
      return {
        success: true,
        message: 'Webhook processed successfully',
        data: result
      };
    } catch (error) {
      console.error('Webhook processing error:', error);
      throw new BadRequestException(`Webhook processing failed: ${error.message}`);
    }
  }


  @Get('transactions/:userId')
  @ApiOperation({ summary: 'Get user transaction history' })
  async getTransactionHistory(@Param('userId') userId: string) {
    return this.paymentService.getTransactionHistory(userId);
  }
}