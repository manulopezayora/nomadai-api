import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDayPlanDto {
  @ApiPropertyOptional({
    example: 2,
    description: 'Day number within the trip',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  dayNumber?: number;

  @ApiPropertyOptional({
    example: '2026-09-16',
    description: 'Date (ISO 8601)',
  })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    example: 'Exploring Kyoto temples',
    description: 'Day title',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Visit Fushimi Inari and Kinkaku-ji',
    description: 'Additional notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
