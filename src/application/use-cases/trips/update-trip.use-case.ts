import { Inject, Injectable } from '@nestjs/common';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { TripNotFoundException } from '../../../domain/exceptions/trip-not-found.exception';
import { UpdateTripDto } from '../../dto/update-trip.dto';
import { Trip } from '../../../domain/entities/trip.entity';
import { ValidationException } from '../../../domain/exceptions/validation.exception';

@Injectable()
export class UpdateTripUseCase {
  constructor(
    @Inject(TripRepositoryPort)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(
    tripId: string,
    dto: UpdateTripDto,
    userId: string,
  ): Promise<Trip> {
    const existing = await this.tripRepository.findById(tripId);

    if (!existing) {
      throw new TripNotFoundException(tripId);
    }

    if (existing.userId !== userId) {
      throw new TripNotFoundException(tripId);
    }

    const updateData: Record<string, unknown> = {};

    if (dto.title !== undefined) {
      if (dto.title.trim().length === 0) {
        throw new ValidationException('Title cannot be empty');
      }
      updateData.title = dto.title.trim();
    }

    if (dto.destination !== undefined) {
      if (dto.destination.trim().length === 0) {
        throw new ValidationException('Destination cannot be empty');
      }
      updateData.destination = dto.destination.trim();
    }

    if (dto.startDate !== undefined) {
      const startDate = new Date(dto.startDate);
      if (isNaN(startDate.getTime())) {
        throw new ValidationException('Invalid start date format');
      }
      updateData.startDate = startDate;
    }

    if (dto.endDate !== undefined) {
      const endDate = new Date(dto.endDate);
      if (isNaN(endDate.getTime())) {
        throw new ValidationException('Invalid end date format');
      }
      updateData.endDate = endDate;
    }

    if (dto.budget !== undefined) {
      updateData.budget = dto.budget;
    }

    if (dto.travelerCount !== undefined) {
      updateData.travelerCount = dto.travelerCount;
    }

    if (dto.interests !== undefined) {
      if (dto.interests.length === 0) {
        throw new ValidationException('At least one interest is required');
      }
      updateData.preferences = {
        interests: dto.interests,
        travelStyle: dto.travelStyle ?? existing.preferences.travelStyle,
      };
    } else if (dto.travelStyle !== undefined) {
      updateData.preferences = {
        interests: existing.preferences.interests,
        travelStyle: dto.travelStyle,
      };
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    return this.tripRepository.update(tripId, updateData);
  }
}
