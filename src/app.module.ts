import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { UsersModule } from './infrastructure/users/users.module';
import { TripsModule } from './infrastructure/trips/trips.module';
import { DayPlansModule } from './infrastructure/day-plans/day-plans.module';
import { ActivitiesModule } from './infrastructure/activities/activities.module';
import { GeminiModule } from './infrastructure/ai/gemini.module';
import { RecommendationsModule } from './infrastructure/recommendations/recommendations.module';
import { envValidationSchema } from './shared/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    TripsModule,
    DayPlansModule,
    ActivitiesModule,
    GeminiModule,
    RecommendationsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
