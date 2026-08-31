import { Inject, Injectable, Logger } from '@nestjs/common';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { HotelRecommendationRepositoryPort } from '../../../domain/ports/repositories/hotel-recommendation.repository.port';
import { GeminiPort } from '../../../domain/ports/services/gemini.port';
import { RecommendHotelsDto } from '../../dto/recommend-hotels.dto';
import { HotelRecommendation } from '../../../domain/entities/hotel-recommendation.entity';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { hotelRecommendationSchema } from '../../../shared/ai/hotel.schema';
import { HotelRecommendationMapper } from '../../../shared/ai/hotel-recommendation.mapper';

@Injectable()
export class RecommendHotelsUseCase {
  private readonly logger = new Logger(RecommendHotelsUseCase.name);

  constructor(
    @Inject(TripRepositoryPort)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(HotelRecommendationRepositoryPort)
    private readonly hotelRepository: HotelRecommendationRepositoryPort,
    @Inject(GeminiPort)
    private readonly gemini: GeminiPort,
  ) {}

  async execute(
    tripId: string,
    dto: RecommendHotelsDto,
    userId: string,
  ): Promise<HotelRecommendation[]> {
    const trip = await this.tripRepository.findById(tripId);

    if (!trip) {
      throw new NotFoundException('Trip', tripId);
    }

    if (trip.userId !== userId) {
      throw new ForbiddenException(
        'You can only generate recommendations for your own trips',
      );
    }

    if (!dto.city) {
      throw new ValidationException('City is required');
    }

    if (!dto.checkIn || !dto.checkOut) {
      throw new ValidationException(
        'Check-in and check-out dates are required',
      );
    }

    const prompt = this.buildPrompt(trip, dto);
    this.logger.debug(`Generating hotel recommendations for trip ${tripId}`);

    const response = await this.gemini.generateStructuredOutput<unknown>(
      prompt,
      hotelRecommendationSchema,
    );

    const createData = HotelRecommendationMapper.toCreateDataArray(response);

    return this.hotelRepository.createMany(tripId, createData);
  }

  private buildPrompt(
    trip: {
      destination: string;
      travelerCount: number;
      budget: number | null;
      preferences: { interests: string[]; travelStyle: string };
    },
    dto: RecommendHotelsDto,
  ): string {
    return `Recommend hotel options in ${dto.city} for a trip.

Trip details:
- Destination: ${trip.destination}
- Travelers: ${trip.travelerCount}
- Travel style: ${trip.preferences.travelStyle}
- Total budget: ${trip.budget ? `${trip.budget} EUR` : 'not specified'}
- Check-in: ${dto.checkIn}
- Check-out: ${dto.checkOut}
${dto.maxPricePerNight ? `- Max price per night: ${dto.maxPricePerNight} EUR` : ''}
${dto.minRating ? `- Minimum star rating: ${dto.minRating}` : ''}
${dto.amenities?.length ? `- Desired amenities: ${dto.amenities.join(', ')}` : ''}

For each hotel, provide:
- name
- neighborhood (district or area name, e.g. "Shinjuku")
- city
- country
- latitude
- longitude
- pricePerNight (discounted or current price in EUR)
- originalPricePerNight (original price before discount, if applicable; otherwise same as pricePerNight)
- currency (EUR)
- starRating (1-5)
- reviewCount (estimated number of reviews)
- amenities (list)
- imageUrl (a real photo URL from the hotel's website or Google Maps)
- bookingUrl (a generic search URL like https://www.booking.com)

Return 3-4 realistic options with varying price ranges.`;
  }
}
