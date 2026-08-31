import { Inject, Injectable, Logger } from '@nestjs/common';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { GeminiPort } from '../../../domain/ports/services/gemini.port';
import { GenerateTripDto } from '../../dto/generate-trip.dto';
import { Trip } from '../../../domain/entities/trip.entity';
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
    @Inject(TripRepositoryPort)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(GeminiPort)
    private readonly gemini: GeminiPort,
  ) {}

  async execute(dto: GenerateTripDto, userId: string): Promise<Trip> {
    if (!dto.prompt || dto.prompt.trim().length < 10) {
      throw new ValidationException(
        'Prompt must be at least 10 characters long',
      );
    }

    const prompt = this.buildPrompt(dto.prompt);
    this.logger.debug(`Generating trip from prompt: "${dto.prompt}"`);

    const response =
      await this.gemini.generateStructuredOutput<GeminiTripPromptResponse>(
        prompt,
        tripPromptSchema,
      );

    const mapped = TripPromptMapper.toCreateData(response);

    if (!mapped.title || !mapped.destination) {
      throw new ValidationException(
        'Could not extract destination from prompt. Please be more specific.',
      );
    }

    if (mapped.endDate <= mapped.startDate) {
      throw new ValidationException(
        'Could not determine valid dates from prompt. Please specify dates.',
      );
    }

    return this.tripRepository.create({
      userId,
      title: mapped.title,
      destination: mapped.destination,
      startDate: mapped.startDate,
      endDate: mapped.endDate,
      budget: mapped.budget ?? undefined,
      travelerCount: mapped.travelerCount,
      preferences: {
        interests: mapped.interests,
        travelStyle: mapped.travelStyle,
      },
    });
  }

  private buildPrompt(userPrompt: string): string {
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
