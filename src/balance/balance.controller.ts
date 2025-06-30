import { Controller, Get, Post, Param, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { BalanceService } from './balance.service';

@ApiTags('balance')
@Controller('balance')
export class BalanceController {
  constructor(private balanceService: BalanceService) {}

  @Get(':userId/current')
  @ApiOperation({ summary: 'Get current user balance' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Current balance retrieved successfully' })
  async getCurrentBalance(@Param('userId') userId: string) {
    const balance = await this.balanceService.getCurrentBalance(userId);
    return { 
      balance, 
      userId,
      timestamp: new Date().toISOString()
    };
  }

  @Get(':userId/detailed')
  @ApiOperation({ summary: 'Get detailed balance information' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Detailed balance information retrieved successfully' })
  async getDetailedBalance(@Param('userId') userId: string) {
    const detailedBalance = await this.balanceService.getDetailedBalance(userId);
    return {
      userId,
      ...detailedBalance,
      timestamp: new Date().toISOString()
    };
  }

  @Get(':userId/history')
  @ApiOperation({ summary: 'Get user balance history' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to retrieve (default: 30)' })
  @ApiResponse({ status: 200, description: 'Balance history retrieved successfully' })
  async getBalanceHistory(
    @Param('userId') userId: string,
    @Query('days') days?: string
  ) {
    const numDays = days ? parseInt(days, 10) : 30;
    
    if (isNaN(numDays) || numDays < 1 || numDays > 365) {
      throw new BadRequestException('Days must be a number between 1 and 365');
    }

    const history = await this.balanceService.getBalanceHistory(userId, numDays);
    return { 
      history, 
      userId,
      daysRequested: numDays,
      recordsFound: history.length
    };
  }

  @Get(':userId/today-transactions')
  @ApiOperation({ summary: 'Get today\'s transactions for user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Today\'s transactions retrieved successfully' })
  async getTodayTransactions(@Param('userId') userId: string) {
    const transactions = await this.balanceService.getTodayTransactions(userId);
    return { 
      transactions, 
      userId,
      count: transactions.length,
      date: new Date().toDateString()
    };
  }

  @Get(':userId/stats')
  @ApiOperation({ summary: 'Get comprehensive user balance statistics' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  async getUserStats(@Param('userId') userId: string) {
    const stats = await this.balanceService.getUserBalanceStats(userId);
    return {
      userId,
      ...stats,
      timestamp: new Date().toISOString()
    };
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Manually trigger balance calculation' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Specific user ID (optional)' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Specific date in YYYY-MM-DD format (optional)' })
  @ApiResponse({ status: 200, description: 'Balance calculation triggered successfully' })
  async triggerBalanceCalculation(
    @Query('userId') userId?: string,
    @Query('date') date?: string
  ) {
    let targetDate: Date | undefined;
    
    if (date) {
      targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }
    }

    return this.balanceService.triggerBalanceCalculation(userId, targetDate);
  }

  @Post(':userId/recalculate')
  @ApiOperation({ summary: 'Recalculate balance for specific user and date' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Specific date in YYYY-MM-DD format (default: today)' })
  @ApiResponse({ status: 200, description: 'Balance recalculated successfully' })
  async recalculateUserBalance(
    @Param('userId') userId: string,
    @Query('date') date?: string
  ) {
    let targetDate = new Date();
    
    if (date) {
      targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }
    }

    const result = await this.balanceService.triggerBalanceCalculation(userId, targetDate);
    const newBalance = await this.balanceService.getCurrentBalance(userId);
    
    return {
      ...result,
      newBalance,
      recalculatedAt: new Date().toISOString()
    };
  }
}