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
}
