import { Inject, Injectable, Logger } from '@nestjs/common';
import { GeminiPort } from '../../../domain/ports/services/gemini.port';
import { GenerateItineraryDto } from '../../dto/generate-itinerary.dto';
import { GenerateItineraryPreviewResult } from '../../dto/generate-preview-response.dto';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { itinerarySchema } from '../../../shared/ai/itinerary.schema';
import {
  ItineraryMapper,
  ItineraryResponse,
} from '../../../shared/ai/itinerary.mapper';

@Injectable()
export class GenerateItineraryPreviewUseCase {
  private readonly logger = new Logger(GenerateItineraryPreviewUseCase.name);

  constructor(
    @Inject(GeminiPort)
    private readonly gemini: GeminiPort,
  ) {}

  async execute(
    dto: GenerateItineraryDto,
  ): Promise<GenerateItineraryPreviewResult> {
    const { trip } = dto;

    if (!trip.destination) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Destination is required',
      );
    }

    if (!trip.startDate || !trip.endDate) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Start date and end date are required',
      );
    }

    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (days <= 0) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'End date must be after start date',
      );
    }

    const prompt = this.buildPrompt(trip, days);
    this.logger.debug(`Generating itinerary preview for ${trip.destination}`);

    const response =
      await this.gemini.generateStructuredOutput<ItineraryResponse>(
        prompt,
        itinerarySchema,
      );

    const mappedDayPlans = ItineraryMapper.toDayPlans(response);
    const mappedActivities = ItineraryMapper.toActivities(response);

    const daysWithActivities = mappedDayPlans.map((day) => ({
      ...day,
      notes: day.notes ?? null,
      activities: mappedActivities.filter((a) => a.dayNumber === day.dayNumber),
    }));

    return { days: daysWithActivities };
  }

  private buildPrompt(
    trip: {
      destination: string;
      startDate: string;
      endDate: string;
      interests: string[];
      travelStyle: string;
      travelerCount: number;
      budget: number | null;
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
