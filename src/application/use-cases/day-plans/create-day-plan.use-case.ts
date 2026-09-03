import { Inject, Injectable } from '@nestjs/common';
import { DayPlanRepositoryPort } from '../../../domain/ports/repositories/day-plan.repository.port';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { CreateDayPlanDto } from '../../dto/create-day-plan.dto';
import { DayPlan } from '../../../domain/entities/day-plan.entity';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';

@Injectable()
export class CreateDayPlanUseCase {
  constructor(
    @Inject(DayPlanRepositoryPort)
    private readonly dayPlanRepository: DayPlanRepositoryPort,
    @Inject(TripRepositoryPort)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(
    tripId: string,
    dto: CreateDayPlanDto,
    userId: string,
  ): Promise<DayPlan> {
    const trip = await this.tripRepository.findById(tripId);

    if (!trip) {
      throw new NotFoundException('Trip', tripId);
    }

    if (trip.userId !== userId) {
      throw new ForbiddenException(
        'TRIP_FORBIDDEN',
        'You can only create days for your own trips',
      );
    }

    if (!dto.date) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Date is required',
      );
    }

    const date = new Date(dto.date);

    if (isNaN(date.getTime())) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Invalid date format',
      );
    }

    if (date < trip.startDate || date > trip.endDate) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        `Date must be between trip start (${trip.startDate.toISOString().split('T')[0]}) and end (${trip.endDate.toISOString().split('T')[0]})`,
      );
    }

    const existing = await this.dayPlanRepository.findByTripIdAndDayNumber(
      tripId,
      dto.dayNumber,
    );

    if (existing) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        `Day ${dto.dayNumber} already exists for this trip`,
      );
    }

    return this.dayPlanRepository.create({
      tripId,
      dayNumber: dto.dayNumber,
      date,
      title: dto.title?.trim() ?? null,
      notes: dto.notes?.trim() ?? null,
    });
  }
}
