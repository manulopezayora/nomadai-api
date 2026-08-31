import { HotelRecommendation } from '../../entities/hotel-recommendation.entity';

export interface CreateHotelRecommendationData {
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
}

export abstract class HotelRecommendationRepositoryPort {
  abstract findByTripId(tripId: string): Promise<HotelRecommendation[]>;
  abstract createMany(
    tripId: string,
    data: CreateHotelRecommendationData[],
  ): Promise<HotelRecommendation[]>;
  abstract deleteByTripId(tripId: string): Promise<void>;
}
