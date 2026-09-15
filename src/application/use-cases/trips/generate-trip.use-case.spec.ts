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

    const mockFlightsResponse = {
      flights: [
        {
          airline: 'Japan Airlines',
          flightNumber: 'JL045',
          origin: 'MAD',
          destination: 'NRT',
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
    };

    const mockHotelsResponse = {
      hotels: [
        {
          name: 'Shinjuku Granbell Hotel',
          neighborhood: 'Shinjuku',
          city: 'Tokyo',
          country: 'Japan',
          latitude: 35.6938,
          longitude: 139.7034,
          pricePerNight: 95,
          originalPricePerNight: 120,
          currency: 'EUR',
          starRating: 4,
          reviewCount: 1500,
          amenities: ['wifi', 'restaurant', 'bar'],
          imageUrl: 'https://example.com/hotel.jpg',
          bookingUrl: 'https://www.booking.com',
        },
      ],
    };

    const mockItineraryResponse = {
      days: [
        {
          dayNumber: 1,
          title: 'Arrival in Tokyo',
          summary: 'Arrive and explore Shinjuku',
          activities: [
            {
              title: 'Arrive at Narita Airport',
              description: 'Land and take train to hotel',
              category: 'transport',
              startTime: '07:00',
              endTime: '09:00',
              locationName: 'Narita Airport',
              latitude: 35.7647,
              longitude: 140.3864,
              costEstimate: 30,
              tips: 'Get a Suica card for trains',
            },
            {
              title: 'Explore Shinjuku',
              description: 'Walk around Shinjuku area',
              category: 'sightseeing',
              startTime: '14:00',
              endTime: '17:00',
              locationName: 'Shinjuku',
              latitude: 35.6938,
              longitude: 139.7034,
              costEstimate: 0,
              tips: 'Visit Golden Gai at night',
            },
          ],
        },
      ],
    };

    beforeEach(() => {
      mockGemini.generateStructuredOutput
        .mockResolvedValueOnce(mockTripResponse)
        .mockResolvedValueOnce(mockFlightsResponse)
        .mockResolvedValueOnce(mockHotelsResponse)
        .mockResolvedValueOnce(mockItineraryResponse);
    });

    it('should call Gemini 4 times (trip, flights, hotels, itinerary)', async () => {
      await useCase.execute({ prompt: '10 days in Japan, culture and relax' });

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledTimes(4);
    });

    it('should call trip Gemini with the user prompt', async () => {
      await useCase.execute({ prompt: '10 days in Japan, culture and relax' });

      expect(mockGemini.generateStructuredOutput).toHaveBeenCalledWith(
        expect.stringContaining('10 days in Japan, culture and relax'),
        expect.any(Object),
      );
    });

    it('should return combined response without saving to DB', async () => {
      const result = await useCase.execute({
        prompt: '10 days in Japan, culture and relax',
      });

      expect(result.trip).toEqual({
        title: '10 Days in Japan',
        destination: 'Japan',
        startDate: '2026-09-15',
        endDate: '2026-09-25',
        budget: null,
        travelerCount: 1,
        interests: ['culture', 'food'],
        travelStyle: 'mid',
      });

      expect(result.flights).toHaveLength(1);
      expect(result.flights[0]).toMatchObject({
        airline: 'Japan Airlines',
        departure: 'MAD',
        arrival: 'NRT',
        price: 850,
      });

      expect(result.hotels).toHaveLength(1);
      expect(result.hotels[0]).toMatchObject({
        name: 'Shinjuku Granbell Hotel',
        pricePerNight: 95,
      });

      expect(result.itinerary.days).toHaveLength(1);
      expect(result.itinerary.days[0]).toMatchObject({
        dayNumber: 1,
        title: 'Arrival in Tokyo',
      });
      expect(result.itinerary.days[0].activities).toHaveLength(2);
    });

    it('should handle budget from Gemini response', async () => {
      mockGemini.generateStructuredOutput
        .mockReset()
        .mockResolvedValueOnce({
          ...mockTripResponse,
          budget: 5000,
          travelStyle: 'luxury',
        })
        .mockResolvedValueOnce(mockFlightsResponse)
        .mockResolvedValueOnce(mockHotelsResponse)
        .mockResolvedValueOnce(mockItineraryResponse);

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
