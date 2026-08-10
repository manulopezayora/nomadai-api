import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDayPlanDto {
  @ApiProperty({ example: 1, description: 'Day number within the trip' })
  @IsInt()
  @Min(1)
  dayNumber!: number;

  @ApiProperty({ example: '2026-09-15', description: 'Date (ISO 8601)' })
  @IsString()
  date!: string;

  @ApiPropertyOptional({
    example: 'Arrival in Tokyo',
    description: 'Day title',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Check in at hotel, explore Shibuya',
    description: 'Additional notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
