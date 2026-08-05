import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
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

    it('should allow admin to change role on other user', async () => {
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

    it('should throw ForbiddenException when admin tries to change own role', async () => {
      const adminUser = createMockAdmin({ id: 'admin-self' });
      mockUserRepo.findById.mockResolvedValue(adminUser);

      await expect(
        useCase.execute(
          'admin-self',
          { role: UserRole.USER },
          {
            userId: 'admin-self',
            role: UserRole.ADMIN,
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('isActive changes', () => {
    it('should throw ForbiddenException when non-admin tries to change isActive', async () => {
      const targetUser = createMockUser({ id: 'target-user' });
      mockUserRepo.findById.mockResolvedValue(targetUser);

      await expect(
        useCase.execute(
          'target-user',
          { isActive: false },
          {
            userId: 'target-user',
            role: UserRole.USER,
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to deactivate other user', async () => {
      const targetUser = createMockUser({ id: 'target-user' });
      mockUserRepo.findById.mockResolvedValue(targetUser);
      mockUserRepo.update.mockResolvedValue({
        ...targetUser,
        isActive: false,
      });

      const result = await useCase.execute(
        'target-user',
        { isActive: false },
        {
          userId: 'admin-id',
          role: UserRole.ADMIN,
        },
      );

      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException when admin tries to deactivate self', async () => {
      const adminUser = createMockAdmin({ id: 'admin-self' });
      mockUserRepo.findById.mockResolvedValue(adminUser);

      await expect(
        useCase.execute(
          'admin-self',
          { isActive: false },
          {
            userId: 'admin-self',
            role: UserRole.ADMIN,
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('last admin protection', () => {
    it('should throw ValidationException when deactivating the last active admin', async () => {
      const adminUser = createMockAdmin({ id: 'last-admin' });
      mockUserRepo.findById.mockResolvedValue(adminUser);
      mockUserRepo.countActiveAdmins.mockResolvedValue(1);

      await expect(
        useCase.execute(
          'last-admin',
          { isActive: false },
          {
            userId: 'other-admin',
            role: UserRole.ADMIN,
          },
        ),
      ).rejects.toThrow(ValidationException);
    });

    it('should allow deactivating admin when more than 1 admin exists', async () => {
      const adminUser = createMockAdmin({ id: 'target-admin' });
      mockUserRepo.findById.mockResolvedValue(adminUser);
      mockUserRepo.countActiveAdmins.mockResolvedValue(2);
      mockUserRepo.update.mockResolvedValue({
        ...adminUser,
        isActive: false,
      });

      const result = await useCase.execute(
        'target-admin',
        { isActive: false },
        {
          userId: 'other-admin',
          role: UserRole.ADMIN,
        },
      );

      expect(result).toBeDefined();
    });

    it('should not check admin count when deactivating non-admin user', async () => {
      const regularUser = createMockUser({ id: 'regular-user' });
      mockUserRepo.findById.mockResolvedValue(regularUser);
      mockUserRepo.update.mockResolvedValue({
        ...regularUser,
        isActive: false,
      });

      const result = await useCase.execute(
        'regular-user',
        { isActive: false },
        {
          userId: 'admin-id',
          role: UserRole.ADMIN,
        },
      );

      expect(result).toBeDefined();
      expect(mockUserRepo.countActiveAdmins).not.toHaveBeenCalled();
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
