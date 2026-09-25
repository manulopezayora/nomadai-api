import { Inject, Injectable, Logger } from '@nestjs/common';
import { GeminiPort } from '../../../domain/ports/services/gemini.port';
import { GenerateFlightsDto } from '../../dto/generate-flights.dto';
import { GenerateFlightsPreviewResult } from '../../dto/generate-preview-response.dto';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { flightRecommendationSchema } from '../../../shared/ai/flight.schema';
import { FlightRecommendationMapper } from '../../../shared/ai/flight-recommendation.mapper';

@Injectable()
export class GenerateFlightsPreviewUseCase {
  private readonly logger = new Logger(GenerateFlightsPreviewUseCase.name);

  constructor(
    @Inject(GeminiPort)
    private readonly gemini: GeminiPort,
  ) {}

  async execute(
    dto: GenerateFlightsDto,
  ): Promise<GenerateFlightsPreviewResult> {
    const {
      trip,
      departureHint,
      departureDate,
      returnDate,
      passengers,
      travelClass,
    } = dto;

    if (!departureHint) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Departure hint (city or airport) is required',
      );
    }

    if (!departureDate) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Departure date is required',
      );
    }

    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const prompt = this.buildPrompt(
      trip,
      {
        departureHint,
        departureDate,
        returnDate,
        passengers,
        travelClass,
      },
      days,
    );

    this.logger.debug(
      `Generating flight preview: ${departureHint} → ${trip.destination}`,
    );

    const response = await this.gemini.generateStructuredOutput<unknown>(
      prompt,
      flightRecommendationSchema,
    );

    const flights = FlightRecommendationMapper.toCreateDataArray(response);

    return { flights };
  }

  private buildPrompt(
    trip: {
      destination: string;
      travelerCount: number;
      travelStyle: string;
      startDate: string;
      endDate: string;
    },
    params: {
      departureHint: string;
      departureDate: string;
      returnDate?: string;
      passengers?: number;
      travelClass?: string;
    },
    days: number,
  ): string {
    return `Recommend ${params.passengers ?? trip.travelerCount} flight option(s) from ${params.departureHint} to ${trip.destination}.

Trip details:
- Destination: ${trip.destination}
- Duration: ${days} days
- Travelers: ${trip.travelerCount}
- Travel style: ${trip.travelStyle}
- Departure date: ${params.departureDate}
${params.returnDate ? `- Return date: ${params.returnDate}` : ''}
${params.travelClass ? `- Preferred class: ${params.travelClass}` : ''}

The user's departure city is "${params.departureHint}". Infer the most likely IATA airport code (e.g. MAD for Madrid, BCN for Barcelona, JFK for New York).

For each flight, provide:
- airline (name)
- origin (IATA code)
- destination (IATA code — infer the main airport for ${trip.destination})
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
