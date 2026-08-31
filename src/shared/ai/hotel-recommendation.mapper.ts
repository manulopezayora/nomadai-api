import { CreateHotelRecommendationData } from '../../domain/ports/repositories/hotel-recommendation.repository.port';

interface GeminiHotel {
  name: string;
  city: string;
  country?: string;
  address?: string;
  latitude: number;
  longitude: number;
  pricePerNight: number;
  currency?: string;
  starRating?: number;
  amenities?: string[];
  bookingUrl?: string;
  checkIn?: string;
  checkOut?: string;
}

export interface GeminiHotelResponse {
  hotels: GeminiHotel[];
}

export class HotelRecommendationMapper {
  static toCreateDataArray(response: unknown): CreateHotelRecommendationData[] {
    const data = response as GeminiHotelResponse;
    return data.hotels.map((hotel) => ({
      name: hotel.name,
      location: [hotel.city, hotel.country].filter(Boolean).join(', '),
      latitude: hotel.latitude ?? null,
      longitude: hotel.longitude ?? null,
      pricePerNight: hotel.pricePerNight ?? null,
      currency: hotel.currency ?? 'EUR',
      rating: hotel.starRating ?? null,
      amenities: hotel.amenities ?? [],
      bookingUrl: hotel.bookingUrl ?? null,
      isRecommended: true,
    }));
  }
}
