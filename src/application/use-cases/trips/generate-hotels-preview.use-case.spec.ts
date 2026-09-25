import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { createMockGeminiService } from '../../../../test/mocks/gemini-service.mock';
import { GenerateHotelsPreviewUseCase } from './generate-hotels-preview.use-case';
import { TravelStyle } from '../../../domain/enums/travel-style.enum';

describe('GenerateHotelsPreviewUseCase', () => {
  let useCase: GenerateHotelsPreviewUseCase;
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
    useCase = new GenerateHotelsPreviewUseCase(mockGemini);
  });

  describe('validation', () => {
    it('should throw ValidationException when checkIn is missing', async () => {
      await expect(
        useCase.execute({
          trip: mockTrip,
          checkIn: '',
          checkOut: '2026-10-06',
        }),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException when checkOut is missing', async () => {
      await expect(
        useCase.execute({
          trip: mockTrip,
          checkIn: '2026-10-01',
          checkOut: '',
        }),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('AI generation', () => {
    const mockHotelsResponse = {
      hotels: [
        {
          name: 'Hotel Artemide',
          neighborhood: 'Via Nazionale',
          city: 'Rome',
          country: 'Italy',
          latitude: 41.9009,
          longitude: 12.4964,
          pricePerNight: 120,
          originalPricePerNight: 150,
          currency: 'EUR',
          starRating: 4,
          reviewCount: 2800,
          amenities: ['wifi', 'breakfast', 'spa'],
          imageUrl: 'https://example.com/hotel.jpg',
          bookingUrl: 'https://www.booking.com',
        },
        {
          name: 'Hotel Colosseum',
          neighborhood: 'Monti',
          city: 'Rome',
          country: 'Italy',
          latitude: 41.8895,
          longitude: 12.4964,
          pricePerNight: 90,
          originalPricePerNight: 90,
          currency: 'EUR',
          starRating: 3,
          reviewCount: 1200,
          amenities: ['wifi'],
          imageUrl: 'https://example.com/hotel2.jpg',
          bookingUrl: 'https://www.booking.com',
        },
      ],
    };

    beforeEach(() => {
      mockGemini.generateStructuredOutput.mockResolvedValueOnce(
        mockHotelsResponse,
      );
    });

    it('should call Gemini once for hotels generation', async () => {
      await useCase.execute({
        trip: mockTrip,
        checkIn: '2026-10-01',
        checkOut: '2026-10-06',
      });

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledTimes(1);
    });

    it('should call Gemini with a prompt containing destination', async () => {
      await useCase.execute({
        trip: mockTrip,
        checkIn: '2026-10-01',
        checkOut: '2026-10-06',
      });

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Rome'),
        expect.any(Object),
      );
    });

    it('should return mapped hotels without saving to DB', async () => {
      const result = await useCase.execute({
        trip: mockTrip,
        checkIn: '2026-10-01',
        checkOut: '2026-10-06',
      });

      expect(result.hotels).toHaveLength(2);
      expect(result.hotels[0]).toMatchObject({
        name: 'Hotel Artemide',
        location: 'Rome, Italy',
        pricePerNight: 120,
        rating: 4,
      });
    });

    it('should handle optional maxPricePerNight', async () => {
      await useCase.execute({
        trip: mockTrip,
        checkIn: '2026-10-01',
        checkOut: '2026-10-06',
        maxPricePerNight: 100,
      });

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('Max price per night: 100 EUR'),
        expect.any(Object),
      );
    });

    it('should handle optional amenities', async () => {
      await useCase.execute({
        trip: mockTrip,
        checkIn: '2026-10-01',
        checkOut: '2026-10-06',
        amenities: ['wifi', 'pool'],
      });

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('wifi, pool'),
        expect.any(Object),
      );
    });
  });
});
