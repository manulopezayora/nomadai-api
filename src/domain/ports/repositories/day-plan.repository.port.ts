import { DayPlan } from '../../entities/day-plan.entity';

export interface CreateDayPlanData {
  tripId: string;
  dayNumber: number;
  date: Date;
  title?: string;
  notes?: string;
}

export interface UpdateDayPlanData {
  dayNumber?: number;
  date?: Date;
  title?: string;
  notes?: string;
}

export abstract class DayPlanRepositoryPort {
  abstract findById(id: string): Promise<DayPlan | null>;
  abstract findByTripId(tripId: string): Promise<DayPlan[]>;
  abstract findByTripIdAndDayNumber(
    tripId: string,
    dayNumber: number,
  ): Promise<DayPlan | null>;
  abstract countByTripId(tripId: string): Promise<number>;
  abstract create(data: CreateDayPlanData): Promise<DayPlan>;
  abstract update(id: string, data: UpdateDayPlanData): Promise<DayPlan>;
  abstract delete(id: string): Promise<void>;
}
