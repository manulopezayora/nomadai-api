import { HotelRecommendationRepositoryPort } from '../../src/domain/ports/repositories/hotel-recommendation.repository.port';

export const createMockHotelRecommendationRepository = () =>
  ({
    findByTripId: jest.fn().mockResolvedValue([]),
    createMany: jest.fn().mockResolvedValue([]),
    deleteByTripId: jest.fn().mockResolvedValue(undefined),
  }) as unknown as jest.Mocked<HotelRecommendationRepositoryPort>;
