import { Inject, Injectable } from '@nestjs/common';
import { TripRepositoryPort } from '../../../domain/ports/repositories/trip.repository.port';
import { TripNotFoundException } from '../../../domain/exceptions/trip-not-found.exception';

@Injectable()
export class DeleteTripUseCase {
  constructor(
    @Inject(TripRepositoryPort)
    private readonly tripRepository: TripRepositoryPort,
  ) {}

  async execute(tripId: string, userId: string): Promise<void> {
    const trip = await this.tripRepository.findById(tripId);

    if (!trip) {
      throw new TripNotFoundException(tripId);
    }

    if (trip.userId !== userId) {
      throw new TripNotFoundException(tripId);
    }

    await this.tripRepository.delete(tripId);
  }
}
