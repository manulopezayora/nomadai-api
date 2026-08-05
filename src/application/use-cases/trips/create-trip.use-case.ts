import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { CreateTripDto } from '../../dto/create-trip.dto';
import { Trip } from '../../../domain/entities/trip.entity';

@Injectable()
export class CreateTripUseCase {
  constructor(
    @Inject(TripRepositoryPort)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(dto: CreateTripDto, userId: string): Promise<Trip> {
    if (!dto.title || dto.title.trim().length === 0) {
      throw new BadRequestException('Title is required');
    }

    if (!dto.destination || dto.destination.trim().length === 0) {
      throw new BadRequestException('Destination is required');
    }

    if (!dto.startDate) {
      throw new BadRequestException('Start date is required');
    }

    if (!dto.endDate) {
      throw new BadRequestException('End date is required');
    }

    if (!dto.interests || dto.interests.length === 0) {
      throw new BadRequestException('At least one interest is required');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid start date format');
    }

    if (isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid end date format');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
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
        travelStyle: dto.travelStyle ?? 'mid',
      },
    });
  }
}
