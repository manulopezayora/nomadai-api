import { Inject, Injectable } from '@nestjs/common';
import { ActivityRepositoryPort } from '../../../domain/ports/repositories/activity.repository.port';
import { DayPlanRepositoryPort } from '../../../domain/ports/repositories/day-plan.repository.port';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { CreateActivityDto } from '../../dto/create-activity.dto';
import { Activity } from '../../../domain/entities/activity.entity';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';

@Injectable()
export class CreateActivityUseCase {
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
    dto: CreateActivityDto,
    userId: string,
  ): Promise<Activity> {
    const trip = await this.tripRepository.findById(tripId);

    if (!trip) {
      throw new NotFoundException('Trip', tripId);
    }

    if (trip.userId !== userId) {
      throw new ForbiddenException(
        'You can only add activities to your own trips',
      );
    }

    const dayPlan = await this.dayPlanRepository.findById(dayPlanId);

    if (!dayPlan) {
      throw new NotFoundException('DayPlan', dayPlanId);
    }

    if (dayPlan.tripId !== tripId) {
      throw new ForbiddenException('Day plan does not belong to this trip');
    }

    if (!dto.title || dto.title.trim().length === 0) {
      throw new ValidationException('Activity title is required');
    }

    return this.activityRepository.create({
      dayPlanId,
      title: dto.title.trim(),
      description: dto.description?.trim() ?? undefined,
      location: dto.location?.trim() ?? undefined,
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
