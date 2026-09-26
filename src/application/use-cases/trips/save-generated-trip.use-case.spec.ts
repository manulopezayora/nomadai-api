import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { ActivityCategory } from '../../../domain/enums/activity-category.enum';
import { SaveGeneratedTripDto } from '../../dto/save-generated-trip.dto';

const mockTrip = {
  id: 'trip-generated-123',
  userId: 'user-123',
  title: '10 Days in Japan',
  destination: 'Japan',
  startDate: new Date('2026-09-15'),
  endDate: new Date('2026-09-25'),
  budget: null,
  travelerCount: 1,
  preferences: JSON.stringify({
    interests: ['culture', 'food'],
    travelStyle: 'mid',
  }),
  status: 'PLANNING',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTx = {
  trip: { create: jest.fn().mockResolvedValue(mockTrip) },
  flightRecommendation: {
    createMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  hotelRecommendation: {
    createMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  dayPlan: {
    create: jest.fn().mockResolvedValue({
      id: 'dayplan-1',
      tripId: 'trip-generated-123',
      dayNumber: 1,
      date: new Date('2026-09-15'),
      title: 'Arrival in Tokyo',
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  },
  activity: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
};

const mockPrismaInstance = {
  $transaction: jest
    .fn()
    .mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) => {
      return fn(mockTx);
    }),
};

jest.mock('../../../infrastructure/database/prisma/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    instance: mockPrismaInstance,
  })),
}));

import { SaveGeneratedTripUseCase } from './save-generated-trip.use-case';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

describe('SaveGeneratedTripUseCase', () => {
  let useCase: SaveGeneratedTripUseCase;
  let prismaService: PrismaService;

  const validDto: SaveGeneratedTripDto = {
    title: '10 Days in Japan',
    destination: 'Japan',
    startDate: '2026-09-15',
    endDate: '2026-09-25',
    travelerCount: 1,
    interests: ['culture', 'food'],
    travelStyle: 'mid' as never,
    flights: [
      {
        airline: 'Japan Airlines',
        departure: 'MAD',
        arrival: 'NRT',
        departureDate: '2026-09-15',
        departureTime: '10:00',
        arrivalTime: '06:30',
        price: 850,
        currency: 'EUR',
        class: 'economy',
        stops: 0,
        durationMinutes: 750,
        bookingUrl: 'https://www.google.com/flights',
      },
    ],
    hotels: [
      {
        name: 'Shinjuku Granbell Hotel',
        location: 'Tokyo, Japan',
        neighborhood: 'Shinjuku',
        latitude: 35.6938,
        longitude: 139.7034,
        pricePerNight: 95,
        originalPricePerNight: 120,
        currency: 'EUR',
        rating: 4,
        reviewCount: 1500,
        amenities: ['wifi', 'restaurant'],
        imageUrl: 'https://example.com/hotel.jpg',
        bookingUrl: 'https://www.booking.com',
      },
    ],
    itinerary: {
      days: [
        {
          dayNumber: 1,
          title: 'Arrival in Tokyo',
          activities: [
            {
              title: 'Arrive at Narita Airport',
              description: 'Land and take train to hotel',
              location: 'Narita Airport',
              latitude: 35.7647,
              longitude: 140.3864,
              startTime: '07:00',
              endTime: '09:00',
              cost: 30,
              category: ActivityCategory.TRANSPORT,
              order: 1,
            },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaService = new (
      PrismaService as jest.MockedClass<typeof PrismaService>
    )({} as never);
    useCase = new SaveGeneratedTripUseCase(prismaService);
  });

  describe('validation', () => {
    it('should throw ValidationException for empty title', async () => {
      await expect(
        useCase.execute({ ...validDto, title: '' }, 'user-123'),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for empty destination', async () => {
      await expect(
        useCase.execute({ ...validDto, destination: '' }, 'user-123'),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for missing start date', async () => {
      await expect(
        useCase.execute({ ...validDto, startDate: '' }, 'user-123'),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for missing end date', async () => {
      await expect(
        useCase.execute({ ...validDto, endDate: '' }, 'user-123'),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for empty interests', async () => {
      await expect(
        useCase.execute({ ...validDto, interests: [] }, 'user-123'),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for end date before start date', async () => {
      await expect(
        useCase.execute(
          { ...validDto, startDate: '2026-09-25', endDate: '2026-09-15' },
          'user-123',
        ),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('successful save', () => {
    it('should create trip in a transaction', async () => {
      await useCase.execute(validDto, 'user-123');

      expect(mockPrismaInstance.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should create trip with correct data', async () => {
      await useCase.execute(validDto, 'user-123');

      expect(mockTx.trip.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          title: '10 Days in Japan',
          destination: 'Japan',
        }),
      });
    });

    it('should save flights when provided', async () => {
      await useCase.execute(validDto, 'user-123');

      expect(mockTx.flightRecommendation.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ airline: 'Japan Airlines' }),
        ]),
      });
    });

    it('should save hotels when provided', async () => {
      await useCase.execute(validDto, 'user-123');

      expect(mockTx.hotelRecommendation.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'Shinjuku Granbell Hotel' }),
        ]),
      });
    });

    it('should save itinerary days and activities when provided', async () => {
      await useCase.execute(validDto, 'user-123');

      expect(mockTx.dayPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          dayNumber: 1,
          title: 'Arrival in Tokyo',
        }),
      });

      expect(mockTx.activity.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ title: 'Arrive at Narita Airport' }),
        ]),
      });
    });

    it('should handle trip without flights, hotels or itinerary', async () => {
      const minimalDto: SaveGeneratedTripDto = {
        title: 'Simple Trip',
        destination: 'Paris',
        startDate: '2026-10-01',
        endDate: '2026-10-05',
        interests: ['art'],
      };

      await useCase.execute(minimalDto, 'user-123');

      expect(mockPrismaInstance.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should default travelerCount to 1', async () => {
      const dtoWithoutTravelers = { ...validDto };
      delete dtoWithoutTravelers.travelerCount;

      await useCase.execute(dtoWithoutTravelers, 'user-123');

      expect(mockTx.trip.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ travelerCount: 1 }),
      });
    });
  });
});
