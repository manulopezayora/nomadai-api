import { FlightRecommendation } from '../../entities/flight-recommendation.entity';

export interface CreateFlightRecommendationData {
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
}

export abstract class FlightRecommendationRepositoryPort {
  abstract findByTripId(tripId: string): Promise<FlightRecommendation[]>;
  abstract createMany(
    tripId: string,
    data: CreateFlightRecommendationData[],
  ): Promise<FlightRecommendation[]>;
  abstract deleteByTripId(tripId: string): Promise<void>;
}
