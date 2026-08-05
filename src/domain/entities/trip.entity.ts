import { TripStatus } from '../enums/trip-status.enum';
import { TravelStyle } from '../enums/travel-style.enum';

export { TripStatus } from '../enums/trip-status.enum';
export { TravelStyle } from '../enums/travel-style.enum';

export interface Trip {
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  budget: number | null;
  travelerCount: number;
  preferences: TripPreferences;
  status: TripStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripPreferences {
  interests: string[];
  travelStyle: TravelStyle;
}
