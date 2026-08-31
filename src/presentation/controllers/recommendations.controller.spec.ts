import { RecommendationsController } from './recommendations.controller';
import { RecommendFlightsUseCase } from '../../application/use-cases/recommendations/recommend-flights.use-case';
import { RecommendHotelsUseCase } from '../../application/use-cases/recommendations/recommend-hotels.use-case';
import { RecommendItineraryUseCase } from '../../application/use-cases/recommendations/recommend-itinerary.use-case';
import { UserRole } from '../../domain/enums/user-role.enum';

describe('RecommendationsController', () => {
  let controller: RecommendationsController;
  let mockRecommendFlights: jest.Mocked<RecommendFlightsUseCase>;
  let mockRecommendHotels: jest.Mocked<RecommendHotelsUseCase>;
  let mockRecommendItinerary: jest.Mocked<RecommendItineraryUseCase>;

  const mockUser = {
    userId: 'user-123',
    email: 'test@test.com',
    role: UserRole.USER,
  };

  beforeEach(() => {
    mockRecommendFlights = { execute: jest.fn() } as never;
    mockRecommendHotels = { execute: jest.fn() } as never;
    mockRecommendItinerary = { execute: jest.fn() } as never;

    controller = new RecommendationsController(
      mockRecommendFlights,
      mockRecommendHotels,
      mockRecommendItinerary,
    );
  });

  describe('recommendFlights', () => {
    it('should call use case and return results', async () => {
      const mockResult = [
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
          bookingUrl: null,
          notes: null,
          isRecommended: true,
          createdAt: new Date(),
        },
      ];
      mockRecommendFlights.execute.mockResolvedValue(mockResult);

      const result = await controller.recommendFlights('trip-123', mockUser, {
        origin: 'MAD',
        destination: 'NRT',
        departureDate: '2026-09-15',
      });

      expect(result).toEqual(mockResult);
      expect(mockRecommendFlights.execute).toHaveBeenCalledWith(
        'trip-123',
        { origin: 'MAD', destination: 'NRT', departureDate: '2026-09-15' },
        'user-123',
      );
    });
  });

  describe('recommendHotels', () => {
    it('should call use case and return results', async () => {
      const mockResult = [
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
          amenities: ['wifi'],
          bookingUrl: null,
          isRecommended: true,
          createdAt: new Date(),
        },
      ];
      mockRecommendHotels.execute.mockResolvedValue(mockResult);

      const result = await controller.recommendHotels('trip-123', mockUser, {
        city: 'Tokyo',
        checkIn: '2026-09-15',
        checkOut: '2026-09-25',
      });

      expect(result).toEqual(mockResult);
      expect(mockRecommendHotels.execute).toHaveBeenCalledWith(
        'trip-123',
        { city: 'Tokyo', checkIn: '2026-09-15', checkOut: '2026-09-25' },
        'user-123',
      );
    });
  });

  describe('recommendItinerary', () => {
    it('should call use case and return results', async () => {
      const mockResult = { dayPlans: [], activities: [] };
      mockRecommendItinerary.execute.mockResolvedValue(mockResult);

      const result = await controller.recommendItinerary('trip-123', mockUser);

      expect(result).toEqual(mockResult);
      expect(mockRecommendItinerary.execute).toHaveBeenCalledWith(
        'trip-123',
        'user-123',
      );
    });
  });
});
