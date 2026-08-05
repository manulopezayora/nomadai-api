import { Inject, Injectable } from '@nestjs/common';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { CreateTripDto } from '../../dto/create-trip.dto';
import { Trip } from '../../../domain/entities/trip.entity';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { TravelStyle } from '../../../domain/enums/travel-style.enum';

@Injectable()
export class CreateTripUseCase {
  constructor(
    @Inject(TripRepositoryPort)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(dto: CreateTripDto, userId: string): Promise<Trip> {
    if (!dto.title || dto.title.trim().length === 0) {
      throw new ValidationException('Title is required');
    }

    if (!dto.destination || dto.destination.trim().length === 0) {
      throw new ValidationException('Destination is required');
    }

    if (!dto.startDate) {
      throw new ValidationException('Start date is required');
    }

    if (!dto.endDate) {
      throw new ValidationException('End date is required');
    }

    if (!dto.interests || dto.interests.length === 0) {
      throw new ValidationException('At least one interest is required');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (isNaN(startDate.getTime())) {
      throw new ValidationException('Invalid start date format');
    }

    if (isNaN(endDate.getTime())) {
      throw new ValidationException('Invalid end date format');
    }

    if (endDate <= startDate) {
      throw new ValidationException('End date must be after start date');
    }

    return this.tripRepository.create({
      userId,
      title: dto.title.trim(),
      destination: dto.destination.trim(),
      startDate,
      endDate,
      budget: dto.budget,
      travelerCount: dto.travelerCount ?? 1,
      preferences: {
        interests: dto.interests,
        travelStyle: dto.travelStyle ?? TravelStyle.MID,
      },
    });
  }
}
