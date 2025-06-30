import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(private prisma: PrismaService) {}

  // Run daily at 11:59 PM to calculate end-of-day balances
  @Cron('59 23 * * *')
  async calculateDailyBalances() {
    this.logger.log('Starting daily balance calculation...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    try {
      // Get all users who had transactions today
      const usersWithTransactions = await this.prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          },
          status: 'COMPLETED'
        },
        select: { userId: true },
        distinct: ['userId']
      });

      for (const { userId } of usersWithTransactions) {
        await this.calculateUserDailyBalance(userId, today);
      }

      this.logger.log(`Daily balance calculation completed for ${usersWithTransactions.length} users`);
    } catch (error) {
      this.logger.error('Error calculating daily balances:', error);
    }
  }

  async calculateUserDailyBalance(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get previous day's balance
    const previousBalance = await this.getPreviousDayBalance(userId, date);

    // Calculate today's transactions
    const todayTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: 'COMPLETED'
      }
    });

    // Calculate net change from transactions
    let netChange = new Decimal(0);
    for (const transaction of todayTransactions) {
      switch (transaction.type) {
        case 'DEPOSIT':
        case 'GAME_WIN':
        case 'BONUS':
        case 'REFUND':
          netChange = netChange.plus(transaction.amount);
          break;
        case 'WITHDRAWAL':
        case 'GAME_LOSS':
          netChange = netChange.minus(transaction.amount);
          break;
      }
    }

    const newBalance = previousBalance.plus(netChange);

    // Upsert balance record for this date
    await this.prisma.balance.upsert({
      where: {
        userId_date: {
          userId,
          date: startOfDay
        }
      },
      update: {
        balance: newBalance
      },
      create: {
        userId,
        date: startOfDay,
        balance: newBalance
      }
    });

    this.logger.log(`Updated balance for user ${userId} on ${date.toDateString()}: ${newBalance}`);
    return newBalance;
  }

  async getPreviousDayBalance(userId: string, currentDate: Date): Promise<Decimal> {
    const previousDay = new Date(currentDate);
    previousDay.setDate(previousDay.getDate() - 1);
    previousDay.setHours(0, 0, 0, 0);

    const previousBalance = await this.prisma.balance.findFirst({
      where: {
        userId,
        date: {
          lte: previousDay
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return previousBalance ? previousBalance.balance : new Decimal(0);
  }

  async getCurrentBalance(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the latest balance record
    const latestBalance = await this.prisma.balance.findFirst({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    const baseBalance = latestBalance ? latestBalance.balance : new Decimal(0);

    // Get today's transactions since the last balance calculation
    const todayTransactions = await this.getTodayTransactions(userId);

    // Calculate today's net change
    let todayNetChange = new Decimal(0);
    for (const transaction of todayTransactions) {
      switch (transaction.type) {
        case 'DEPOSIT':
        case 'GAME_WIN':
        case 'BONUS':
        case 'REFUND':
          todayNetChange = todayNetChange.plus(transaction.amount);
          break;
        case 'WITHDRAWAL':
        case 'GAME_LOSS':
          todayNetChange = todayNetChange.minus(transaction.amount);
          break;
      }
    }

    const currentBalance = baseBalance.plus(todayNetChange);
    return parseFloat(currentBalance.toString());
  }

  async getTodayTransactions(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        status: 'COMPLETED'
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getBalanceHistory(userId: string, days: number = 30) {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return this.prisma.balance.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  async getDetailedBalance(userId: string) {
    const currentBalance = await this.getCurrentBalance(userId);
    const todayTransactions = await this.getTodayTransactions(userId);
    const balanceHistory = await this.getBalanceHistory(userId, 7);

    // Calculate today's totals
    let todayDeposits = new Decimal(0);
    let todayWithdrawals = new Decimal(0);
    let todayWins = new Decimal(0);
    let todayLosses = new Decimal(0);

    for (const transaction of todayTransactions) {
      switch (transaction.type) {
        case 'DEPOSIT':
          todayDeposits = todayDeposits.plus(transaction.amount);
          break;
        case 'WITHDRAWAL':
          todayWithdrawals = todayWithdrawals.plus(transaction.amount);
          break;
        case 'GAME_WIN':
          todayWins = todayWins.plus(transaction.amount);
          break;
        case 'GAME_LOSS':
          todayLosses = todayLosses.plus(transaction.amount);
          break;
      }
    }

    return {
      currentBalance,
      todayTransactions: todayTransactions.length,
      todayTotals: {
        deposits: parseFloat(todayDeposits.toString()),
        withdrawals: parseFloat(todayWithdrawals.toString()),
        wins: parseFloat(todayWins.toString()),
        losses: parseFloat(todayLosses.toString()),
        netChange: parseFloat(todayDeposits.plus(todayWins).minus(todayWithdrawals).minus(todayLosses).toString())
      },
      recentHistory: balanceHistory.slice(0, 7).map(balance => ({
        date: balance.date,
        balance: parseFloat(balance.balance.toString())
      }))
    };
  }

  // Manual trigger for balance calculation (useful for testing or manual updates)
  async triggerBalanceCalculation(userId?: string, date?: Date) {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    if (userId) {
      await this.calculateUserDailyBalance(userId, targetDate);
      return { 
        message: `Balance calculated for user ${userId} on ${targetDate.toDateString()}`,
        userId,
        date: targetDate
      };
    } else {
      await this.calculateDailyBalances();
      return { 
        message: `Daily balance calculation triggered for ${targetDate.toDateString()}`,
        date: targetDate
      };
    }
  }

  async getUserBalanceStats(userId: string) {
    // Get user's first transaction date
    const firstTransaction = await this.prisma.transaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    if (!firstTransaction) {
      return {
        currentBalance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalWins: 0,
        totalLosses: 0,
        memberSince: null,
        gamesPlayed: 0
      };
    }

    // Aggregate transaction data
    const transactionStats = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      },
      _count: true
    });

    // Get game statistics
    const gameStats = await this.prisma.gameResult.aggregate({
      where: { userId },
      _count: true,
      _sum: {
        betAmount: true,
        payout: true
      }
    });

    const currentBalance = await this.getCurrentBalance(userId);

    // Process transaction stats
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalWins = 0;
    let totalLosses = 0;

    for (const stat of transactionStats) {
      const amount = parseFloat(stat._sum.amount?.toString() || '0');
      switch (stat.type) {
        case 'DEPOSIT':
          totalDeposits += amount;
          break;
        case 'WITHDRAWAL':
          totalWithdrawals += amount;
          break;
        case 'GAME_WIN':
          totalWins += amount;
          break;
        case 'GAME_LOSS':
          totalLosses += amount;
          break;
      }
    }

    return {
      currentBalance,
      totalDeposits,
      totalWithdrawals,
      totalWins,
      totalLosses,
      netGambling: totalWins - totalLosses,
      memberSince: firstTransaction.createdAt,
      gamesPlayed: gameStats._count,
      totalBetAmount: parseFloat(gameStats._sum.betAmount?.toString() || '0'),
      totalPayout: parseFloat(gameStats._sum.payout?.toString() || '0')
    };
  }
}