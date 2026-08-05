import { BadRequestException } from '@nestjs/common';
import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { CreateTripUseCase } from './create-trip.use-case';

describe('CreateTripUseCase', () => {
  let useCase: CreateTripUseCase;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;

  beforeEach(() => {
    mockTripRepo = createMockTripRepository();
    useCase = new CreateTripUseCase(mockTripRepo);
  });

  describe('validation', () => {
    it('should throw BadRequestException for empty title', async () => {
      await expect(
        useCase.execute(
          {
            title: '',
            destination: 'Tokyo',
            startDate: '2026-09-15',
            endDate: '2026-09-25',
            interests: ['culture'],
          },
          'user-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty destination', async () => {
      await expect(
        useCase.execute(
          {
            title: 'Japan Trip',
            destination: '',
            startDate: '2026-09-15',
            endDate: '2026-09-25',
            interests: ['culture'],
          },
          'user-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for missing start date', async () => {
      await expect(
        useCase.execute(
          {
            title: 'Japan Trip',
            destination: 'Tokyo',
            startDate: '',
            endDate: '2026-09-25',
            interests: ['culture'],
          },
          'user-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for missing end date', async () => {
      await expect(
        useCase.execute(
          {
            title: 'Japan Trip',
            destination: 'Tokyo',
            startDate: '2026-09-15',
            endDate: '',
            interests: ['culture'],
          },
          'user-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty interests', async () => {
      await expect(
        useCase.execute(
          {
            title: 'Japan Trip',
            destination: 'Tokyo',
            startDate: '2026-09-15',
            endDate: '2026-09-25',
            interests: [],
          },
          'user-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid start date', async () => {
      await expect(
        useCase.execute(
          {
            title: 'Japan Trip',
            destination: 'Tokyo',
            startDate: 'not-a-date',
            endDate: '2026-09-25',
            interests: ['culture'],
          },
          'user-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for end date before start date', async () => {
      await expect(
        useCase.execute(
          {
            title: 'Japan Trip',
            destination: 'Tokyo',
            startDate: '2026-09-25',
            endDate: '2026-09-15',
            interests: ['culture'],
          },
          'user-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('successful creation', () => {
    beforeEach(() => {
      mockTripRepo.create.mockResolvedValue(createMockTrip());
    });

    it('should create trip with correct data', async () => {
      await useCase.execute(
        {
          title: 'Japan Trip',
          destination: 'Tokyo',
          startDate: '2026-09-15',
          endDate: '2026-09-25',
          interests: ['culture', 'food'],
          travelStyle: 'luxury',
          budget: 3000,
          travelerCount: 2,
        },
        'user-123',
      );

      expect(mockTripRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        title: 'Japan Trip',
        destination: 'Tokyo',
        startDate: new Date('2026-09-15'),
        endDate: new Date('2026-09-25'),
        budget: 3000,
        travelerCount: 2,
        preferences: {
          interests: ['culture', 'food'],
          travelStyle: 'luxury',
        },
      });
    });

    it('should default travelerCount to 1', async () => {
      await useCase.execute(
        {
          title: 'Solo Trip',
          destination: 'Paris',
          startDate: '2026-10-01',
          endDate: '2026-10-05',
          interests: ['art'],
        },
        'user-123',
      );

      expect(mockTripRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ travelerCount: 1 }),
      );
    });

    it('should default travelStyle to mid', async () => {
      await useCase.execute(
        {
          title: 'Trip',
          destination: 'London',
          startDate: '2026-11-01',
          endDate: '2026-11-05',
          interests: ['history'],
        },
        'user-123',
      );

      expect(mockTripRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          preferences: expect.objectContaining({ travelStyle: 'mid' }),
        }),
      );
    });

    it('should return the created trip', async () => {
      const trip = createMockTrip({ title: 'My Trip' });
      mockTripRepo.create.mockResolvedValue(trip);

      const result = await useCase.execute(
        {
          title: 'My Trip',
          destination: 'Berlin',
          startDate: '2026-12-01',
          endDate: '2026-12-10',
          interests: ['nightlife'],
        },
        'user-123',
      );

      expect(result).toEqual(trip);
    });
  });
});
