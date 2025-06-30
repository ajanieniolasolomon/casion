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
   
  ) {
    this.apiKey = this.configService.get<string>('NOWPAYMENTS_API_KEY');
  }

  async createPayment(createPaymentDto: CreatePaymentDto) {
    console.log(createPaymentDto);
    const { userId, amount, currency, paymentId, paymentUrl } = createPaymentDto;

    try {
      // Create payment record in database
      const payment = await this.prisma.transaction.create({
        data: {
          userId,
          amount,
             type: 'DEPOSIT',
          currency,
          paymentId,
          paymentUrl,
       status: 'PENDING',
          createdAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Payment created successfully',
        data: payment,
      };
    } catch (error) {
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }



  async handleWebhook(webhookData: any) {






    


    const { payment_id, invoice_id, payment_status } = webhookData;

    const transaction = await this.prisma.transaction.findUnique({
      where: { paymentId: invoice_id.toString() },
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