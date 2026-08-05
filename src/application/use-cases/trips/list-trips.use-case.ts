import { Inject, Injectable } from '@nestjs/common';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { Trip } from '../../../domain/entities/trip.entity';
import { PaginatedResponse } from '../../../shared/types/paginated-response';

@Injectable()
export class ListTripsUseCase {
  constructor(
    @Inject(TripRepositoryPort)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<Trip>> {
    const offset = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.tripRepository.findByUserId(userId, offset, limit),
      this.tripRepository.countByUserId(userId),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
