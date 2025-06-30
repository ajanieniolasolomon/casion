
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BalanceService } from '../balance/balance.service';
import { PlayDiceDto } from './dto/play-dice.dto';

@Injectable()
export class GameService {
  constructor(
    private prisma: PrismaService,
    private balanceService: BalanceService,
  ) {}

  async playDice(playDiceDto: PlayDiceDto) {
    const { userId, betAmount, prediction } = playDiceDto;
    
    // Check user balance using BalanceService
    const balance = await this.balanceService.getCurrentBalance(userId);
    if (balance < betAmount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Roll dice (1-6)
    const diceResult = Math.floor(Math.random() * 6) + 1;
    const isWin = diceResult === prediction;
    const payout = isWin ? betAmount * 5 : 0; // 5x multiplier for exact match
    const netAmount = payout - betAmount;

    // Start transaction
    return this.prisma.$transaction(async (tx) => {
      // Create game result
      const gameResult = await tx.gameResult.create({
        data: {
          userId,
          betAmount,
          prediction,
          result: diceResult,
          payout,
          isWin,
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: isWin ? 'GAME_WIN' : 'GAME_LOSS',
          amount: isWin ? payout : betAmount,
          status: 'COMPLETED',
          description: `Dice game - ${isWin ? 'Won' : 'Lost'}`,
        },
      });

      // Get updated balance
      const newBalance = await this.balanceService.getCurrentBalance(userId);

      return {
        ...gameResult,
        diceResult,
        isWin,
        payout,
        newBalance,
      };
    });
  }

  async getGameHistory(userId: string) {
    return this.prisma.gameResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}