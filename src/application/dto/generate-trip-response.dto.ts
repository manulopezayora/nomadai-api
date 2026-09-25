import { TravelStyle } from '../../domain/enums/travel-style.enum';

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
}
