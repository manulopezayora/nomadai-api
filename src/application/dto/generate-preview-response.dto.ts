import { CreateFlightRecommendationData } from '../../domain/ports/repositories/flight-recommendation.repository.port';
import { CreateHotelRecommendationData } from '../../domain/ports/repositories/hotel-recommendation.repository.port';
import { MappedActivity } from '../../shared/ai/itinerary.mapper';

export interface GenerateItineraryPreviewResult {
  days: Array<{
    dayNumber: number;
    title: string;
    notes: string | null;
    activities: MappedActivity[];
  }>;
}

export interface GenerateFlightsPreviewResult {
  flights: CreateFlightRecommendationData[];
}

export interface GenerateHotelsPreviewResult {
  hotels: CreateHotelRecommendationData[];
}
