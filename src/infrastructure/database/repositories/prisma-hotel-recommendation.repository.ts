import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateHotelRecommendationData,
  HotelRecommendationRepositoryPort,
} from '../../../domain/ports/repositories/hotel-recommendation.repository.port';
import { HotelRecommendation } from '../../../domain/entities/hotel-recommendation.entity';

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
    return results.map((r) => ({
      id: r.id,
      tripId: r.tripId,
      name: r.name,
      location: r.location,
      neighborhood: r.neighborhood,
      latitude: r.latitude,
      longitude: r.longitude,
      pricePerNight: r.pricePerNight,
      originalPricePerNight: r.originalPricePerNight,
      currency: r.currency,
      rating: r.rating,
      reviewCount: r.reviewCount,
      amenities: r.amenities,
      imageUrl: r.imageUrl,
      bookingUrl: r.bookingUrl,
      isRecommended: r.isRecommended,
      createdAt: r.createdAt,
    }));
  }

  async createMany(
    tripId: string,
    data: CreateHotelRecommendationData[],
  ): Promise<HotelRecommendation[]> {
    await this.prisma.instance.hotelRecommendation.deleteMany({
      where: { tripId },
    });

    await this.prisma.instance.hotelRecommendation.createMany({
      data: data.map((d) => ({
        tripId,
        name: d.name,
        location: d.location,
        neighborhood: d.neighborhood,
        latitude: d.latitude,
        longitude: d.longitude,
        pricePerNight: d.pricePerNight,
        originalPricePerNight: d.originalPricePerNight,
        currency: d.currency,
        rating: d.rating,
        reviewCount: d.reviewCount,
        amenities: d.amenities,
        imageUrl: d.imageUrl,
        bookingUrl: d.bookingUrl,
        isRecommended: d.isRecommended,
      })),
    });

    return this.findByTripId(tripId);
  }

  async deleteByTripId(tripId: string): Promise<void> {
    await this.prisma.instance.hotelRecommendation.deleteMany({
      where: { tripId },
    });
  }
}
