import { HotelRecommendation } from '../../../../domain/entities/hotel-recommendation.entity';
import { CreateHotelRecommendationData } from '../../../../domain/ports/repositories/hotel-recommendation.repository.port';

interface PrismaHotelRecommendation {
  id: string;
  tripId: string;
  name: string;
  location: string;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  pricePerNight: number | null;
  originalPricePerNight: number | null;
  currency: string;
  rating: number | null;
  reviewCount: number | null;
  amenities: string[];
  imageUrl: string | null;
  bookingUrl: string | null;
  isRecommended: boolean;
  createdAt: Date;
}

export class HotelRecommendationMapper {
  static toDomain(raw: PrismaHotelRecommendation): HotelRecommendation {
    return {
      id: raw.id,
      tripId: raw.tripId,
      name: raw.name,
      location: raw.location,
      neighborhood: raw.neighborhood,
      latitude: raw.latitude,
      longitude: raw.longitude,
      pricePerNight: raw.pricePerNight,
      originalPricePerNight: raw.originalPricePerNight,
      currency: raw.currency,
      rating: raw.rating,
      reviewCount: raw.reviewCount,
      amenities: raw.amenities,
      imageUrl: raw.imageUrl,
      bookingUrl: raw.bookingUrl,
      isRecommended: raw.isRecommended,
      createdAt: raw.createdAt,
    };
  }

  static toPrismaCreate(tripId: string, data: CreateHotelRecommendationData) {
    return {
      tripId,
      name: data.name,
      location: data.location,
      neighborhood: data.neighborhood,
      latitude: data.latitude,
      longitude: data.longitude,
      pricePerNight: data.pricePerNight,
      originalPricePerNight: data.originalPricePerNight,
      currency: data.currency,
      rating: data.rating,
      reviewCount: data.reviewCount,
      amenities: data.amenities,
      imageUrl: data.imageUrl,
      bookingUrl: data.bookingUrl,
      isRecommended: data.isRecommended,
    };
  }
}
