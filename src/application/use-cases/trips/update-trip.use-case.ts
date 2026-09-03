import { Inject, Injectable } from '@nestjs/common';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { TripNotFoundException } from '../../../domain/exceptions/trip-not-found.exception';
import { UpdateTripDto } from '../../dto/update-trip.dto';
import { Trip } from '../../../domain/entities/trip.entity';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { TripStatus } from '../../../domain/enums/trip-status.enum';

const VALID_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  [TripStatus.PLANNING]: [TripStatus.ACTIVE, TripStatus.COMPLETED],
  [TripStatus.ACTIVE]: [TripStatus.COMPLETED],
  [TripStatus.COMPLETED]: [],
};

const EDITABLE_FIELDS_BY_STATUS: Record<TripStatus, string[]> = {
  [TripStatus.PLANNING]: [
    'title',
    'destination',
    'startDate',
    'endDate',
    'budget',
    'travelerCount',
    'interests',
    'travelStyle',
    'status',
  ],
  [TripStatus.ACTIVE]: [
    'title',
    'budget',
    'travelerCount',
    'interests',
    'travelStyle',
    'status',
  ],
  [TripStatus.COMPLETED]: [],
};

@Injectable()
export class UpdateTripUseCase {
  constructor(
    @Inject(TripRepositoryPort)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(
    tripId: string,
    dto: UpdateTripDto,
    currentUser: { userId: string; role: UserRole },
  ): Promise<Trip> {
    const existing = await this.tripRepository.findById(tripId);

    if (!existing) {
      throw new TripNotFoundException(tripId);
    }

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isOwner = existing.userId === currentUser.userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'TRIP_FORBIDDEN',
        'You do not have permission to update this trip',
      );
    }

    if (
      !isAdmin &&
      dto.status !== undefined &&
      dto.status !== existing.status
    ) {
      const allowed = VALID_TRANSITIONS[existing.status] ?? [];

      if (!allowed.includes(dto.status)) {
        throw new ValidationException(
          'VALIDATION_INVALID_PARAMS',
          `Cannot change status from '${existing.status}' to '${dto.status}'`,
        );
      }
    }

    if (!isAdmin) {
      const editableFields = EDITABLE_FIELDS_BY_STATUS[existing.status] ?? [];

      const forbiddenFields = Object.keys(dto).filter(
        (key) =>
          dto[key as keyof UpdateTripDto] !== undefined &&
          !editableFields.includes(key),
      );

      if (forbiddenFields.length > 0) {
        throw new ForbiddenException(
          'TRIP_FORBIDDEN',
          `Cannot edit fields [${forbiddenFields.join(', ')}] on a '${existing.status}' trip`,
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (dto.title !== undefined) {
      if (dto.title.trim().length === 0) {
        throw new ValidationException(
          'VALIDATION_INVALID_PARAMS',
          'Title cannot be empty',
        );
      }
      updateData.title = dto.title.trim();
    }

    if (dto.destination !== undefined) {
      if (dto.destination.trim().length === 0) {
        throw new ValidationException(
          'VALIDATION_INVALID_PARAMS',
          'Destination cannot be empty',
        );
      }
      updateData.destination = dto.destination.trim();
    }

    if (dto.startDate !== undefined) {
      const startDate = new Date(dto.startDate);
      if (isNaN(startDate.getTime())) {
        throw new ValidationException(
          'VALIDATION_INVALID_PARAMS',
          'Invalid start date format',
        );
      }
      updateData.startDate = startDate;
    }

    if (dto.endDate !== undefined) {
      const endDate = new Date(dto.endDate);
      if (isNaN(endDate.getTime())) {
        throw new ValidationException(
          'VALIDATION_INVALID_PARAMS',
          'Invalid end date format',
        );
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
        throw new ValidationException(
          'VALIDATION_INVALID_PARAMS',
          'At least one interest is required',
        );
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

    const finalStartDate = (updateData.startDate as Date) ?? existing.startDate;
    const finalEndDate = (updateData.endDate as Date) ?? existing.endDate;

    if (finalEndDate <= finalStartDate) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'End date must be after start date',
      );
    }

    return this.tripRepository.update(tripId, updateData);
  }
}
