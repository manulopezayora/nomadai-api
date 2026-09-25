import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { createMockGeminiService } from '../../../../test/mocks/gemini-service.mock';
import { GenerateTripUseCase } from './generate-trip.use-case';

describe('GenerateTripUseCase', () => {
  let useCase: GenerateTripUseCase;
  let mockGemini: ReturnType<typeof createMockGeminiService>;

  beforeEach(() => {
    mockGemini = createMockGeminiService();
    useCase = new GenerateTripUseCase(mockGemini);
  });

  describe('validation', () => {
    it('should throw ValidationException for empty prompt', async () => {
      await expect(useCase.execute({ prompt: '' })).rejects.toThrow(
        ValidationException,
      );
    });

    it('should throw ValidationException for prompt shorter than 10 chars', async () => {
      await expect(useCase.execute({ prompt: 'Japan' })).rejects.toThrow(
        ValidationException,
      );
    });
  });

  describe('AI generation', () => {
    const mockTripResponse = {
      title: '10 Days in Japan',
      destination: 'Japan',
      startDate: '2026-09-15',
      endDate: '2026-09-25',
      travelerCount: 1,
      interests: ['culture', 'food'],
      travelStyle: 'mid',
      budget: null,
    };

    beforeEach(() => {
      mockGemini.generateStructuredOutput.mockResolvedValueOnce(
        mockTripResponse,
      );
    });

    it('should call Gemini once for trip parsing', async () => {
      await useCase.execute({ prompt: '10 days in Japan, culture and relax' });

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledTimes(1);
    });

    it('should call trip Gemini with the user prompt', async () => {
      await useCase.execute({ prompt: '10 days in Japan, culture and relax' });

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('10 days in Japan, culture and relax'),
        expect.any(Object),
      );
    });

    it('should return trip preview without saving to DB', async () => {
      const result = await useCase.execute({
        prompt: '10 days in Japan, culture and relax',
      });

      expect(result).toEqual({
        trip: {
          title: '10 Days in Japan',
          destination: 'Japan',
          startDate: '2026-09-15',
          endDate: '2026-09-25',
          budget: null,
          travelerCount: 1,
          interests: ['culture', 'food'],
          travelStyle: 'mid',
        },
      });
    });

    it('should handle budget from Gemini response', async () => {
      mockGemini.generateStructuredOutput.mockReset().mockResolvedValueOnce({
        ...mockTripResponse,
        budget: 5000,
        travelStyle: 'luxury',
      });

      const result = await useCase.execute({
        prompt: 'Luxury 10 days in Japan for 2, budget 5000 EUR',
      });

      expect(result.trip.budget).toBe(5000);
      expect(result.trip.travelStyle).toBe('luxury');
    });

    it('should throw ValidationException when destination cannot be extracted', async () => {
      mockGemini.generateStructuredOutput.mockReset().mockResolvedValueOnce({
        title: '',
        destination: '',
        startDate: '2026-09-15',
        endDate: '2026-09-25',
        travelerCount: 1,
        interests: ['culture'],
        travelStyle: 'mid',
      });

      await expect(
        useCase.execute({ prompt: 'I want to go somewhere nice for a week' }),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException when end date is before start date', async () => {
      mockGemini.generateStructuredOutput.mockReset().mockResolvedValueOnce({
        title: 'Quick Trip',
        destination: 'Paris',
        startDate: '2026-09-25',
        endDate: '2026-09-15',
        travelerCount: 1,
        interests: ['culture'],
        travelStyle: 'mid',
      });

      await expect(
        useCase.execute({ prompt: 'Quick trip to Paris next week' }),
      ).rejects.toThrow(ValidationException);
    });
  });
});
