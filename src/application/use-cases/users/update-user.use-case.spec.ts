import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { UpdateUserUseCase } from './update-user.use-case';
import { createMockUserRepository } from '../../../../test/mocks/user-repository.mock';
import {
  createMockUser,
  createMockAdmin,
} from '../../../../test/mocks/user.factory';
import { UserRepositoryPort } from '../../../domain/ports/repositories/user.repository.port';
import { UserRole } from '../../../domain/enums/user-role.enum';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let mockUserRepo: ReturnType<typeof createMockUserRepository>;

  beforeEach(() => {
    mockUserRepo = createMockUserRepository();
    useCase = new UpdateUserUseCase(mockUserRepo);
  });

  describe('user not found', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(
          'nonexistent-id',
          { firstName: 'Test' },
          {
            userId: 'admin-id',
            role: UserRole.ADMIN,
          },
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('permission checks', () => {
    const targetUser = createMockUser({ id: 'target-user' });

    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue(targetUser);
      mockUserRepo.update.mockResolvedValue(targetUser);
    });

    it('should throw ForbiddenException when user tries to update another profile', async () => {
      await expect(
        useCase.execute(
          'target-user',
          { firstName: 'Hacked' },
          {
            userId: 'other-user',
            role: UserRole.USER,
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow user to update own profile', async () => {
      const result = await useCase.execute(
        'target-user',
        { firstName: 'Updated' },
        {
          userId: 'target-user',
          role: UserRole.USER,
        },
      );

      expect(result).toBeDefined();
      expect(mockUserRepo.update).toHaveBeenCalled();
    });

    it('should allow admin to update any profile', async () => {
      const result = await useCase.execute(
        'target-user',
        { firstName: 'AdminUpdated' },
        {
          userId: 'admin-id',
          role: UserRole.ADMIN,
        },
      );

      expect(result).toBeDefined();
      expect(mockUserRepo.update).toHaveBeenCalled();
    });
  });

  describe('role changes', () => {
    const targetUser = createMockUser({ id: 'target-user' });

    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue(targetUser);
      mockUserRepo.update.mockResolvedValue(targetUser);
    });

    it('should throw ForbiddenException when non-admin tries to change role', async () => {
      await expect(
        useCase.execute(
          'target-user',
          { role: UserRole.ADMIN },
          {
            userId: 'target-user',
            role: UserRole.USER,
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to change role', async () => {
      const adminUser = createMockAdmin();
      mockUserRepo.update.mockResolvedValue({
        ...targetUser,
        role: UserRole.ADMIN,
      });

      const result = await useCase.execute(
        'target-user',
        { role: UserRole.ADMIN },
        {
          userId: 'admin-id',
          role: UserRole.ADMIN,
        },
      );

      expect(result).toBeDefined();
    });
  });

  describe('successful update', () => {
    it('should return updated user without passwordHash', async () => {
      const targetUser = createMockUser({ id: 'target-user' });
      mockUserRepo.findById.mockResolvedValue(targetUser);
      mockUserRepo.update.mockResolvedValue({
        ...targetUser,
        firstName: 'Updated',
      });

      const result = await useCase.execute(
        'target-user',
        { firstName: 'Updated' },
        {
          userId: 'target-user',
          role: UserRole.USER,
        },
      );

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.firstName).toBe('Updated');
    });

    it('should call repository update with correct data', async () => {
      const targetUser = createMockUser({ id: 'target-user' });
      mockUserRepo.findById.mockResolvedValue(targetUser);
      mockUserRepo.update.mockResolvedValue(targetUser);

      await useCase.execute(
        'target-user',
        { firstName: 'New', lastName: 'Name' },
        {
          userId: 'target-user',
          role: UserRole.USER,
        },
      );

      expect(mockUserRepo.update).toHaveBeenCalledWith('target-user', {
        firstName: 'New',
        lastName: 'Name',
      });
    });
  });
});
