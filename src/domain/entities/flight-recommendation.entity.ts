export interface FlightRecommendation {
  id: string;
  tripId: string;
  airline: string;
  flightNumber: string | null;
  departure: string;
  arrival: string;
  departureDate: string | null;
  departureTime: string;
  arrivalTime: string;
  price: number | null;
  currency: string;
  class: string | null;
  stops: number | null;
  durationMinutes: number | null;
  bookingUrl: string | null;
  notes: string | null;
  isRecommended: boolean;
  createdAt: Date;
}
