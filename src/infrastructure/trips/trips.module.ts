import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma/prisma.module';
import { GeminiModule } from '../ai/gemini.module';
import { PrismaTripRepository } from '../database/repositories/prisma-trip.repository';
import { TripRepositoryPort } from '../../domain/ports/repositories/trip.repository.port';
import { CreateTripUseCase } from '../../application/use-cases/trips/create-trip.use-case';
import { GenerateTripUseCase } from '../../application/use-cases/trips/generate-trip.use-case';
import { GetTripUseCase } from '../../application/use-cases/trips/get-trip.use-case';
import { ListTripsUseCase } from '../../application/use-cases/trips/list-trips.use-case';
import { ListAllTripsUseCase } from '../../application/use-cases/trips/list-all-trips.use-case';
import { UpdateTripUseCase } from '../../application/use-cases/trips/update-trip.use-case';
import { DeleteTripUseCase } from '../../application/use-cases/trips/delete-trip.use-case';
import { TripsController } from '../../presentation/controllers/trips.controller';

@Module({
  imports: [PrismaModule, GeminiModule],
  controllers: [TripsController],
  providers: [
    { provide: TripRepositoryPort, useClass: PrismaTripRepository },
    CreateTripUseCase,
    GenerateTripUseCase,
    GetTripUseCase,
    ListTripsUseCase,
    ListAllTripsUseCase,
    UpdateTripUseCase,
    DeleteTripUseCase,
  ],
  exports: [TripRepositoryPort],
})
export class TripsModule {}
