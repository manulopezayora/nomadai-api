export interface HotelRecommendation {
  id: string;
  tripId: string;
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
  createdAt: Date;
}
