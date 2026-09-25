import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { createMockGeminiService } from '../../../../test/mocks/gemini-service.mock';
import { GenerateItineraryPreviewUseCase } from './generate-itinerary-preview.use-case';
import { TravelStyle } from '../../../domain/enums/travel-style.enum';

describe('GenerateItineraryPreviewUseCase', () => {
  let useCase: GenerateItineraryPreviewUseCase;
  let mockGemini: ReturnType<typeof createMockGeminiService>;

  const mockTrip = {
    title: '5 Days in Rome',
    destination: 'Rome',
    startDate: '2026-10-01',
    endDate: '2026-10-06',
    interests: ['culture', 'food'],
    travelStyle: TravelStyle.MID,
    travelerCount: 1,
    budget: null,
  };

  beforeEach(() => {
    mockGemini = createMockGeminiService();
    useCase = new GenerateItineraryPreviewUseCase(mockGemini);
  });

  describe('validation', () => {
    it('should throw ValidationException when destination is missing', async () => {
      await expect(
        useCase.execute({
          trip: { ...mockTrip, destination: '' },
        }),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException when dates are missing', async () => {
      await expect(
        useCase.execute({
          trip: { ...mockTrip, startDate: '', endDate: '' },
        }),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException when end date is before start date', async () => {
      await expect(
        useCase.execute({
          trip: {
            ...mockTrip,
            startDate: '2026-10-06',
            endDate: '2026-10-01',
          },
        }),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('AI generation', () => {
    const mockItineraryResponse = {
      days: [
        {
          dayNumber: 1,
          title: 'Arrival in Rome',
          summary: 'Explore the Colosseum area',
          activities: [
            {
              title: 'Visit Colosseum',
              description: 'Tour the ancient amphitheater',
              category: 'sightseeing',
              startTime: '10:00',
              endTime: '12:00',
              locationName: 'Colosseum',
              latitude: 41.8902,
              longitude: 12.4922,
              costEstimate: 16,
              tips: 'Book tickets in advance',
            },
          ],
        },
        {
          dayNumber: 2,
          title: 'Vatican Day',
          summary: 'Visit Vatican Museums and St Peters',
          activities: [
            {
              title: 'Vatican Museums',
              description: 'Explore the art collections',
              category: 'culture',
              startTime: '09:00',
              endTime: '13:00',
              locationName: 'Vatican Museums',
              latitude: 41.9065,
              longitude: 12.4536,
              costEstimate: 17,
              tips: 'Go early to avoid crowds',
            },
          ],
        },
      ],
    };

    beforeEach(() => {
      mockGemini.generateStructuredOutput.mockResolvedValueOnce(
        mockItineraryResponse,
      );
    });

    it('should call Gemini once for itinerary generation', async () => {
      await useCase.execute({ trip: mockTrip });

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledTimes(1);
    });

    it('should call Gemini with a prompt containing trip details', async () => {
      await useCase.execute({ trip: mockTrip });

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Rome'),
        expect.any(Object),
      );
    });

    it('should return mapped itinerary without saving to DB', async () => {
      const result = await useCase.execute({ trip: mockTrip });

      expect(result.days).toHaveLength(2);
      expect(result.days[0]).toMatchObject({
        dayNumber: 1,
        title: 'Arrival in Rome',
      });
      expect(result.days[0].activities).toHaveLength(1);
      expect(result.days[0].activities[0]).toMatchObject({
        title: 'Visit Colosseum',
        category: 'sightseeing',
        latitude: 41.8902,
        longitude: 12.4922,
      });
    });

    it('should calculate days correctly from trip dates', async () => {
      await useCase.execute({ trip: mockTrip });

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('5 days'),
        expect.any(Object),
      );
    });
  });
});
