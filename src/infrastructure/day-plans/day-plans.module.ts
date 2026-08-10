import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma/prisma.module';
import { PrismaDayPlanRepository } from '../database/repositories/prisma-day-plan.repository';
import { DayPlanRepositoryPort } from '../../domain/ports/repositories/day-plan.repository.port';
import { CreateDayPlanUseCase } from '../../application/use-cases/day-plans/create-day-plan.use-case';
import { UpdateDayPlanUseCase } from '../../application/use-cases/day-plans/update-day-plan.use-case';
import { DeleteDayPlanUseCase } from '../../application/use-cases/day-plans/delete-day-plan.use-case';
import { DayPlansController } from '../../presentation/controllers/day-plans.controller';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [PrismaModule, TripsModule],
  controllers: [DayPlansController],
  providers: [
    { provide: DayPlanRepositoryPort, useClass: PrismaDayPlanRepository },
    CreateDayPlanUseCase,
    UpdateDayPlanUseCase,
    DeleteDayPlanUseCase,
  ],
  exports: [DayPlanRepositoryPort],
})
export class DayPlansModule {}
