import { TravelStyle } from '../../domain/enums/travel-style.enum';
import { CreateFlightRecommendationData } from '../../domain/ports/repositories/flight-recommendation.repository.port';
import { CreateHotelRecommendationData } from '../../domain/ports/repositories/hotel-recommendation.repository.port';
import { MappedActivity } from '../../shared/ai/itinerary.mapper';

export interface GenerateTripResult {
  trip: {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number | null;
    travelerCount: number;
    interests: string[];
    travelStyle: TravelStyle;
  };
  flights: CreateFlightRecommendationData[];
  hotels: CreateHotelRecommendationData[];
  itinerary: {
    days: Array<{
      dayNumber: number;
      title: string;
      notes: string | null;
      activities: MappedActivity[];
    }>;
  };
}
