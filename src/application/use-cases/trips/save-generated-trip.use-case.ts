import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { SaveGeneratedTripDto } from '../../dto/save-generated-trip.dto';
import { Trip } from '../../../domain/entities/trip.entity';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { TravelStyle } from '../../../domain/enums/travel-style.enum';
import { TripMapper } from '../../../infrastructure/database/prisma/mappers/trip.mapper';

@Injectable()
export class SaveGeneratedTripUseCase {
  private readonly logger = new Logger(SaveGeneratedTripUseCase.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: SaveGeneratedTripDto, userId: string): Promise<Trip> {
    this.validate(dto);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    this.logger.debug(
      `Saving generated trip "${dto.title}" with ${dto.flights?.length ?? 0} flights, ${dto.hotels?.length ?? 0} hotels, ${dto.itinerary?.days?.length ?? 0} days`,
    );

    const result = await this.prisma.instance.$transaction(async (tx) => {
      const tripData = TripMapper.toPrismaCreate({
        userId,
        title: dto.title.trim(),
        destination: dto.destination.trim(),
        startDate,
        endDate,
        budget: dto.budget ?? undefined,
        travelerCount: dto.travelerCount ?? 1,
        preferences: {
          interests: dto.interests,
          travelStyle: dto.travelStyle ?? TravelStyle.MID,
        },
      });

      const trip = await tx.trip.create({ data: tripData });

      if (dto.flights?.length) {
        await tx.flightRecommendation.createMany({
          data: dto.flights.map((f) => ({
            tripId: trip.id,
            airline: f.airline,
            flightNumber: f.flightNumber ?? null,
            departure: f.departure,
            arrival: f.arrival,
            departureDate: f.departureDate ?? null,
            departureTime: f.departureTime ?? '',
            arrivalTime: f.arrivalTime ?? '',
            price: f.price ?? null,
            currency: f.currency ?? 'EUR',
            class: f.class ?? null,
            stops: f.stops ?? null,
            durationMinutes: f.durationMinutes ?? null,
            bookingUrl: f.bookingUrl ?? null,
            notes: f.notes ?? null,
            isRecommended: f.isRecommended ?? true,
          })),
        });
      }

      if (dto.hotels?.length) {
        await tx.hotelRecommendation.createMany({
          data: dto.hotels.map((h) => ({
            tripId: trip.id,
            name: h.name,
            location: h.location,
            neighborhood: h.neighborhood ?? null,
            latitude: h.latitude ?? null,
            longitude: h.longitude ?? null,
            pricePerNight: h.pricePerNight ?? null,
            originalPricePerNight: h.originalPricePerNight ?? null,
            currency: h.currency ?? 'EUR',
            rating: h.rating ?? null,
            reviewCount: h.reviewCount ?? null,
            amenities: h.amenities ?? [],
            imageUrl: h.imageUrl ?? null,
            bookingUrl: h.bookingUrl ?? null,
            isRecommended: h.isRecommended ?? true,
          })),
        });
      }

      if (dto.itinerary?.days?.length) {
        for (const day of dto.itinerary.days) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + day.dayNumber - 1);

          const dayPlan = await tx.dayPlan.create({
            data: {
              tripId: trip.id,
              dayNumber: day.dayNumber,
              date,
              title: day.title,
              notes: day.notes ?? null,
            },
          });

          if (day.activities?.length) {
            await tx.activity.createMany({
              data: day.activities.map((a, index) => ({
                dayPlanId: dayPlan.id,
                title: a.title,
                description: a.description ?? null,
                location: a.location ?? null,
                latitude: a.latitude ?? null,
                longitude: a.longitude ?? null,
                startTime: a.startTime ?? null,
                endTime: a.endTime ?? null,
                cost: a.cost ?? null,
                bookingUrl: a.bookingUrl ?? null,
                category: a.category ?? 'other',
                order: a.order ?? index + 1,
              })),
            });
          }
        }
      }

      return trip;
    });

    return TripMapper.toDomain(result);
  }

  private validate(dto: SaveGeneratedTripDto): void {
    if (!dto.title || dto.title.trim().length === 0) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Title is required',
      );
    }

    if (!dto.destination || dto.destination.trim().length === 0) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Destination is required',
      );
    }

    if (!dto.startDate) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Start date is required',
      );
    }

    if (!dto.endDate) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'End date is required',
      );
    }

    if (!dto.interests || dto.interests.length === 0) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'At least one interest is required',
      );
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (isNaN(startDate.getTime())) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Invalid start date format',
      );
    }

    if (isNaN(endDate.getTime())) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'Invalid end date format',
      );
    }

    if (endDate <= startDate) {
      throw new ValidationException(
        'VALIDATION_INVALID_PARAMS',
        'End date must be after start date',
      );
    }
  }
}
