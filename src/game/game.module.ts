import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BalanceModule } from '../balance/balance.module';

@Module({
  imports: [PrismaModule, BalanceModule],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}