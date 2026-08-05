import { Trip, TripPreferences } from '../../../../domain/entities/trip.entity';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RawTrip {
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  budget: number | null;
  travelerCount: number;
  preferences: any;
  status: any;
  createdAt: Date;
  updatedAt: Date;
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export class TripMapper {
  static toDomain(raw: RawTrip): Trip {
    const prefs = raw.preferences as Record<string, unknown>;
    const interests = Array.isArray(prefs?.interests)
      ? (prefs.interests as string[])
      : [];
    const travelStyle = (prefs?.travelStyle as string) ?? 'mid';

    return {
      id: raw.id,
      userId: raw.userId,
      title: raw.title,
      destination: raw.destination,
      startDate: raw.startDate,
      endDate: raw.endDate,
      budget: raw.budget,
      travelerCount: raw.travelerCount,
      preferences: { interests, travelStyle } as TripPreferences,
      status: raw.status as Trip['status'],
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
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
      status: 'planning',
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
