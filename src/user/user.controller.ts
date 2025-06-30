import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { BalanceService } from '../balance/balance.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService, private balanceService:BalanceService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login or create user with email' })
  async loginUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.findOrCreateUser(createUserDto);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get user balance' })
  async getUserBalance(@Param('id') id: string) {
    const balance = await this.balanceService.getCurrentBalance(id);
    return { balance };
  }
}
