import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TravelStyle } from '../../domain/enums/travel-style.enum';

export class SaveFlightDto {
  airline!: string;
  flightNumber?: string | null;
  departure!: string;
  arrival!: string;
  departureDate?: string | null;
  departureTime!: string;
  arrivalTime!: string;
  price?: number | null;
  currency?: string;
  class?: string | null;
  stops?: number | null;
  durationMinutes?: number | null;
  bookingUrl?: string | null;
  notes?: string | null;
  isRecommended?: boolean;
}

export class SaveHotelDto {
  name!: string;
  location!: string;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pricePerNight?: number | null;
  originalPricePerNight?: number | null;
  currency?: string;
  rating?: number | null;
  reviewCount?: number | null;
  amenities?: string[];
  imageUrl?: string | null;
  bookingUrl?: string | null;
  isRecommended?: boolean;
}

export class SaveActivityDto {
  title!: string;
  description?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  cost?: number | null;
  bookingUrl?: string | null;
  category?: string | null;
  order?: number;
}

export class SaveDayPlanDto {
  dayNumber!: number;
  title!: string;
  notes?: string | null;
  activities?: SaveActivityDto[];
}

export class SaveItineraryDto {
  days!: SaveDayPlanDto[];
}

export class SaveGeneratedTripDto {
  @ApiProperty({ example: '10 Days in Japan', description: 'Trip title' })
  title!: string;

  @ApiProperty({ example: 'Japan', description: 'Destination city or country' })
  destination!: string;

  @ApiProperty({
    example: '2026-09-15',
    description: 'Start date (YYYY-MM-DD)',
  })
  startDate!: string;

  @ApiProperty({ example: '2026-09-25', description: 'End date (YYYY-MM-DD)' })
  endDate!: string;

  @ApiPropertyOptional({ example: 5000, description: 'Budget in EUR' })
  budget?: number | null;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of travelers',
    default: 1,
  })
  travelerCount?: number;

  @ApiProperty({
    example: ['culture', 'food'],
    description: 'List of interests',
  })
  interests!: string[];

  @ApiPropertyOptional({
    example: 'mid',
    description: 'Travel style',
    enum: TravelStyle,
  })
  travelStyle?: TravelStyle;

  @ApiPropertyOptional({
    type: () => [SaveFlightDto],
    description: 'Flight recommendations',
  })
  flights?: SaveFlightDto[];

  @ApiPropertyOptional({
    type: () => [SaveHotelDto],
    description: 'Hotel recommendations',
  })
  hotels?: SaveHotelDto[];

  @ApiPropertyOptional({
    type: () => SaveItineraryDto,
    description: 'Day-by-day itinerary',
  })
  itinerary?: SaveItineraryDto;
}
