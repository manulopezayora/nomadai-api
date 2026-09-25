import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { TravelStyle } from '../../domain/enums/travel-style.enum';

export interface GenerateFlightsTripData {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
  travelStyle: TravelStyle;
  travelerCount: number;
  budget: number | null;
}

export class GenerateFlightsDto {
  @ApiProperty({
    description: 'Trip data from POST /trips/generate',
  })
  trip!: GenerateFlightsTripData;

  @ApiProperty({
    example: 'Madrid',
    description:
      'City or airport name for departure. Gemini will infer the IATA code.',
  })
  @IsString()
  departureHint!: string;

  @ApiProperty({
    example: '2026-10-01',
    description: 'Departure date (YYYY-MM-DD)',
  })
  @IsString()
  departureDate!: string;

  @ApiPropertyOptional({
    example: '2026-10-06',
    description: 'Return date (YYYY-MM-DD) for round trips',
  })
  @IsString()
  @IsOptional()
  returnDate?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Number of passengers',
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  passengers?: number;

  @ApiPropertyOptional({
    example: 'economy',
    description: 'Preferred cabin class',
    enum: ['economy', 'premium_economy', 'business', 'first'],
  })
  @IsString()
  @IsOptional()
  travelClass?: string;
}
