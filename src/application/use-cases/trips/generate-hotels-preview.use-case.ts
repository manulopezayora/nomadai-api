import { Inject, Injectable, Logger } from '@nestjs/common';
import { GeminiPort } from '../../../domain/ports/services/gemini.port';
import { GenerateHotelsDto } from '../../dto/generate-hotels.dto';
import { GenerateHotelsPreviewResult } from '../../dto/generate-preview-response.dto';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { hotelRecommendationSchema } from '../../../shared/ai/hotel.schema';
import { HotelRecommendationMapper } from '../../../shared/ai/hotel-recommendation.mapper';

@Injectable()
export class GenerateHotelsPreviewUseCase {
  private readonly logger = new Logger(GenerateHotelsPreviewUseCase.name);

  constructor(
    @Inject(GeminiPort)
    private readonly gemini: GeminiPort,
  ) {}

  async execute(dto: GenerateHotelsDto): Promise<GenerateHotelsPreviewResult> {
    const { trip, checkIn, checkOut, maxPricePerNight, minRating, amenities } =
      dto;

    if (!checkIn || !checkOut) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Check-in and check-out dates are required',
      );
    }

    const prompt = this.buildPrompt(trip, {
      checkIn,
      checkOut,
      maxPricePerNight,
      minRating,
      amenities,
    });

    this.logger.debug(`Generating hotel preview for ${trip.destination}`);

    const response = await this.gemini.generateStructuredOutput<unknown>(
      prompt,
      hotelRecommendationSchema,
    );

    const hotels = HotelRecommendationMapper.toCreateDataArray(response);

    return { hotels };
  }

  private buildPrompt(
    trip: {
      destination: string;
      travelerCount: number;
      budget: number | null;
      travelStyle: string;
    },
    params: {
      checkIn: string;
      checkOut: string;
      maxPricePerNight?: number;
      minRating?: number;
      amenities?: string[];
    },
  ): string {
    return `Recommend hotel options in ${trip.destination} for a trip.

Trip details:
- Destination: ${trip.destination}
- Travelers: ${trip.travelerCount}
- Travel style: ${trip.travelStyle}
- Total budget: ${trip.budget ? `${trip.budget} EUR` : 'not specified'}
- Check-in: ${params.checkIn}
- Check-out: ${params.checkOut}
${params.maxPricePerNight ? `- Max price per night: ${params.maxPricePerNight} EUR` : ''}
${params.minRating ? `- Minimum star rating: ${params.minRating}` : ''}
${params.amenities?.length ? `- Desired amenities: ${params.amenities.join(', ')}` : ''}

For each hotel, provide:
- name
- neighborhood (district or area name)
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
