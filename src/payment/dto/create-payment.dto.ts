
// DTO for creating payment
import { IsString, IsNumber, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'User ID who is making the payment' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Payment currency (e.g., USD, EUR)' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Payment ID from payment provider' })
  @IsString()
  paymentId: string;

  @ApiProperty({ description: 'Payment URL for completing the payment' })
  @IsUrl()
  paymentUrl: string;
}