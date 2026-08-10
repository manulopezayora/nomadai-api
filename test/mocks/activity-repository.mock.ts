import { ActivityRepositoryPort } from '../../src/domain/ports/repositories/activity.repository.port';

export const createMockActivityRepository = () =>
  ({
    findById: jest.fn(),
    findByDayPlanId: jest.fn(),
    countByDayPlanId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }) as unknown as jest.Mocked<ActivityRepositoryPort>;
