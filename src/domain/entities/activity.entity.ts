import { ActivityCategory } from '../enums/activity-category.enum';

export interface Activity {
  id: string;
  dayPlanId: string;
  title: string;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  startTime: string | null;
  endTime: string | null;
  cost: number | null;
  bookingUrl: string | null;
  category: ActivityCategory | null;
  placeId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
