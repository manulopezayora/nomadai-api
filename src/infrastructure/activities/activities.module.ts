import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma/prisma.module';
import { PrismaActivityRepository } from '../database/repositories/prisma-activity.repository';
import { ActivityRepositoryPort } from '../../domain/ports/repositories/activity.repository.port';
import { CreateActivityUseCase } from '../../application/use-cases/activities/create-activity.use-case';
import { UpdateActivityUseCase } from '../../application/use-cases/activities/update-activity.use-case';
import { DeleteActivityUseCase } from '../../application/use-cases/activities/delete-activity.use-case';
import { ActivitiesController } from '../../presentation/controllers/activities.controller';
import { DayPlansModule } from '../day-plans/day-plans.module';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [PrismaModule, DayPlansModule, TripsModule],
  controllers: [ActivitiesController],
  providers: [
    { provide: ActivityRepositoryPort, useClass: PrismaActivityRepository },
    CreateActivityUseCase,
    UpdateActivityUseCase,
    DeleteActivityUseCase,
  ],
  exports: [ActivityRepositoryPort],
})
export class ActivitiesModule {}
