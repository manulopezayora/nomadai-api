import { ListUsersUseCase } from './list-users.use-case';
import { createMockUserRepository } from '../../../../test/mocks/user-repository.mock';
import {
  createMockUser,
  createMockAdmin,
} from '../../../../test/mocks/user.factory';
import { UserRepositoryPort } from '../../../domain/ports/repositories/user.repository.port';

describe('ListUsersUseCase', () => {
  let useCase: ListUsersUseCase;
  let mockUserRepo: ReturnType<typeof createMockUserRepository>;

  beforeEach(() => {
    mockUserRepo = createMockUserRepository();
    useCase = new ListUsersUseCase(mockUserRepo);
  });

  it('should return all users without passwordHash', async () => {
    const users = [
      createMockUser({ id: '1', email: 'user1@test.com' }),
      createMockAdmin({ id: '2', email: 'admin@test.com' }),
    ];
    mockUserRepo.findAll.mockResolvedValue(users);

    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0]).not.toHaveProperty('passwordHash');
    expect(result[1]).not.toHaveProperty('passwordHash');
  });

  it('should return empty array when no users exist', async () => {
    mockUserRepo.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });

  it('should call repository findAll', async () => {
    mockUserRepo.findAll.mockResolvedValue([]);

    await useCase.execute();

    expect(mockUserRepo.findAll).toHaveBeenCalled();
  });

  it('should strip passwordHash from all users', async () => {
    const userWithPassword = createMockUser({
      id: '1',
      passwordHash: '$2b$10$secret',
    });
    mockUserRepo.findAll.mockResolvedValue([userWithPassword]);

    const result = await useCase.execute();

    expect(result[0]).toEqual({
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      avatarUrl: null,
      provider: 'local',
      providerId: null,
      role: 'USER',
      isActive: true,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});
