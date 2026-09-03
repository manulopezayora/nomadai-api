import { Inject, Injectable } from '@nestjs/common';
import { ActivityRepositoryPort } from '../../../domain/ports/repositories/activity.repository.port';
import { DayPlanRepositoryPort } from '../../../domain/ports/repositories/day-plan.repository.port';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { UpdateActivityDto } from '../../dto/update-activity.dto';
import { Activity } from '../../../domain/entities/activity.entity';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';

@Injectable()
export class UpdateActivityUseCase {
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
    dto: UpdateActivityDto,
    userId: string,
  ): Promise<Activity> {
    const trip = await this.tripRepository.findById(tripId);

    if (!trip) {
      throw new NotFoundException('Trip', tripId);
    }

    if (trip.userId !== userId) {
      throw new ForbiddenException(
        'TRIP_FORBIDDEN',
        'You can only update activities on your own trips',
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

    if (dto.title !== undefined && dto.title.trim().length === 0) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Activity title cannot be empty',
      );
    }

    return this.activityRepository.update(activityId, {
      title: dto.title?.trim(),
      description: dto.description?.trim(),
      location: dto.location?.trim(),
      latitude: dto.latitude,
      longitude: dto.longitude,
      startTime: dto.startTime,
      endTime: dto.endTime,
      cost: dto.cost,
      bookingUrl: dto.bookingUrl,
      category: dto.category,
      placeId: dto.placeId,
      order: dto.order,
    });
  }
}
