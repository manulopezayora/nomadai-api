import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFlightRecommendationData,
  FlightRecommendationRepositoryPort,
} from '../../../domain/ports/repositories/flight-recommendation.repository.port';
import { FlightRecommendation } from '../../../domain/entities/flight-recommendation.entity';
import { FlightRecommendationMapper } from '../prisma/mappers/flight-recommendation.mapper';

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
    return results.map((r) => FlightRecommendationMapper.toDomain(r));
  }

  async createMany(
    tripId: string,
    data: CreateFlightRecommendationData[],
  ): Promise<FlightRecommendation[]> {
    await this.prisma.instance.flightRecommendation.deleteMany({
      where: { tripId },
    });

    await this.prisma.instance.flightRecommendation.createMany({
      data: data.map((d) =>
        FlightRecommendationMapper.toPrismaCreate(tripId, d),
      ),
    });

    return this.findByTripId(tripId);
  }

  async deleteByTripId(tripId: string): Promise<void> {
    await this.prisma.instance.flightRecommendation.deleteMany({
      where: { tripId },
    });
  }
}
