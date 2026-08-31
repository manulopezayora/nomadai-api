import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecommendHotelsDto {
  @ApiProperty({
    example: 'Tokyo',
    description: 'City or location to search hotels',
  })
  @IsString()
  city!: string;

  @ApiProperty({
    example: '2026-09-15',
    description: 'Check-in date (YYYY-MM-DD)',
  })
  @IsString()
  checkIn!: string;

  @ApiProperty({
    example: '2026-09-25',
    description: 'Check-out date (YYYY-MM-DD)',
  })
  @IsString()
  checkOut!: string;

  @ApiPropertyOptional({
    example: 150,
    description: 'Maximum price per night',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPricePerNight?: number;

  @ApiPropertyOptional({
    example: 4,
    description: 'Minimum star rating',
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  minRating?: number;

  @ApiPropertyOptional({
    example: ['wifi', 'pool'],
    description: 'Desired amenities',
  })
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];
}
