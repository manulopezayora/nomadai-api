import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { TravelStyle } from '../../domain/enums/travel-style.enum';

export interface GenerateHotelsTripData {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
  travelStyle: TravelStyle;
  travelerCount: number;
  budget: number | null;
}

export class GenerateHotelsDto {
  @ApiProperty({
    description: 'Trip data from POST /trips/generate',
  })
  trip!: GenerateHotelsTripData;

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
  })
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];
}
