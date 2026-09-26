import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { ActivityCategory } from '../../domain/enums/activity-category.enum';
import { TravelStyle } from '../../domain/enums/travel-style.enum';

export class SaveActivityDto {
  @ApiProperty({ example: 'Colosseum visit', description: 'Activity title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    example: 'Guided tour of the ancient Roman amphitheatre',
    description: 'Activity description',
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({
    example: 'Piazza del Colosseo',
    description: 'Location',
  })
  @IsString()
  @IsOptional()
  location?: string | null;

  @ApiPropertyOptional({ example: 41.8902, description: 'Latitude' })
  @IsNumber()
  @IsOptional()
  latitude?: number | null;

  @ApiPropertyOptional({ example: 12.4922, description: 'Longitude' })
  @IsNumber()
  @IsOptional()
  longitude?: number | null;

  @ApiPropertyOptional({ example: '10:00', description: 'Start time (HH:MM)' })
  @IsString()
  @IsOptional()
  startTime?: string | null;

  @ApiPropertyOptional({ example: '12:00', description: 'End time (HH:MM)' })
  @IsString()
  @IsOptional()
  endTime?: string | null;

  @ApiPropertyOptional({ example: 18, description: 'Cost in EUR' })
  @IsNumber()
  @IsOptional()
  cost?: number | null;

  @ApiPropertyOptional({ example: 'https://example.com/tickets' })
  @IsString()
  @IsOptional()
  bookingUrl?: string | null;

  @ApiPropertyOptional({
    example: ActivityCategory.SIGHTSEEING,
    description: 'Activity category',
    enum: ActivityCategory,
  })
  @IsEnum(ActivityCategory)
  @IsOptional()
  category?: ActivityCategory | null;

  @ApiPropertyOptional({ example: 1, description: 'Order within the day' })
  @IsInt()
  @Min(1)
  @IsOptional()
  order?: number;
}

export class SaveDayPlanDto {
  @ApiProperty({ example: 1, description: 'Day number (1-based)' })
  @IsInt()
  @Min(1)
  dayNumber!: number;

  @ApiProperty({ example: 'Ancient Rome', description: 'Day title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Walk through the Roman Forum' })
  @IsString()
  @IsOptional()
  notes?: string | null;

  @ApiPropertyOptional({
    type: () => [SaveActivityDto],
    description: 'Activities planned for this day',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveActivityDto)
  @IsOptional()
  activities?: SaveActivityDto[];
}

export class SaveItineraryDto {
  @ApiProperty({
    type: () => [SaveDayPlanDto],
    description: 'Day-by-day itinerary',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveDayPlanDto)
  days!: SaveDayPlanDto[];
}

export class SaveFlightDto {
  @ApiProperty({ example: 'Iberia', description: 'Airline name' })
  @IsString()
  @IsNotEmpty()
  airline!: string;

  @ApiPropertyOptional({ example: 'IB3437', description: 'Flight number' })
  @IsString()
  @IsOptional()
  flightNumber?: string | null;

  @ApiProperty({ example: 'MAD', description: 'Departure airport (IATA)' })
  @IsString()
  @IsNotEmpty()
  departure!: string;

  @ApiProperty({ example: 'FCO', description: 'Arrival airport (IATA)' })
  @IsString()
  @IsNotEmpty()
  arrival!: string;

  @ApiPropertyOptional({ example: '2026-10-01', description: 'Departure date' })
  @IsString()
  @IsOptional()
  departureDate?: string | null;

  @ApiProperty({ example: '08:30', description: 'Departure time (HH:MM)' })
  @IsString()
  @IsNotEmpty()
  departureTime!: string;

  @ApiProperty({ example: '11:45', description: 'Arrival time (HH:MM)' })
  @IsString()
  @IsNotEmpty()
  arrivalTime!: string;

  @ApiPropertyOptional({ example: 120, description: 'Price' })
  @IsNumber()
  @IsOptional()
  price?: number | null;

  @ApiPropertyOptional({ example: 'EUR', default: 'EUR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    example: 'economy',
    enum: ['economy', 'premium_economy', 'business', 'first'],
  })
  @IsString()
  @IsOptional()
  class?: string | null;

  @ApiPropertyOptional({ example: 0, description: 'Number of stops' })
  @IsInt()
  @Min(0)
  @IsOptional()
  stops?: number | null;

  @ApiPropertyOptional({ example: 195, description: 'Duration in minutes' })
  @IsInt()
  @Min(0)
  @IsOptional()
  durationMinutes?: number | null;

  @ApiPropertyOptional({ example: 'https://example.com/flights' })
  @IsString()
  @IsOptional()
  bookingUrl?: string | null;

  @ApiPropertyOptional({ example: 'Best value option' })
  @IsString()
  @IsOptional()
  notes?: string | null;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isRecommended?: boolean;
}

export class SaveHotelDto {
  @ApiProperty({ example: 'Hotel de Roma', description: 'Hotel name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Via del Corso 9, Rome', description: 'Location' })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiPropertyOptional({ example: 'Centro Storico' })
  @IsString()
  @IsOptional()
  neighborhood?: string | null;

  @ApiPropertyOptional({ example: 41.8992, description: 'Latitude' })
  @IsNumber()
  @IsOptional()
  latitude?: number | null;

  @ApiPropertyOptional({ example: 12.4853, description: 'Longitude' })
  @IsNumber()
  @IsOptional()
  longitude?: number | null;

  @ApiPropertyOptional({ example: 150, description: 'Price per night' })
  @IsNumber()
  @IsOptional()
  pricePerNight?: number | null;

  @ApiPropertyOptional({
    example: 180,
    description: 'Original price per night',
  })
  @IsNumber()
  @IsOptional()
  originalPricePerNight?: number | null;

  @ApiPropertyOptional({ example: 'EUR', default: 'EUR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 4, description: 'Star rating' })
  @IsNumber()
  @IsOptional()
  rating?: number | null;

  @ApiPropertyOptional({ example: 1204, description: 'Review count' })
  @IsInt()
  @Min(0)
  @IsOptional()
  reviewCount?: number | null;

  @ApiPropertyOptional({
    example: ['wifi', 'breakfast'],
    isArray: true,
    type: String,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @ApiPropertyOptional({ example: 'https://example.com/hotel.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/hotels' })
  @IsString()
  @IsOptional()
  bookingUrl?: string | null;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isRecommended?: boolean;
}

export class SaveGeneratedTripDto {
  @ApiProperty({ example: '10 Days in Japan', description: 'Trip title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Japan', description: 'Destination city or country' })
  @IsString()
  @IsNotEmpty()
  destination!: string;

  @ApiProperty({
    example: '2026-09-15',
    description: 'Start date (YYYY-MM-DD)',
  })
  @IsString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({
    example: '2026-09-25',
    description: 'End date (YYYY-MM-DD)',
  })
  @IsString()
  @IsNotEmpty()
  endDate!: string;

  @ApiPropertyOptional({ example: 5000, description: 'Budget in EUR' })
  @IsNumber()
  @IsOptional()
  budget?: number | null;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of travelers',
    default: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  travelerCount?: number;

  @ApiProperty({
    example: ['culture', 'food'],
    description: 'List of interests',
    isArray: true,
    type: String,
  })
  @IsArray()
  @IsString({ each: true })
  interests!: string[];

  @ApiPropertyOptional({
    example: TravelStyle.MID,
    description: 'Travel style',
    enum: TravelStyle,
  })
  @IsEnum(TravelStyle)
  @IsOptional()
  travelStyle?: TravelStyle;

  @ApiPropertyOptional({
    type: () => [SaveFlightDto],
    description: 'Flight recommendations',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveFlightDto)
  @IsOptional()
  flights?: SaveFlightDto[];

  @ApiPropertyOptional({
    type: () => [SaveHotelDto],
    description: 'Hotel recommendations',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveHotelDto)
  @IsOptional()
  hotels?: SaveHotelDto[];

  @ApiPropertyOptional({
    type: () => SaveItineraryDto,
    description: 'Day-by-day itinerary',
  })
  @ValidateNested()
  @Type(() => SaveItineraryDto)
  @IsOptional()
  itinerary?: SaveItineraryDto;
}
