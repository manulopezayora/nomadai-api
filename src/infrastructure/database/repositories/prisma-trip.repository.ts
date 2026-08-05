import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTripData,
  UpdateTripData,
  TripRepositoryPort,
} from '../../../domain/ports/repositories/trip.repository.port';
import { Trip } from '../../../domain/entities/trip.entity';
import { TripMapper } from '../prisma/mappers/trip.mapper';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */

@Injectable()
export class PrismaTripRepository extends TripRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Trip | null> {
    const trip = await this.prisma.instance.trip.findUnique({ where: { id } });
    return trip ? TripMapper.toDomain(trip) : null;
  }

  async findByUserId(userId: string): Promise<Trip[]> {
    const trips = await this.prisma.instance.trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return trips.map((t) => TripMapper.toDomain(t as any));
  }

  async create(data: CreateTripData): Promise<Trip> {
    const trip = await this.prisma.instance.trip.create({
      data: TripMapper.toPrismaCreate({
        userId: data.userId,
        title: data.title,
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate,
        budget: data.budget,
        travelerCount: data.travelerCount ?? 1,
        preferences: {
          interests: data.preferences.interests,
          travelStyle: data.preferences.travelStyle as
            'budget' | 'mid' | 'luxury',
        },
      }) as any,
    });
    return TripMapper.toDomain(trip);
  }

  async update(id: string, data: UpdateTripData): Promise<Trip> {
    const trip = await this.prisma.instance.trip.update({
      where: { id },
      data: TripMapper.toPrismaUpdate(data as Record<string, unknown>),
    });
    return TripMapper.toDomain(trip);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.instance.trip.delete({ where: { id } });
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
