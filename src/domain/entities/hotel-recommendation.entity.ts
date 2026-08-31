export interface HotelRecommendation {
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
