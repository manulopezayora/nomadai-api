import { Inject, Injectable, Logger } from '@nestjs/common';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { DayPlanRepositoryPort } from '../../../domain/ports/repositories/day-plan.repository.port';
import { ActivityRepositoryPort } from '../../../domain/ports/repositories/activity.repository.port';
import { GeminiPort } from '../../../domain/ports/services/gemini.port';
import { DayPlan } from '../../../domain/entities/day-plan.entity';
import { Activity } from '../../../domain/entities/activity.entity';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { itinerarySchema } from '../../../shared/ai/itinerary.schema';
import {
  ItineraryMapper,
  ItineraryResponse,
} from '../../../shared/ai/itinerary.mapper';

export interface ItineraryResult {
  dayPlans: DayPlan[];
  activities: Activity[];
}

@Injectable()
export class RecommendItineraryUseCase {
  private readonly logger = new Logger(RecommendItineraryUseCase.name);

  constructor(
    @Inject(TripRepositoryPort)
    private readonly tripRepository: TripRepositoryPort,
    @Inject(DayPlanRepositoryPort)
    private readonly dayPlanRepository: DayPlanRepositoryPort,
    @Inject(ActivityRepositoryPort)
    private readonly activityRepository: ActivityRepositoryPort,
    @Inject(GeminiPort)
    private readonly gemini: GeminiPort,
  ) {}

  async execute(tripId: string, userId: string): Promise<ItineraryResult> {
    const trip = await this.tripRepository.findById(tripId);

    if (!trip) {
      throw new NotFoundException('Trip', tripId);
    }

    if (trip.userId !== userId) {
      throw new ForbiddenException(
        'You can only generate itineraries for your own trips',
      );
    }

    const days = Math.ceil(
      (trip.endDate.getTime() - trip.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const prompt = this.buildPrompt(trip, days);
    this.logger.debug(`Generating itinerary for trip ${tripId}`);

    const response =
      await this.gemini.generateStructuredOutput<ItineraryResponse>(
        prompt,
        itinerarySchema,
      );

    const mappedDayPlans = ItineraryMapper.toDayPlans(response);
    const mappedActivities = ItineraryMapper.toActivities(response);

    const savedDayPlans: DayPlan[] = [];
    for (const dayPlan of mappedDayPlans) {
      const date = new Date(trip.startDate);
      date.setDate(date.getDate() + dayPlan.dayNumber - 1);

      const existing = await this.dayPlanRepository.findByTripIdAndDayNumber(
        tripId,
        dayPlan.dayNumber,
      );

      if (existing) {
        await this.dayPlanRepository.update(existing.id, {
          title: dayPlan.title,
          notes: dayPlan.notes ?? undefined,
        });
        savedDayPlans.push(existing);
      } else {
        const created = await this.dayPlanRepository.create({
          tripId,
          dayNumber: dayPlan.dayNumber,
          date,
          title: dayPlan.title,
          notes: dayPlan.notes,
        });
        savedDayPlans.push(created);
      }
    }

    const savedActivities: Activity[] = [];
    for (const activity of mappedActivities) {
      const dayPlan = savedDayPlans.find(
        (d) => d.dayNumber === activity.dayNumber,
      );

      if (dayPlan) {
        const created = await this.activityRepository.create({
          dayPlanId: dayPlan.id,
          title: activity.title,
          description: activity.description ?? undefined,
          location: activity.location ?? undefined,
          latitude: activity.latitude ?? undefined,
          longitude: activity.longitude ?? undefined,
          startTime: activity.startTime ?? undefined,
          endTime: activity.endTime ?? undefined,
          cost: activity.cost ?? undefined,
          bookingUrl: activity.bookingUrl ?? undefined,
          category: activity.category,
          order: activity.order,
        });
        savedActivities.push(created);
      }
    }

    return { dayPlans: savedDayPlans, activities: savedActivities };
  }

  private buildPrompt(
    trip: {
      destination: string;
      startDate: Date;
      endDate: Date;
      travelerCount: number;
      budget: number | null;
      preferences: { interests: string[]; travelStyle: string };
    },
    days: number,
  ): string {
    return `Create a detailed ${days}-day itinerary for a trip to ${trip.destination}.

Trip details:
- Destination: ${trip.destination}
- Start date: ${trip.startDate.toISOString().split('T')[0]}
- End date: ${trip.endDate.toISOString().split('T')[0]}
- Duration: ${days} days
- Travelers: ${trip.travelerCount}
- Budget: ${trip.budget ? `${trip.budget} EUR total` : 'not specified'}
- Travel style: ${trip.preferences.travelStyle}
- Interests: ${trip.preferences.interests.join(', ')}

For each day, provide:
- dayNumber (1-based)
- title (short catchy title)
- summary (brief overview of the day)

For each activity within a day, provide:
- title
- description
- category (one of: sightseeing, food, culture, adventure, relaxation, shopping, nightlife, transport, other)
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
