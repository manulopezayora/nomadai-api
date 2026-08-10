import { Inject, Injectable } from '@nestjs/common';
import { DayPlanRepositoryPort } from '../../../domain/ports/repositories/day-plan.repository.port';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';

@Injectable()
export class DeleteDayPlanUseCase {
  constructor(
    @Inject(DayPlanRepositoryPort)
    private readonly dayPlanRepository: DayPlanRepositoryPort,
    @Inject(TripRepositoryPort)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(
    tripId: string,
    dayPlanId: string,
    userId: string,
  ): Promise<void> {
    const trip = await this.tripRepository.findById(tripId);

    if (!trip) {
      throw new NotFoundException('Trip', tripId);
    }

    if (trip.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete days for your own trips',
      );
    }

    const dayPlan = await this.dayPlanRepository.findById(dayPlanId);

    if (!dayPlan) {
      throw new NotFoundException('DayPlan', dayPlanId);
    }

    if (dayPlan.tripId !== tripId) {
      throw new ForbiddenException('Day plan does not belong to this trip');
    }

    await this.dayPlanRepository.delete(dayPlanId);
  }
}
