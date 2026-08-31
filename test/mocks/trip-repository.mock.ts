import { TripRepositoryPort } from '../../src/domain/ports/repositories/trip.repository.port';

export const createMockTripRepository = () =>
  ({
    findById: jest.fn(),
    findByIdWithDetails: jest.fn(),
    findByUserId: jest.fn(),
    countByUserId: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }) as unknown as jest.Mocked<TripRepositoryPort>;
