import {
  Body,
  Controller,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RecommendFlightsUseCase } from '../../application/use-cases/recommendations/recommend-flights.use-case';
import { RecommendHotelsUseCase } from '../../application/use-cases/recommendations/recommend-hotels.use-case';
import { RecommendItineraryUseCase } from '../../application/use-cases/recommendations/recommend-itinerary.use-case';
import { RecommendFlightsDto } from '../../application/dto/recommend-flights.dto';
import { RecommendHotelsDto } from '../../application/dto/recommend-hotels.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { UserPayload } from '../../shared/types/user-payload';

@ApiTags('Recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips/:tripId/recommend')
export class RecommendationsController {
  constructor(
    @Inject(RecommendFlightsUseCase)
    private readonly recommendFlightsUseCase: RecommendFlightsUseCase,
    @Inject(RecommendHotelsUseCase)
    private readonly recommendHotelsUseCase: RecommendHotelsUseCase,
    @Inject(RecommendItineraryUseCase)
    private readonly recommendItineraryUseCase: RecommendItineraryUseCase,
  ) {}

  @Post('flights')
  @ApiOperation({
    summary: 'Generate flight recommendations for a trip using AI',
  })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['origin', 'destination', 'departureDate'],
      properties: {
        origin: {
          type: 'string',
          example: 'MAD',
          description: 'Origin airport IATA code',
        },
        destination: {
          type: 'string',
          example: 'NRT',
          description: 'Destination airport IATA code',
        },
        departureDate: {
          type: 'string',
          example: '2026-09-15',
          description: 'Departure date (YYYY-MM-DD)',
        },
        returnDate: {
          type: 'string',
          example: '2026-09-25',
          description: 'Return date for round trips (YYYY-MM-DD)',
        },
        passengers: {
          type: 'number',
          example: 2,
          description: 'Number of passengers',
        },
        travelClass: {
          type: 'string',
          enum: ['economy', 'premium_economy', 'business', 'first'],
          description: 'Preferred cabin class',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Flight recommendations generated and saved',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  @ApiResponse({ status: 500, description: 'AI service error' })
  async recommendFlights(
    @Param('tripId') tripId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: RecommendFlightsDto,
  ) {
    return this.recommendFlightsUseCase.execute(tripId, dto, user.userId);
  }

  @Post('hotels')
  @ApiOperation({
    summary: 'Generate hotel recommendations for a trip using AI',
  })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['city', 'checkIn', 'checkOut'],
      properties: {
        city: {
          type: 'string',
          example: 'Tokyo',
          description: 'City to search hotels',
        },
        checkIn: {
          type: 'string',
          example: '2026-09-15',
          description: 'Check-in date (YYYY-MM-DD)',
        },
        checkOut: {
          type: 'string',
          example: '2026-09-25',
          description: 'Check-out date (YYYY-MM-DD)',
        },
        maxPricePerNight: {
          type: 'number',
          example: 150,
          description: 'Maximum price per night in EUR',
        },
        minRating: {
          type: 'number',
          example: 4,
          description: 'Minimum star rating (1-5)',
        },
        amenities: {
          type: 'array',
          items: { type: 'string' },
          example: ['wifi', 'pool'],
          description: 'Desired amenities',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Hotel recommendations generated and saved',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  @ApiResponse({ status: 500, description: 'AI service error' })
  async recommendHotels(
    @Param('tripId') tripId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: RecommendHotelsDto,
  ) {
    return this.recommendHotelsUseCase.execute(tripId, dto, user.userId);
  }

  @Post('itinerary')
  @ApiOperation({
    summary: 'Generate a full day-by-day itinerary for a trip using AI',
  })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({
    status: 201,
    description:
      'Itinerary generated — creates/updates day plans and activities',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  @ApiResponse({ status: 500, description: 'AI service error' })
  async recommendItinerary(
    @Param('tripId') tripId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.recommendItineraryUseCase.execute(tripId, user.userId);
  }
}
