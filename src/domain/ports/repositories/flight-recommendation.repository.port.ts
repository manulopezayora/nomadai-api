import { FlightRecommendation } from '../../entities/flight-recommendation.entity';

export interface CreateFlightRecommendationData {
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
}

export abstract class FlightRecommendationRepositoryPort {
  abstract findByTripId(tripId: string): Promise<FlightRecommendation[]>;
  abstract createMany(
    tripId: string,
    data: CreateFlightRecommendationData[],
  ): Promise<FlightRecommendation[]>;
  abstract deleteByTripId(tripId: string): Promise<void>;
}
