import { Inject, Injectable, Logger } from '@nestjs/common';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { FlightRecommendationRepositoryPort } from '../../../domain/ports/repositories/flight-recommendation.repository.port';
import { GeminiPort } from '../../../domain/ports/services/gemini.port';
import { RecommendFlightsDto } from '../../dto/recommend-flights.dto';
import { FlightRecommendation } from '../../../domain/entities/flight-recommendation.entity';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { flightRecommendationSchema } from '../../../shared/ai/flight.schema';
import { FlightRecommendationMapper } from '../../../shared/ai/flight-recommendation.mapper';

@Injectable()
export class RecommendFlightsUseCase {
  private readonly logger = new Logger(RecommendFlightsUseCase.name);

  constructor(
    @Inject(TripRepositoryPort)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(FlightRecommendationRepositoryPort)
    private readonly flightRepository: FlightRecommendationRepositoryPort,
    @Inject(GeminiPort)
    private readonly gemini: GeminiPort,
  ) {}

  async execute(
    tripId: string,
    dto: RecommendFlightsDto,
    userId: string,
  ): Promise<FlightRecommendation[]> {
    const trip = await this.tripRepository.findById(tripId);

    if (!trip) {
      throw new NotFoundException('Trip', tripId);
    }

    if (trip.userId !== userId) {
      throw new ForbiddenException(
        'TRIP_FORBIDDEN',
        'You can only generate recommendations for your own trips',
      );
    }

    if (!dto.origin || !dto.destination) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Origin and destination are required',
      );
    }

    if (!dto.departureDate) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Departure date is required',
      );
    }

    const days = Math.ceil(
      (trip.endDate.getTime() - trip.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const prompt = this.buildPrompt(trip, dto, days);
    this.logger.debug(`Generating flight recommendations for trip ${tripId}`);

    const response = await this.gemini.generateStructuredOutput<unknown>(
      prompt,
      flightRecommendationSchema,
    );

    const createData = FlightRecommendationMapper.toCreateDataArray(response);

    return this.flightRepository.createMany(tripId, createData);
  }

  private buildPrompt(
    trip: {
      destination: string;
      travelerCount: number;
      preferences: { interests: string[]; travelStyle: string };
    },
    dto: RecommendFlightsDto,
    days: number,
  ): string {
    return `Recommend ${dto.passengers ?? trip.travelerCount} flight option(s) from ${dto.origin} to ${dto.destination}.

Trip details:
- Destination: ${trip.destination}
- Duration: ${days} days
- Travelers: ${trip.travelerCount}
- Travel style: ${trip.preferences.travelStyle}
- Departure date: ${dto.departureDate}
${dto.returnDate ? `- Return date: ${dto.returnDate}` : ''}
${dto.travelClass ? `- Preferred class: ${dto.travelClass}` : ''}

For each flight, provide:
- airline (name)
- origin (IATA code)
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
}
