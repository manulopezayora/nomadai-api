import { Inject, Injectable } from '@nestjs/common';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { Trip } from '../../../domain/entities/trip.entity';

@Injectable()
export class ListTripsUseCase {
  constructor(
    @Inject(TripRepositoryPort)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(userId: string): Promise<Trip[]> {
    return this.tripRepository.findByUserId(userId);
  }
}
