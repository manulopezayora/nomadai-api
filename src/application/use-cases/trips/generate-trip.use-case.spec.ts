import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { createMockTripRepository } from '../../../../test/mocks/trip-repository.mock';
import { createMockGeminiService } from '../../../../test/mocks/gemini-service.mock';
import { createMockTrip } from '../../../../test/mocks/trip.factory';
import { GenerateTripUseCase } from './generate-trip.use-case';
import { TravelStyle } from '../../../domain/enums/travel-style.enum';

describe('GenerateTripUseCase', () => {
  let useCase: GenerateTripUseCase;
  let mockTripRepo: ReturnType<typeof createMockTripRepository>;
  let mockGemini: ReturnType<typeof createMockGeminiService>;

  beforeEach(() => {
    mockTripRepo = createMockTripRepository();
    mockGemini = createMockGeminiService();
    useCase = new GenerateTripUseCase(mockTripRepo, mockGemini);
  });

  describe('validation', () => {
    it('should throw ValidationException for empty prompt', async () => {
      await expect(useCase.execute({ prompt: '' }, 'user-123')).rejects.toThrow(
        ValidationException,
      );
    });

    it('should throw ValidationException for prompt shorter than 10 chars', async () => {
      await expect(
        useCase.execute({ prompt: 'Japan' }, 'user-123'),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('AI parsing', () => {
    beforeEach(() => {
      mockGemini.generateStructuredOutput.mockResolvedValue({
        title: '10 Days in Japan',
        destination: 'Japan',
        startDate: '2026-09-15',
        endDate: '2026-09-25',
        travelerCount: 1,
        interests: ['culture', 'food'],
        travelStyle: 'mid',
        budget: null,
      });
      mockTripRepo.create.mockResolvedValue(createMockTrip());
    });

    it('should call Gemini with the user prompt', async () => {
      await useCase.execute(
        { prompt: '10 days in Japan, culture and relax' },
        'user-123',
      );

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('10 days in Japan, culture and relax'),
        expect.any(Object),
      );
    });

    it('should create trip with parsed data from Gemini', async () => {
      await useCase.execute(
        { prompt: '10 days in Japan, culture and relax' },
        'user-123',
      );

      expect(mockTripRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        title: '10 Days in Japan',
        destination: 'Japan',
        startDate: new Date('2026-09-15'),
        endDate: new Date('2026-09-25'),
        budget: undefined,
        travelerCount: 1,
        preferences: {
          interests: ['culture', 'food'],
          travelStyle: TravelStyle.MID,
        },
      });
    });

    it('should handle budget from Gemini response', async () => {
      mockGemini.generateStructuredOutput.mockResolvedValue({
        title: 'Luxury Japan',
        destination: 'Japan',
        startDate: '2026-09-15',
        endDate: '2026-09-25',
        travelerCount: 2,
        interests: ['culture', 'luxury'],
        travelStyle: 'luxury',
        budget: 5000,
      });

      await useCase.execute(
        { prompt: 'Luxury 10 days in Japan for 2, budget 5000 EUR' },
        'user-123',
      );

      expect(mockTripRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ budget: 5000 }),
      );
    });

    it('should return the created trip', async () => {
      const trip = createMockTrip({ title: '10 Days in Japan' });
      mockTripRepo.create.mockResolvedValue(trip);

      const result = await useCase.execute(
        { prompt: '10 days in Japan, culture and relax' },
        'user-123',
      );

      expect(result).toEqual(trip);
    });
  });
});
