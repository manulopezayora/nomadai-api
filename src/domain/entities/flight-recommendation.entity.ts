export interface FlightRecommendation {
  id: string;
  tripId: string;
  airline: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  price: number | null;
  currency: string;
  bookingUrl: string | null;
  notes: string | null;
  isRecommended: boolean;
  createdAt: Date;
}
