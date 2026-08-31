import { FlightRecommendationRepositoryPort } from '../../src/domain/ports/repositories/flight-recommendation.repository.port';

export const createMockFlightRecommendationRepository = () =>
  ({
    findByTripId: jest.fn().mockResolvedValue([]),
    createMany: jest.fn().mockResolvedValue([]),
    deleteByTripId: jest.fn().mockResolvedValue(undefined),
  }) as unknown as jest.Mocked<FlightRecommendationRepositoryPort>;
