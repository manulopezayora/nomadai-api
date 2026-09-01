import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateHotelRecommendationData,
  HotelRecommendationRepositoryPort,
} from '../../../domain/ports/repositories/hotel-recommendation.repository.port';
import { HotelRecommendation } from '../../../domain/entities/hotel-recommendation.entity';
import { HotelRecommendationMapper } from '../prisma/mappers/hotel-recommendation.mapper';

@Injectable()
export class PrismaHotelRecommendationRepository extends HotelRecommendationRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async findByTripId(tripId: string): Promise<HotelRecommendation[]> {
    const results = await this.prisma.instance.hotelRecommendation.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
    });
    return results.map((r) => HotelRecommendationMapper.toDomain(r));
  }

  async createMany(
    tripId: string,
    data: CreateHotelRecommendationData[],
  ): Promise<HotelRecommendation[]> {
    await this.prisma.instance.hotelRecommendation.deleteMany({
      where: { tripId },
    });

    await this.prisma.instance.hotelRecommendation.createMany({
      data: data.map((d) =>
        HotelRecommendationMapper.toPrismaCreate(tripId, d),
      ),
    });

    return this.findByTripId(tripId);
  }

  async deleteByTripId(tripId: string): Promise<void> {
    await this.prisma.instance.hotelRecommendation.deleteMany({
      where: { tripId },
    });
  }
}
