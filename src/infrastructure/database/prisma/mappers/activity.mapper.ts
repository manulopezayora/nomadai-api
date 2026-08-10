import { Activity } from '../../../../domain/entities/activity.entity';
import { ActivityCategory } from '../../../../domain/enums/activity-category.enum';

interface PrismaActivity {
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
  category: string | null;
  placeId: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ActivityMapper {
  static toDomain(raw: PrismaActivity): Activity {
    return {
      id: raw.id,
      dayPlanId: raw.dayPlanId,
      title: raw.title,
      description: raw.description,
      location: raw.location,
      latitude: raw.latitude,
      longitude: raw.longitude,
      startTime: raw.startTime,
      endTime: raw.endTime,
      cost: raw.cost,
      bookingUrl: raw.bookingUrl,
      category: raw.category as ActivityCategory | null,
      placeId: raw.placeId,
      order: raw.order,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  static toPrismaCreate(data: {
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
    order: number;
  }) {
    return {
      dayPlanId: data.dayPlanId,
      title: data.title,
      description: data.description ?? null,
      location: data.location ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      cost: data.cost ?? null,
      bookingUrl: data.bookingUrl ?? null,
      category: data.category ?? null,
      placeId: data.placeId ?? null,
      order: data.order,
    };
  }

  static toPrismaUpdate(data: Record<string, unknown>) {
    const prismaData: Record<string, unknown> = {};

    if ('title' in data) prismaData.title = data.title;
    if ('description' in data) prismaData.description = data.description;
    if ('location' in data) prismaData.location = data.location;
    if ('latitude' in data) prismaData.latitude = data.latitude;
    if ('longitude' in data) prismaData.longitude = data.longitude;
    if ('startTime' in data) prismaData.startTime = data.startTime;
    if ('endTime' in data) prismaData.endTime = data.endTime;
    if ('cost' in data) prismaData.cost = data.cost;
    if ('bookingUrl' in data) prismaData.bookingUrl = data.bookingUrl;
    if ('category' in data) prismaData.category = data.category;
    if ('placeId' in data) prismaData.placeId = data.placeId;
    if ('order' in data) prismaData.order = data.order;

    return prismaData;
  }
}
