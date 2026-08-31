import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma/prisma.module';
import { TripsModule } from '../trips/trips.module';
import { DayPlansModule } from '../day-plans/day-plans.module';
import { ActivitiesModule } from '../activities/activities.module';
import { GeminiModule } from '../ai/gemini.module';
import { PrismaFlightRecommendationRepository } from '../database/repositories/prisma-flight-recommendation.repository';
import { PrismaHotelRecommendationRepository } from '../database/repositories/prisma-hotel-recommendation.repository';
import { FlightRecommendationRepositoryPort } from '../../domain/ports/repositories/flight-recommendation.repository.port';
import { HotelRecommendationRepositoryPort } from '../../domain/ports/repositories/hotel-recommendation.repository.port';
import { RecommendFlightsUseCase } from '../../application/use-cases/recommendations/recommend-flights.use-case';
import { RecommendHotelsUseCase } from '../../application/use-cases/recommendations/recommend-hotels.use-case';
import { RecommendItineraryUseCase } from '../../application/use-cases/recommendations/recommend-itinerary.use-case';
import { RecommendationsController } from '../../presentation/controllers/recommendations.controller';

@Module({
  imports: [
    PrismaModule,
    TripsModule,
    DayPlansModule,
    ActivitiesModule,
    GeminiModule,
  ],
  controllers: [RecommendationsController],
  providers: [
    {
      provide: FlightRecommendationRepositoryPort,
      useClass: PrismaFlightRecommendationRepository,
    },
    {
      provide: HotelRecommendationRepositoryPort,
      useClass: PrismaHotelRecommendationRepository,
    },
    RecommendFlightsUseCase,
    RecommendHotelsUseCase,
    RecommendItineraryUseCase,
  ],
})
export class RecommendationsModule {}
