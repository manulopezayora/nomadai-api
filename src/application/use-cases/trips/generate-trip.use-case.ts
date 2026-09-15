import { Inject, Injectable, Logger } from '@nestjs/common';
import { GeminiPort } from '../../../domain/ports/services/gemini.port';
import { GenerateTripDto } from '../../dto/generate-trip.dto';
import { GenerateTripResult } from '../../dto/generate-trip-response.dto';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { tripPromptSchema } from '../../../shared/ai/trip-prompt.schema';
import {
  TripPromptMapper,
  GeminiTripPromptResponse,
} from '../../../shared/ai/trip-prompt.mapper';
import { flightRecommendationSchema } from '../../../shared/ai/flight.schema';
import { FlightRecommendationMapper } from '../../../shared/ai/flight-recommendation.mapper';
import { hotelRecommendationSchema } from '../../../shared/ai/hotel.schema';
import { HotelRecommendationMapper } from '../../../shared/ai/hotel-recommendation.mapper';
import { itinerarySchema } from '../../../shared/ai/itinerary.schema';
import { ItineraryMapper } from '../../../shared/ai/itinerary.mapper';
import { TravelStyle } from '../../../domain/enums/travel-style.enum';

@Injectable()
export class GenerateTripUseCase {
  private readonly logger = new Logger(GenerateTripUseCase.name);

  constructor(
    @Inject(GeminiPort)
    private readonly gemini: GeminiPort,
  ) {}

