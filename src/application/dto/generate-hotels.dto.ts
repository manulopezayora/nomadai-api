import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { GeneratedTripDataDto } from './generated-trip-data.dto';

export class GenerateHotelsDto {
  @ApiProperty({
    description: 'Trip data from POST /trips/generate',
    type: GeneratedTripDataDto,
  })
  @ValidateNested()
  @Type(() => GeneratedTripDataDto)
  trip!: GeneratedTripDataDto;

  @ApiProperty({
    example: '2026-10-01',
    description: 'Check-in date (YYYY-MM-DD)',
  })
  @IsString()
  checkIn!: string;

  @ApiProperty({
    example: '2026-10-06',
    description: 'Check-out date (YYYY-MM-DD)',
  })
  @IsString()
  checkOut!: string;

  @ApiPropertyOptional({
    example: 150,
    description: 'Maximum price per night in EUR',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPricePerNight?: number;

  @ApiPropertyOptional({
    example: 4,
    description: 'Minimum star rating (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  minRating?: number;

  @ApiPropertyOptional({
    example: ['wifi', 'breakfast'],
    description: 'Desired amenities',
    isArray: true,
    type: String,
  })
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];
}
