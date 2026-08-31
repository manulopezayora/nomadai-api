import { ActivityCategory } from '../../domain/enums/activity-category.enum';

interface GeminiItineraryActivity {
  title: string;
  description?: string;
  category: string;
  startTime?: string;
  endTime?: string;
  locationName?: string;
  latitude: number;
  longitude: number;
  costEstimate?: number;
  tips?: string;
}

interface GeminiItineraryDay {
  dayNumber: number;
  title: string;
  summary?: string;
  activities: GeminiItineraryActivity[];
}

export interface ItineraryResponse {
  days: GeminiItineraryDay[];
}

export interface MappedDayPlan {
  dayNumber: number;
  title: string;
  notes: string | null;
}

export interface MappedActivity {
  dayNumber: number;
  title: string;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  startTime: string | null;
  endTime: string | null;
  cost: number | null;
  bookingUrl: string | null;
  category: ActivityCategory;
  order: number;
}

export class ItineraryMapper {
  static toDayPlans(response: ItineraryResponse): MappedDayPlan[] {
    return response.days.map((day) => ({
      dayNumber: day.dayNumber,
      title: day.title,
      notes: day.summary ?? null,
    }));
  }

  static toActivities(response: ItineraryResponse): MappedActivity[] {
    const activities: MappedActivity[] = [];

    for (const day of response.days) {
      day.activities.forEach((activity, index) => {
        activities.push({
          dayNumber: day.dayNumber,
          title: activity.title,
          description:
            [activity.description, activity.tips]
              .filter(Boolean)
              .join('\nTips: ') || null,
          location: activity.locationName ?? null,
          latitude: activity.latitude ?? null,
          longitude: activity.longitude ?? null,
          startTime: activity.startTime ?? null,
          endTime: activity.endTime ?? null,
          cost: activity.costEstimate ?? null,
          bookingUrl: null,
          category: ItineraryMapper.mapCategory(activity.category),
          order: index + 1,
        });
      });
    }

    return activities;
  }

  private static mapCategory(category: string): ActivityCategory {
    const normalized = category.toLowerCase().replace(/[\s-]/g, '_');
    const values = Object.values(ActivityCategory) as string[];
    if (values.includes(normalized)) {
      return normalized as ActivityCategory;
    }
    return ActivityCategory.OTHER;
  }
}
