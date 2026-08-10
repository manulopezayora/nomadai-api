import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDayPlanData,
  UpdateDayPlanData,
  DayPlanRepositoryPort,
} from '../../../domain/ports/repositories/day-plan.repository.port';
import { DayPlan } from '../../../domain/entities/day-plan.entity';
import { DayPlanMapper } from '../prisma/mappers/day-plan.mapper';

@Injectable()
export class PrismaDayPlanRepository extends DayPlanRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<DayPlan | null> {
    const dayPlan = await this.prisma.instance.dayPlan.findUnique({
      where: { id },
    });
    return dayPlan ? DayPlanMapper.toDomain(dayPlan) : null;
  }

  async findByTripId(tripId: string): Promise<DayPlan[]> {
    const dayPlans = await this.prisma.instance.dayPlan.findMany({
      where: { tripId },
      orderBy: { dayNumber: 'asc' },
    });
    return dayPlans.map((d) => DayPlanMapper.toDomain(d));
  }

  async findByTripIdAndDayNumber(
    tripId: string,
    dayNumber: number,
  ): Promise<DayPlan | null> {
    const dayPlan = await this.prisma.instance.dayPlan.findUnique({
      where: { tripId_dayNumber: { tripId, dayNumber } },
    });
    return dayPlan ? DayPlanMapper.toDomain(dayPlan) : null;
  }

  async countByTripId(tripId: string): Promise<number> {
    return this.prisma.instance.dayPlan.count({ where: { tripId } });
  }

  async create(data: CreateDayPlanData): Promise<DayPlan> {
    const prismaData = DayPlanMapper.toPrismaCreate(data);
    const dayPlan = await this.prisma.instance.dayPlan.create({
      data: prismaData,
    });
    return DayPlanMapper.toDomain(dayPlan);
  }

  async update(id: string, data: UpdateDayPlanData): Promise<DayPlan> {
    const prismaData = DayPlanMapper.toPrismaUpdate(
      data as Record<string, unknown>,
    );
    const dayPlan = await this.prisma.instance.dayPlan.update({
      where: { id },
      data: prismaData,
    });
    return DayPlanMapper.toDomain(dayPlan);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.instance.dayPlan.delete({ where: { id } });
  }
}
