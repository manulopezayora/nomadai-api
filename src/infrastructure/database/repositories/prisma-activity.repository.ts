import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateActivityData,
  UpdateActivityData,
  ActivityRepositoryPort,
} from '../../../domain/ports/repositories/activity.repository.port';
import { Activity } from '../../../domain/entities/activity.entity';
import { ActivityMapper } from '../prisma/mappers/activity.mapper';

@Injectable()
export class PrismaActivityRepository extends ActivityRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Activity | null> {
    const activity = await this.prisma.instance.activity.findUnique({
      where: { id },
    });
    return activity ? ActivityMapper.toDomain(activity) : null;
  }

  async findByDayPlanId(dayPlanId: string): Promise<Activity[]> {
    const activities = await this.prisma.instance.activity.findMany({
      where: { dayPlanId },
      orderBy: { order: 'asc' },
    });
    return activities.map((a) => ActivityMapper.toDomain(a));
  }

  async countByDayPlanId(dayPlanId: string): Promise<number> {
    return this.prisma.instance.activity.count({ where: { dayPlanId } });
  }

  async create(data: CreateActivityData): Promise<Activity> {
    const count = await this.countByDayPlanId(data.dayPlanId);
    const prismaData = ActivityMapper.toPrismaCreate({
      dayPlanId: data.dayPlanId,
      title: data.title,
      description: data.description,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      startTime: data.startTime,
      endTime: data.endTime,
      cost: data.cost,
      bookingUrl: data.bookingUrl,
      category: data.category,
      placeId: data.placeId,
      order: data.order ?? count + 1,
    });
    const activity = await this.prisma.instance.activity.create({
      data: prismaData,
    });
    return ActivityMapper.toDomain(activity);
  }

  async update(id: string, data: UpdateActivityData): Promise<Activity> {
    const prismaData = ActivityMapper.toPrismaUpdate(
      data as Record<string, unknown>,
    );
    const activity = await this.prisma.instance.activity.update({
      where: { id },
      data: prismaData,
    });
    return ActivityMapper.toDomain(activity);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.instance.activity.delete({ where: { id } });
  }
}
