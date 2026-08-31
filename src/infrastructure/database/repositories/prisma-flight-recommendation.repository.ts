import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFlightRecommendationData,
  FlightRecommendationRepositoryPort,
} from '../../../domain/ports/repositories/flight-recommendation.repository.port';
import { FlightRecommendation } from '../../../domain/entities/flight-recommendation.entity';

@Injectable()
export class PrismaFlightRecommendationRepository extends FlightRecommendationRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async findByTripId(tripId: string): Promise<FlightRecommendation[]> {
    const results = await this.prisma.instance.flightRecommendation.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
    });
    return results.map((r) => ({
      id: r.id,
      tripId: r.tripId,
      airline: r.airline,
      departure: r.departure,
      arrival: r.arrival,
      departureTime: r.departureTime,
      arrivalTime: r.arrivalTime,
      price: r.price,
      currency: r.currency,
      bookingUrl: r.bookingUrl,
      notes: r.notes,
      isRecommended: r.isRecommended,
      createdAt: r.createdAt,
    }));
  }

  async createMany(
    tripId: string,
    data: CreateFlightRecommendationData[],
  ): Promise<FlightRecommendation[]> {
    await this.prisma.instance.flightRecommendation.deleteMany({
      where: { tripId },
    });

    const created = await this.prisma.instance.flightRecommendation.createMany({
      data: data.map((d) => ({
        tripId,
        airline: d.airline,
        departure: d.departure,
        arrival: d.arrival,
        departureTime: d.departureTime,
        arrivalTime: d.arrivalTime,
        price: d.price,
        currency: d.currency,
        bookingUrl: d.bookingUrl,
        notes: d.notes,
        isRecommended: d.isRecommended,
      })),
    });

    void created;
    return this.findByTripId(tripId);
  }

  async deleteByTripId(tripId: string): Promise<void> {
    await this.prisma.instance.flightRecommendation.deleteMany({
      where: { tripId },
    });
  }
}
