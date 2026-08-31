import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecommendFlightsDto {
  @ApiProperty({
    example: 'MAD',
    description: 'Origin airport IATA code',
  })
  @IsString()
  origin!: string;

  @ApiProperty({
    example: 'NRT',
    description: 'Destination airport IATA code',
  })
  @IsString()
  destination!: string;

  @ApiProperty({
    example: '2026-09-15',
    description: 'Departure date (YYYY-MM-DD)',
  })
  @IsString()
  departureDate!: string;

  @ApiPropertyOptional({
    example: '2026-09-25',
    description: 'Return date (YYYY-MM-DD) for round trips',
  })
  @IsString()
  @IsOptional()
  returnDate?: string;

  @ApiPropertyOptional({
    example: 2,
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
