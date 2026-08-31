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
      flightNumber: r.flightNumber,
      departure: r.departure,
      arrival: r.arrival,
      departureDate: r.departureDate,
      departureTime: r.departureTime,
      arrivalTime: r.arrivalTime,
      price: r.price,
      currency: r.currency,
      class: r.class,
      stops: r.stops,
      durationMinutes: r.durationMinutes,
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

    await this.prisma.instance.flightRecommendation.createMany({
      data: data.map((d) => ({
        tripId,
        airline: d.airline,
        flightNumber: d.flightNumber,
        departure: d.departure,
        arrival: d.arrival,
        departureDate: d.departureDate,
        departureTime: d.departureTime,
        arrivalTime: d.arrivalTime,
        price: d.price,
        currency: d.currency,
        class: d.class,
        stops: d.stops,
        durationMinutes: d.durationMinutes,
        bookingUrl: d.bookingUrl,
        notes: d.notes,
        isRecommended: d.isRecommended,
      })),
    });

    return this.findByTripId(tripId);
  }

  async deleteByTripId(tripId: string): Promise<void> {
    await this.prisma.instance.flightRecommendation.deleteMany({
      where: { tripId },
    });
  }
}
