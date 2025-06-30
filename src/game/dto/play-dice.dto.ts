import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class PlayDiceDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(6)
  prediction: number;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  betAmount: number;

  @ApiProperty()
  userId: string;
}
