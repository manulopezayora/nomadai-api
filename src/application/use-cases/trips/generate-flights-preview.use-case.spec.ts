import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { createMockGeminiService } from '../../../../test/mocks/gemini-service.mock';
import { GenerateFlightsPreviewUseCase } from './generate-flights-preview.use-case';
import { TravelStyle } from '../../../domain/enums/travel-style.enum';

describe('GenerateFlightsPreviewUseCase', () => {
  let useCase: GenerateFlightsPreviewUseCase;
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
    useCase = new GenerateFlightsPreviewUseCase(mockGemini);
  });

  describe('validation', () => {
    it('should throw ValidationException when departureHint is missing', async () => {
      await expect(
        useCase.execute({
          trip: mockTrip,
          departureHint: '',
          departureDate: '2026-10-01',
        }),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException when departureDate is missing', async () => {
      await expect(
        useCase.execute({
          trip: mockTrip,
          departureHint: 'Madrid',
          departureDate: '',
        }),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('AI generation', () => {
    const mockFlightsResponse = {
      flights: [
        {
          airline: 'Iberia',
          flightNumber: 'IB3240',
          origin: 'MAD',
          destination: 'FCO',
          departureDate: '2026-10-01',
          departureTime: '08:30',
          arrivalTime: '11:00',
          price: 280,
          currency: 'EUR',
          class: 'economy',
          stops: 0,
          durationMinutes: 150,
          bookingUrl: 'https://www.google.com/flights',
        },
        {
          airline: 'Ryanair',
          flightNumber: 'FR1234',
          origin: 'MAD',
          destination: 'FCO',
          departureDate: '2026-10-01',
          departureTime: '14:00',
          arrivalTime: '17:30',
          price: 85,
          currency: 'EUR',
          class: 'economy',
          stops: 0,
          durationMinutes: 150,
          bookingUrl: 'https://www.google.com/flights',
        },
      ],
    };

    beforeEach(() => {
      mockGemini.generateStructuredOutput.mockResolvedValueOnce(
        mockFlightsResponse,
      );
    });

    it('should call Gemini once for flights generation', async () => {
      await useCase.execute({
        trip: mockTrip,
        departureHint: 'Madrid',
        departureDate: '2026-10-01',
      });

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledTimes(1);
    });

    it('should call Gemini with a prompt containing departure and destination', async () => {
      await useCase.execute({
        trip: mockTrip,
        departureHint: 'Madrid',
        departureDate: '2026-10-01',
      });

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Madrid'),
        expect.any(Object),
      );
    });

    it('should return mapped flights without saving to DB', async () => {
      const result = await useCase.execute({
        trip: mockTrip,
        departureHint: 'Madrid',
        departureDate: '2026-10-01',
      });

      expect(result.flights).toHaveLength(2);
      expect(result.flights[0]).toMatchObject({
        airline: 'Iberia',
        departure: 'MAD',
        arrival: 'FCO',
        price: 280,
      });
    });

    it('should handle optional return date', async () => {
      await useCase.execute({
        trip: mockTrip,
        departureHint: 'Madrid',
        departureDate: '2026-10-01',
        returnDate: '2026-10-06',
      });

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Return date: 2026-10-06'),
        expect.any(Object),
      );
    });

    it('should handle optional travel class', async () => {
      await useCase.execute({
        trip: mockTrip,
        departureHint: 'Madrid',
        departureDate: '2026-10-01',
        travelClass: 'business',
      });

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('business'),
        expect.any(Object),
      );
    });
  });
});