  async execute(dto: GenerateTripDto): Promise<GenerateTripResult> {
    if (!dto.prompt || dto.prompt.trim().length < 10) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Prompt must be at least 10 characters long',
      );
    }

    this.logger.debug(`Generating trip from prompt: "${dto.prompt}"`);

    const tripPrompt = this.buildTripPrompt(dto.prompt);

    const tripResponse =
      await this.gemini.generateStructuredOutput<GeminiTripPromptResponse>(
        tripPrompt,
        tripPromptSchema,
      );

    const mapped = TripPromptMapper.toCreateData(tripResponse);

    if (!mapped.title || !mapped.destination) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Could not extract destination from prompt. Please be more specific.',
      );
    }

    if (mapped.endDate <= mapped.startDate) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Could not determine valid dates from prompt. Please specify dates.',
      );
    }

    const startDateStr = mapped.startDate.toISOString().split('T')[0];
    const endDateStr = mapped.endDate.toISOString().split('T')[0];
    const days = Math.ceil(
      (mapped.endDate.getTime() - mapped.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    this.logger.debug(
      `Generating flights, hotels and itinerary in parallel for ${days} days`,
    );

    const [flightsResponse, hotelsResponse, itineraryResponse] =
      await Promise.all([
        this.gemini.generateStructuredOutput<unknown>(
          this.buildFlightsPrompt(mapped, days),
          flightRecommendationSchema,
        ),
        this.gemini.generateStructuredOutput<unknown>(
          this.buildHotelsPrompt(mapped, days),
          hotelRecommendationSchema,
        ),
        this.gemini.generateStructuredOutput<unknown>(
          this.buildItineraryPrompt(mapped, days),
          itinerarySchema,
        ),
      ]);

    const flights =
      FlightRecommendationMapper.toCreateDataArray(flightsResponse);
    const hotels = HotelRecommendationMapper.toCreateDataArray(hotelsResponse);
    const itineraryDays = ItineraryMapper.toDayPlans(itineraryResponse);
    const itineraryActivities = ItineraryMapper.toActivities(itineraryResponse);

    const daysWithActivities = itineraryDays.map((day) => ({
      ...day,
      notes: day.notes ?? null,
      activities: itineraryActivities.filter(
        (a) => a.dayNumber === day.dayNumber,
      ),
    }));

    return {
      trip: {
        title: mapped.title,
        destination: mapped.destination,
        startDate: startDateStr,
        endDate: endDateStr,
        budget: mapped.budget,
        travelerCount: mapped.travelerCount,
        interests: mapped.interests,
        travelStyle: mapped.travelStyle,
      },
      flights,
      hotels,
      itinerary: { days: daysWithActivities },
    };
  }

  private buildTripPrompt(userPrompt: string): string {
    return `Parse the following travel description into structured trip data.

User description: "${userPrompt}"

Extract and infer:
- title: A short catchy title for the trip
- destination: The main destination city or country
- startDate: If dates are mentioned, use them. Otherwise, suggest a date starting 2 weeks from now (YYYY-MM-DD)
- endDate: Calculate based on duration mentioned. If "10 days", end date = start + 10 days
- travelerCount: If mentioned (e.g. "for 2"), use that. Default to 1
- interests: Extract interests from the description (e.g. culture, food, adventure, relaxation, shopping)
- travelStyle: Infer from context. "budget" for cheap/backpacking, "luxury" for premium/first-class, "mid" for default
- budget: Only if explicitly mentioned (e.g. "budget of 2000 EUR"). Otherwise null

Current date: ${new Date().toISOString().split('T')[0]}

Return a valid JSON object matching the schema.`;
  }

  private buildFlightsPrompt(
    trip: {
      destination: string;
      travelerCount: number;
      travelStyle: TravelStyle;
      startDate: string;
      endDate: string;
    },
    days: number,
  ): string {
    return `Recommend ${trip.travelerCount} flight option(s) to ${trip.destination}.

Trip details:
- Destination: ${trip.destination}
- Duration: ${days} days
- Travelers: ${trip.travelerCount}
- Travel style: ${trip.travelStyle}
- Departure date: ${trip.startDate}
- Return date: ${trip.endDate}

For each flight, provide:
- airline (name)
- origin (IATA code — infer a major airport near the user's region, e.g. MAD for Europe)
- destination (IATA code)
- departureDate (YYYY-MM-DD)
- departureTime (HH:MM UTC)
- arrivalTime (HH:MM local)
- price (estimated in EUR)
- currency (EUR)
- class (economy/premium_economy/business/first)
- stops (number)
- durationMinutes (total)
- bookingUrl (a generic search URL like https://www.google.com/flights)

Return 2-3 realistic options with varying price ranges.`;
  }

  private buildHotelsPrompt(
    trip: {
      destination: string;
      travelerCount: number;
      budget: number | null;
      travelStyle: TravelStyle;
      startDate: string;
      endDate: string;
    },
    days: number,
  ): string {
    return `Recommend hotel options in ${trip.destination} for a trip.

Trip details:
- Destination: ${trip.destination}
- Duration: ${days} days
- Travelers: ${trip.travelerCount}
- Travel style: ${trip.travelStyle}
- Total budget: ${trip.budget ? `${trip.budget} EUR` : 'not specified'}
- Check-in: ${trip.startDate}
- Check-out: ${trip.endDate}

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

  private buildItineraryPrompt(
    trip: {
      destination: string;
      startDate: string;
      endDate: string;
      travelerCount: number;
      budget: number | null;
      interests: string[];
      travelStyle: TravelStyle;
    },
    days: number,
  ): string {
    return `Create a detailed ${days}-day itinerary for a trip to ${trip.destination}.

Trip details:
- Destination: ${trip.destination}
- Start date: ${trip.startDate}
- End date: ${trip.endDate}
- Duration: ${days} days
- Travelers: ${trip.travelerCount}
- Budget: ${trip.budget ? `${trip.budget} EUR total` : 'not specified'}
- Travel style: ${trip.travelStyle}
- Interests: ${trip.interests.join(', ')}

For each day, provide:
- dayNumber (1-based)
- title (short catchy title)
- summary (brief overview of the day)

For each activity within a day, provide:
- title
- description
- category (one of: sightseeing, food, culture, adventure, relaxation, shopping, nightlife, transport, stay, flight, other)
- startTime (HH:MM)
- endTime (HH:MM)
- locationName
- latitude
- longitude
- costEstimate (in EUR)
- tips (helpful travel tips)

Include a mix of activities that match the traveler's interests and travel style.
Include realistic coordinates for locations in ${trip.destination}.
Spread activities throughout each day with reasonable time blocks.`;
  }
}
