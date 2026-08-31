import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockHotelRecommendationRepository } from '../../../../test/mocks/hotel-recommendation-repository.mock';
import { createMockGeminiService } from '../../../../test/mocks/gemini-service.mock';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { RecommendHotelsUseCase } from './recommend-hotels.use-case';

const OWNER_ID = 'user-id-123';

describe('RecommendHotelsUseCase', () => {
  let useCase: RecommendHotelsUseCase;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;
  let mockHotelRepo: ReturnType<typeof createMockHotelRecommendationRepository>;
  let mockGemini: ReturnType<typeof createMockGeminiService>;

  beforeEach(() => {
    mockTripRepo = createMockTripRepository();
    mockHotelRepo = createMockHotelRecommendationRepository();
    mockGemini = createMockGeminiService();
    useCase = new RecommendHotelsUseCase(
      mockTripRepo,
      mockHotelRepo,
      mockGemini,
    );
    jest.clearAllMocks();
  });

  describe('validation', () => {
    it('should throw NotFoundException when trip does not exist', async () => {
      mockTripRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(
          'trip-123',
          { city: 'Tokyo', checkIn: '2026-09-15', checkOut: '2026-09-25' },
          OWNER_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not trip owner', async () => {
      mockTripRepo.findById.mockResolvedValue(
        createMockTrip({ userId: 'other-user' }),
      );

      await expect(
        useCase.execute(
          'trip-123',
          { city: 'Tokyo', checkIn: '2026-09-15', checkOut: '2026-09-25' },
          OWNER_ID,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ValidationException for missing city', async () => {
      mockTripRepo.findById.mockResolvedValue(createMockTrip());

      await expect(
        useCase.execute(
          'trip-123',
          { city: '', checkIn: '2026-09-15', checkOut: '2026-09-25' },
          OWNER_ID,
        ),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for missing check-in', async () => {
      mockTripRepo.findById.mockResolvedValue(createMockTrip());

      await expect(
        useCase.execute(
          'trip-123',
          { city: 'Tokyo', checkIn: '', checkOut: '2026-09-25' },
          OWNER_ID,
        ),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for missing check-out', async () => {
      mockTripRepo.findById.mockResolvedValue(createMockTrip());

      await expect(
        useCase.execute(
          'trip-123',
          { city: 'Tokyo', checkIn: '2026-09-15', checkOut: '' },
          OWNER_ID,
        ),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('successful generation', () => {
    const mockHotelResponse = {
      hotels: [
        {
          name: 'Hotel Zen Tokyo',
          city: 'Tokyo',
          country: 'Japan',
          latitude: 35.6812,
          longitude: 139.7671,
          pricePerNight: 120,
          currency: 'EUR',
          starRating: 4,
          amenities: ['wifi', 'breakfast'],
          bookingUrl: 'https://www.booking.com',
        },
      ],
    };

    beforeEach(() => {
      mockTripRepo.findById.mockResolvedValue(createMockTrip());
      mockGemini.generateStructuredOutput.mockResolvedValue(mockHotelResponse);
      mockHotelRepo.createMany.mockResolvedValue([
        {
          id: 'hotel-1',
          tripId: 'trip-123',
          name: 'Hotel Zen Tokyo',
          location: 'Tokyo, Japan',
          latitude: 35.6812,
          longitude: 139.7671,
          pricePerNight: 120,
          currency: 'EUR',
          rating: 4,
          amenities: ['wifi', 'breakfast'],
          bookingUrl: 'https://www.booking.com',
          isRecommended: true,
          createdAt: new Date(),
        },
      ]);
    });

    it('should call Gemini with correct prompt and schema', async () => {
      await useCase.execute(
        'trip-123',
        { city: 'Tokyo', checkIn: '2026-09-15', checkOut: '2026-09-25' },
        OWNER_ID,
      );

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Tokyo'),
        expect.objectContaining({ type: 'object' }),
      );
    });

    it('should save recommendations to database', async () => {
      await useCase.execute(
        'trip-123',
        { city: 'Tokyo', checkIn: '2026-09-15', checkOut: '2026-09-25' },
        OWNER_ID,
      );

      expect(mockHotelRepo.createMany).toHaveBeenCalledWith(
        'trip-123',
        expect.arrayContaining([
          expect.objectContaining({ name: 'Hotel Zen Tokyo' }),
        ]),
      );
    });

    it('should return saved recommendations', async () => {
      const result = await useCase.execute(
        'trip-123',
        { city: 'Tokyo', checkIn: '2026-09-15', checkOut: '2026-09-25' },
        OWNER_ID,
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Hotel Zen Tokyo');
    });
  });
});
