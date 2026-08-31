import { CreateHotelRecommendationData } from '../../domain/ports/repositories/hotel-recommendation.repository.port';

interface GeminiHotel {
  name: string;
  city: string;
  country?: string;
  address?: string;
  neighborhood?: string;
  latitude: number;
  longitude: number;
  pricePerNight: number;
  originalPricePerNight?: number;
  currency?: string;
  starRating?: number;
  reviewCount?: number;
  amenities?: string[];
  imageUrl?: string;
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
      neighborhood: hotel.neighborhood ?? null,
      latitude: hotel.latitude ?? null,
      longitude: hotel.longitude ?? null,
      pricePerNight: hotel.pricePerNight ?? null,
      originalPricePerNight: hotel.originalPricePerNight ?? null,
      currency: hotel.currency ?? 'EUR',
      rating: hotel.starRating ?? null,
      reviewCount: hotel.reviewCount ?? null,
      amenities: hotel.amenities ?? [],
      imageUrl: hotel.imageUrl ?? null,
      bookingUrl: hotel.bookingUrl ?? null,
      isRecommended: true,
    }));
  }
}
