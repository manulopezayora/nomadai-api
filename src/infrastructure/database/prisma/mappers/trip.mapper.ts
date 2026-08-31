import {
  Trip,
  TripPreferences,
  TripWithDetails,
} from '../../../../domain/entities/trip.entity';
import { TripStatus } from '../../../../domain/enums/trip-status.enum';
import { TravelStyle } from '../../../../domain/enums/travel-style.enum';
import { DayPlanMapper } from './day-plan.mapper';
import { ActivityMapper } from './activity.mapper';

interface PrismaTrip {
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  budget: number | null;
  travelerCount: number;
  preferences: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaDayPlanWithActivities {
  id: string;
  tripId: string;
  dayNumber: number;
  date: Date;
  title: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  activities: Array<{
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
  }>;
}

interface PrismaTripWithDetails extends PrismaTrip {
  dayPlans: PrismaDayPlanWithActivities[];
}

export class TripMapper {
  static toDomain(raw: PrismaTrip): Trip {
    const prefs = raw.preferences as Record<string, unknown>;
    const interests = Array.isArray(prefs?.interests)
      ? (prefs.interests as string[])
      : [];
    const travelStyle = (prefs?.travelStyle as TravelStyle) ?? TravelStyle.MID;

    return {
      id: raw.id,
      userId: raw.userId,
      title: raw.title,
      destination: raw.destination,
      startDate: raw.startDate,
      endDate: raw.endDate,
      budget: raw.budget,
      travelerCount: raw.travelerCount,
      preferences: { interests, travelStyle },
      status: raw.status as TripStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  static toDomainWithDetails(raw: PrismaTripWithDetails): TripWithDetails {
    const trip = TripMapper.toDomain(raw);

    const dayPlans = raw.dayPlans.map((dayPlan) => ({
      ...DayPlanMapper.toDomain(dayPlan),
      activities: dayPlan.activities.map((activity) =>
        ActivityMapper.toDomain(activity),
      ),
    }));

    return { ...trip, dayPlans };
  }

  static toPrismaCreate(data: {
    userId: string;
    title: string;
    destination: string;
    startDate: Date;
    endDate: Date;
    budget?: number;
    travelerCount: number;
    preferences: TripPreferences;
  }) {
    return {
      userId: data.userId,
      title: data.title,
      destination: data.destination,
      startDate: data.startDate,
      endDate: data.endDate,
      budget: data.budget ?? null,
      travelerCount: data.travelerCount,
      preferences: {
        interests: data.preferences.interests,
        travelStyle: data.preferences.travelStyle,
      },
    };
  }

  static toPrismaUpdate(data: Record<string, unknown>) {
    const prismaData: Record<string, unknown> = {};

    if ('title' in data) prismaData.title = data.title;
    if ('destination' in data) prismaData.destination = data.destination;
    if ('startDate' in data) prismaData.startDate = data.startDate;
    if ('endDate' in data) prismaData.endDate = data.endDate;
    if ('budget' in data) prismaData.budget = data.budget;
    if ('travelerCount' in data) prismaData.travelerCount = data.travelerCount;
    if ('status' in data) prismaData.status = data.status;
    if ('preferences' in data) prismaData.preferences = data.preferences;

    return prismaData;
  }
}
