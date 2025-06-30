import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { BalanceModule } from './balance/balance.module';
import { PaymentService } from './payment/payment.service';
import { PaymentController } from './payment/payment.controller';
import { PaymentModule } from './payment/payment.module';



@Module({
  imports: [
    //ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
   PrismaModule,
    UserModule,
    GameModule,
    BalanceModule,
   PaymentModule,
 
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}

