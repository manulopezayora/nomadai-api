import { UserRepositoryPort } from '../../src/domain/ports/repositories/user.repository.port';
import { createMockUser } from './user.factory';

export const createMockUserRepository =
  (): jest.Mocked<UserRepositoryPort> => ({
    findById: jest.fn().mockResolvedValue(createMockUser()),
    findByEmail: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockImplementation((data) =>
      Promise.resolve(
        createMockUser({
          id: 'new-user-id',
          email: data.email,
          passwordHash: data.passwordHash,
          firstName: data.firstName ?? null,
          lastName: data.lastName ?? null,
        }),
      ),
    ),
    update: jest
      .fn()
      .mockImplementation((id, data) =>
        Promise.resolve(createMockUser({ id, ...data })),
      ),
    countActiveAdmins: jest.fn().mockResolvedValue(2),
  });
