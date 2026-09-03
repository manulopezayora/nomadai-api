import { Inject, Injectable } from '@nestjs/common';
import { ActivityRepositoryPort } from '../../../domain/ports/repositories/activity.repository.port';
import { DayPlanRepositoryPort } from '../../../domain/ports/repositories/day-plan.repository.port';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';

@Injectable()
export class DeleteActivityUseCase {
  constructor(
    @Inject(ActivityRepositoryPort)
    private readonly activityRepository: ActivityRepositoryPort,
    @Inject(DayPlanRepositoryPort)
    private readonly dayPlanRepository: DayPlanRepositoryPort,
    @Inject(TripRepositoryPort)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(
    tripId: string,
    dayPlanId: string,
    activityId: string,
    userId: string,
  ): Promise<void> {
    const trip = await this.tripRepository.findById(tripId);

    if (!trip) {
      throw new NotFoundException('Trip', tripId);
    }

    if (trip.userId !== userId) {
      throw new ForbiddenException(
        'TRIP_FORBIDDEN',
        'You can only delete activities from your own trips',
      );
    }

    const dayPlan = await this.dayPlanRepository.findById(dayPlanId);

    if (!dayPlan) {
      throw new NotFoundException('DayPlan', dayPlanId);
    }

    if (dayPlan.tripId !== tripId) {
      throw new ForbiddenException(
        'DAY_PLAN_FORBIDDEN',
        'Day plan does not belong to this trip',
      );
    }

    const activity = await this.activityRepository.findById(activityId);

    if (!activity) {
      throw new NotFoundException('Activity', activityId);
    }

    if (activity.dayPlanId !== dayPlanId) {
      throw new ForbiddenException(
        'ACTIVITY_FORBIDDEN',
        'Activity does not belong to this day plan',
      );
    }

    await this.activityRepository.delete(activityId);
  }
}
