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

  it('should return paginated users without passwordHash', async () => {
    const users = [
      createMockUser({ id: '1', email: 'user1@test.com' }),
      createMockAdmin({ id: '2', email: 'admin@test.com' }),
    ];
    mockUserRepo.findAll.mockResolvedValue(users);
    mockUserRepo.count.mockResolvedValue(2);

    const result = await useCase.execute(1, 20);

    expect(result.data).toHaveLength(2);
    expect(result.data[0]).not.toHaveProperty('passwordHash');
    expect(result.data[1]).not.toHaveProperty('passwordHash');
    expect(result.meta).toEqual({
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
  });

  it('should return empty data when no users exist', async () => {
    mockUserRepo.findAll.mockResolvedValue([]);
    mockUserRepo.count.mockResolvedValue(0);

    const result = await useCase.execute(1, 20);

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  it('should call repository findAll with correct offset and limit', async () => {
    mockUserRepo.findAll.mockResolvedValue([]);
    mockUserRepo.count.mockResolvedValue(0);

    await useCase.execute(3, 10);

    expect(mockUserRepo.findAll).toHaveBeenCalledWith(20, 10);
  });

  it('should calculate correct totalPages', async () => {
    mockUserRepo.findAll.mockResolvedValue([]);
    mockUserRepo.count.mockResolvedValue(55);

    const result = await useCase.execute(1, 20);

    expect(result.meta.totalPages).toBe(3);
  });

  it('should strip passwordHash from all users', async () => {
    const userWithPassword = createMockUser({
      id: '1',
      passwordHash: '$2b$10$secret',
    });
    mockUserRepo.findAll.mockResolvedValue([userWithPassword]);
    mockUserRepo.count.mockResolvedValue(1);

    const result = await useCase.execute(1, 20);

    expect(result.data[0]).toEqual({
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
