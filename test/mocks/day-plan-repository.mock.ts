import { DayPlanRepositoryPort } from '../../src/domain/ports/repositories/day-plan.repository.port';

export const createMockDayPlanRepository = () =>
  ({
    findById: jest.fn(),
    findByTripId: jest.fn(),
    findByTripIdAndDayNumber: jest.fn(),
    countByTripId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }) as unknown as jest.Mocked<DayPlanRepositoryPort>;
