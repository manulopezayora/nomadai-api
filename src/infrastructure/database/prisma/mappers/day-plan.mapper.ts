import { DayPlan } from '../../../../domain/entities/day-plan.entity';

interface PrismaDayPlan {
  id: string;
  tripId: string;
  dayNumber: number;
  date: Date;
  title: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class DayPlanMapper {
  static toDomain(raw: PrismaDayPlan): DayPlan {
    return {
      id: raw.id,
      tripId: raw.tripId,
      dayNumber: raw.dayNumber,
      date: raw.date,
      title: raw.title,
      notes: raw.notes,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  static toPrismaCreate(data: {
    tripId: string;
    dayNumber: number;
    date: Date;
    title?: string;
    notes?: string;
  }) {
    return {
      tripId: data.tripId,
      dayNumber: data.dayNumber,
      date: data.date,
      title: data.title ?? null,
      notes: data.notes ?? null,
    };
  }

  static toPrismaUpdate(data: Record<string, unknown>) {
    const prismaData: Record<string, unknown> = {};

    if ('dayNumber' in data) prismaData.dayNumber = data.dayNumber;
    if ('date' in data) prismaData.date = data.date;
    if ('title' in data) prismaData.title = data.title;
    if ('notes' in data) prismaData.notes = data.notes;

    return prismaData;
  }
}
