import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { TravelStyle } from '../../domain/enums/travel-style.enum';

export class GeneratedTripDataDto {
  @ApiProperty({ example: '5 Days in Rome', description: 'Trip title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Rome', description: 'Destination city or country' })
  @IsString()
  @IsNotEmpty()
  destination!: string;

  @ApiProperty({
    example: '2026-10-01',
    description: 'Start date (YYYY-MM-DD)',
  })
  @IsString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ example: '2026-10-06', description: 'End date (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty()
  endDate!: string;

  @ApiProperty({
    example: ['culture', 'food'],
    description: 'List of interests',
    isArray: true,
    type: String,
  })
  @IsArray()
  @IsString({ each: true })
  interests!: string[];

  @ApiProperty({
    example: TravelStyle.MID,
    description: 'Travel style',
    enum: TravelStyle,
  })
  @IsEnum(TravelStyle)
  travelStyle!: TravelStyle;

  @ApiProperty({ example: 1, description: 'Number of travelers', minimum: 1 })
  @IsInt()
  @Min(1)
  travelerCount!: number;

  @ApiProperty({
    example: null,
    description: 'Budget in EUR, null if not specified',
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  budget!: number | null;
}
