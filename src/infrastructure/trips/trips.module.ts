import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma/prisma.module';
import { PrismaTripRepository } from '../database/repositories/prisma-trip.repository';
import { TripRepositoryPort } from '../../domain/ports/repositories/trip.repository.port';
import { CreateTripUseCase } from '../../application/use-cases/trips/create-trip.use-case';
import { GetTripUseCase } from '../../application/use-cases/trips/get-trip.use-case';
import { ListTripsUseCase } from '../../application/use-cases/trips/list-trips.use-case';
import { UpdateTripUseCase } from '../../application/use-cases/trips/update-trip.use-case';
import { DeleteTripUseCase } from '../../application/use-cases/trips/delete-trip.use-case';
import { TripsController } from '../../presentation/controllers/trips.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TripsController],
  providers: [
    { provide: TripRepositoryPort, useClass: PrismaTripRepository },
    CreateTripUseCase,
    GetTripUseCase,
    ListTripsUseCase,
    UpdateTripUseCase,
    DeleteTripUseCase,
  ],
  exports: [TripRepositoryPort],
})
export class TripsModule {}
