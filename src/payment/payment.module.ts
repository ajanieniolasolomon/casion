import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { BalanceModule } from '../balance/balance.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [PrismaModule, UserModule,BalanceModule],
  controllers: [PaymentController],
  providers: [PaymentService,ConfigService],
  exports:[PaymentService]
})
export class PaymentModule {}