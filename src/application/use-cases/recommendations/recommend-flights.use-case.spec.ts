import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockFlightRecommendationRepository } from '../../../../test/mocks/flight-recommendation-repository.mock';
import { createMockGeminiService } from '../../../../test/mocks/gemini-service.mock';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { RecommendFlightsUseCase } from './recommend-flights.use-case';

const OWNER_ID = 'user-id-123';

describe('RecommendFlightsUseCase', () => {
  let useCase: RecommendFlightsUseCase;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;
  let mockFlightRepo: ReturnType<
    typeof createMockFlightRecommendationRepository
  >;
  let mockGemini: ReturnType<typeof createMockGeminiService>;

  beforeEach(() => {
    mockTripRepo = createMockTripRepository();
    mockFlightRepo = createMockFlightRecommendationRepository();
    mockGemini = createMockGeminiService();
    useCase = new RecommendFlightsUseCase(
      mockTripRepo,
      mockFlightRepo,
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
          { origin: 'MAD', destination: 'NRT', departureDate: '2026-09-15' },
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
          { origin: 'MAD', destination: 'NRT', departureDate: '2026-09-15' },
          OWNER_ID,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ValidationException for missing origin', async () => {
      mockTripRepo.findById.mockResolvedValue(createMockTrip());

      await expect(
        useCase.execute(
          'trip-123',
          { origin: '', destination: 'NRT', departureDate: '2026-09-15' },
          OWNER_ID,
        ),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for missing destination', async () => {
      mockTripRepo.findById.mockResolvedValue(createMockTrip());

      await expect(
        useCase.execute(
          'trip-123',
          { origin: 'MAD', destination: '', departureDate: '2026-09-15' },
          OWNER_ID,
        ),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for missing departure date', async () => {
      mockTripRepo.findById.mockResolvedValue(createMockTrip());

      await expect(
        useCase.execute(
          'trip-123',
          { origin: 'MAD', destination: 'NRT', departureDate: '' },
          OWNER_ID,
        ),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('successful generation', () => {
    const mockFlightResponse = {
      flights: [
        {
          airline: 'Iberia',
          origin: 'MAD',
          destination: 'NRT',
          departureDate: '2026-09-15',
          departureTime: '10:00',
          arrivalTime: '06:00',
          price: 850,
          currency: 'EUR',
          class: 'economy',
          stops: 0,
          durationMinutes: 720,
          bookingUrl: 'https://www.google.com/flights',
        },
      ],
    };

    beforeEach(() => {
      mockTripRepo.findById.mockResolvedValue(createMockTrip());
      mockGemini.generateStructuredOutput.mockResolvedValue(mockFlightResponse);
      mockFlightRepo.createMany.mockResolvedValue([
        {
          id: 'flight-1',
          tripId: 'trip-123',
          airline: 'Iberia',
          departure: 'MAD',
          arrival: 'NRT',
          departureTime: '10:00',
          arrivalTime: '06:00',
          price: 850,
          currency: 'EUR',
          bookingUrl: 'https://www.google.com/flights',
          notes: 'Class: economy | Direct | Duration: 12h 0m',
          isRecommended: true,
          createdAt: new Date(),
        },
      ]);
    });

    it('should call Gemini with correct prompt and schema', async () => {
      await useCase.execute(
        'trip-123',
        { origin: 'MAD', destination: 'NRT', departureDate: '2026-09-15' },
        OWNER_ID,
      );

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('MAD'),
        expect.objectContaining({ type: 'object' }),
      );
    });

    it('should save recommendations to database', async () => {
      await useCase.execute(
        'trip-123',
        { origin: 'MAD', destination: 'NRT', departureDate: '2026-09-15' },
        OWNER_ID,
      );

      expect(mockFlightRepo.createMany).toHaveBeenCalledWith(
        'trip-123',
        expect.arrayContaining([
          expect.objectContaining({ airline: 'Iberia', departure: 'MAD' }),
        ]),
      );
    });

    it('should return saved recommendations', async () => {
      const result = await useCase.execute(
        'trip-123',
        { origin: 'MAD', destination: 'NRT', departureDate: '2026-09-15' },
        OWNER_ID,
      );

      expect(result).toHaveLength(1);
      expect(result[0].airline).toBe('Iberia');
    });
  });
});
