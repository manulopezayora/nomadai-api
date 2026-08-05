import { Trip } from '../../entities/trip.entity';

export interface CreateTripData {
  userId: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  budget?: number;
  travelerCount?: number;
  preferences: {
    interests: string[];
    travelStyle: string;
  };
}

export interface UpdateTripData {
  title?: string;
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  travelerCount?: number;
  preferences?: {
    interests: string[];
    travelStyle: string;
  };
  status?: string;
}

export abstract class TripRepositoryPort {
  abstract findById(id: string): Promise<Trip | null>;
  abstract findByUserId(
    userId: string,
    offset: number,
    limit: number,
  ): Promise<Trip[]>;
  abstract countByUserId(userId: string): Promise<number>;
  abstract findAll(offset: number, limit: number): Promise<Trip[]>;
  abstract count(): Promise<number>;
  abstract create(data: CreateTripData): Promise<Trip>;
  abstract update(id: string, data: UpdateTripData): Promise<Trip>;
  abstract delete(id: string): Promise<void>;
}
