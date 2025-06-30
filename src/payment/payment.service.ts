import { Injectable, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import axios from 'axios';

@Injectable()
export class PaymentService {
  private readonly nowPaymentsApiUrl = 'https://api.nowpayments.io/v1';
  private readonly apiKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Req() req: Request
  ) {
    this.apiKey = this.configService.get<string>('NOWPAYMENTS_API_KEY');
  }

  

  async createPayment(createPaymentDto: CreatePaymentDto) {
    const { userId, amount, currency } = createPaymentDto;
// console.log(`${req.protocol}://${req.get('Host')}${req.originalUrl}`);
    try {
      // Create payment with NOWPayments
      const paymentData = {
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: currency.toLowerCase(),
        ipn_callback_url: `${this.configService.get('APP_URL')}/payment/webhook`,
        order_id: `dice-${Date.now()}`,
        order_description: 'Dice Casino Deposit',
      };

      const response = await axios.post(
        `${this.nowPaymentsApiUrl}/payment`,
        paymentData,
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      // Save transaction to database
      const transaction = await this.prisma.transaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount,
          currency,
          paymentId: response.data.payment_id,
          paymentUrl: response.data.pay_address,
          status: 'PENDING',
          description: 'Crypto deposit',
        },
      });

      return {
        transactionId: transaction.id,
        paymentId: response.data.payment_id,
        paymentUrl: response.data.pay_address,
        amount: response.data.pay_amount,
        currency: response.data.pay_currency,
      };
    } catch (error) {
      throw new Error(`Payment creation failed: ${error.message}`);
    }
  }

  async handleWebhook(webhookData: any) {

    console.log(webhookData)
    const { payment_id, payment_status } = webhookData;

    const transaction = await this.prisma.transaction.findUnique({
      where: { paymentId: payment_id },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Update transaction status
    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: payment_status === 'finished' ? 'COMPLETED' : 'FAILED',
        webhookReceived: true,
      },
    });

    // No need to update user balance directly - this will be handled by the daily cron job
    // The balance calculation will pick up completed transactions

    return updatedTransaction;
  }

  async getTransactionHistory(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}