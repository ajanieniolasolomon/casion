import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GameService } from './game.service';
import { PlayDiceDto } from './dto/play-dice.dto';

@ApiTags('game')
@Controller('game')
export class GameController {
  constructor(private gameService: GameService) {}

  @Post('dice/play')
  @ApiOperation({ summary: 'Play dice game' })
  async playDice(@Body() playDiceDto: PlayDiceDto) {
    return this.gameService.playDice(playDiceDto);
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Get user game history' })
  async getGameHistory(@Param('userId') userId: string) {
    return this.gameService.getGameHistory(userId);
  }
}