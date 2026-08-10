import { Inject, Injectable } from '@nestjs/common';
import { DayPlanRepositoryPort } from '../../../domain/ports/repositories/day-plan.repository.port';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { UpdateDayPlanDto } from '../../dto/update-day-plan.dto';
import { DayPlan } from '../../../domain/entities/day-plan.entity';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';

@Injectable()
export class UpdateDayPlanUseCase {
  constructor(
    @Inject(DayPlanRepositoryPort)
    private readonly dayPlanRepository: DayPlanRepositoryPort,
    @Inject(TripRepositoryPort)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(
    tripId: string,
    dayPlanId: string,
    dto: UpdateDayPlanDto,
    userId: string,
  ): Promise<DayPlan> {
    const trip = await this.tripRepository.findById(tripId);

    if (!trip) {
      throw new NotFoundException('Trip', tripId);
    }

    if (trip.userId !== userId) {
      throw new ForbiddenException(
        'You can only update days for your own trips',
      );
    }

    const dayPlan = await this.dayPlanRepository.findById(dayPlanId);

    if (!dayPlan) {
      throw new NotFoundException('DayPlan', dayPlanId);
    }

    if (dayPlan.tripId !== tripId) {
      throw new ForbiddenException('Day plan does not belong to this trip');
    }

    if (dto.dayNumber !== undefined && dto.dayNumber !== dayPlan.dayNumber) {
      const existing = await this.dayPlanRepository.findByTripIdAndDayNumber(
        tripId,
        dto.dayNumber,
      );

      if (existing) {
        throw new ValidationException(
          `Day ${dto.dayNumber} already exists for this trip`,
        );
      }
    }

    if (dto.date !== undefined) {
      const date = new Date(dto.date);

      if (isNaN(date.getTime())) {
        throw new ValidationException('Invalid date format');
      }

      if (date < trip.startDate || date > trip.endDate) {
        throw new ValidationException(
          `Date must be between trip start (${trip.startDate.toISOString().split('T')[0]}) and end (${trip.endDate.toISOString().split('T')[0]})`,
        );
      }
    }

    return this.dayPlanRepository.update(dayPlanId, {
      dayNumber: dto.dayNumber,
      date: dto.date ? new Date(dto.date) : undefined,
      title: dto.title?.trim(),
      notes: dto.notes?.trim(),
    });
  }
}
