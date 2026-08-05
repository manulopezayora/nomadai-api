import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsIn,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTripDto {
  @ApiPropertyOptional({ example: 'Trip to Japan', description: 'Trip title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Osaka',
    description: 'Destination city or country',
  })
  @IsString()
  @IsOptional()
  destination?: string;

  @ApiPropertyOptional({
    example: '2026-09-15',
    description: 'Start date (ISO 8601)',
  })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-09-25',
    description: 'End date (ISO 8601)',
  })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 2500, description: 'Budget in EUR' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({ example: 3, description: 'Number of travelers' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  travelerCount?: number;

  @ApiPropertyOptional({
    example: ['culture', 'food', 'shopping'],
    description: 'List of interests',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];

  @ApiPropertyOptional({
    example: 'luxury',
    description: 'Travel style',
    enum: ['budget', 'mid', 'luxury'],
  })
  @IsIn(['budget', 'mid', 'luxury'])
  @IsOptional()
  travelStyle?: string;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Trip status',
    enum: ['planning', 'active', 'completed'],
  })
  @IsIn(['planning', 'active', 'completed'])
  @IsOptional()
  status?: string;
}
