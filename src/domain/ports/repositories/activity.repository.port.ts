import { Activity } from '../../entities/activity.entity';
import { ActivityCategory } from '../../enums/activity-category.enum';

export interface CreateActivityData {
  dayPlanId: string;
  title: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  startTime?: string;
  endTime?: string;
  cost?: number;
  bookingUrl?: string;
  category?: ActivityCategory;
  placeId?: string;
  order?: number;
}

export interface UpdateActivityData {
  title?: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  startTime?: string;
  endTime?: string;
  cost?: number;
  bookingUrl?: string;
  category?: ActivityCategory;
  placeId?: string;
  order?: number;
}

export abstract class ActivityRepositoryPort {
  abstract findById(id: string): Promise<Activity | null>;
  abstract findByDayPlanId(dayPlanId: string): Promise<Activity[]>;
  abstract countByDayPlanId(dayPlanId: string): Promise<number>;
  abstract create(data: CreateActivityData): Promise<Activity>;
  abstract update(id: string, data: UpdateActivityData): Promise<Activity>;
  abstract delete(id: string): Promise<void>;
}
