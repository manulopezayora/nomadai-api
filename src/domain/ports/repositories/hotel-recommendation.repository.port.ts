import { HotelRecommendation } from '../../entities/hotel-recommendation.entity';

export interface CreateHotelRecommendationData {
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  pricePerNight: number | null;
  currency: string;
  rating: number | null;
  amenities: string[];
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
