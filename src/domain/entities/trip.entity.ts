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
  travelStyle: 'budget' | 'mid' | 'luxury';
}

export type TripStatus = 'planning' | 'active' | 'completed';
