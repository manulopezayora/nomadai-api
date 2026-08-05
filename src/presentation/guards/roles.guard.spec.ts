import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../domain/enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(mockReflector);
  });

  const mockContext = (user?: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('no roles required', () => {
    it('should return true when no roles are defined', () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const result = guard.canActivate(mockContext());

      expect(result).toBe(true);
    });

    it('should return true when empty roles array', () => {
      mockReflector.getAllAndOverride.mockReturnValue([]);

      const result = guard.canActivate(mockContext());

      expect(result).toBe(true);
    });
  });

  describe('roles required', () => {
    it('should return true when user has required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const user = {
        userId: '1',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      };

      const result = guard.canActivate(mockContext(user));

      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const user = { userId: '1', email: 'user@test.com', role: UserRole.USER };

      const result = guard.canActivate(mockContext(user));

      expect(result).toBe(false);
    });

    it('should return false when user is not present', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(mockContext(undefined));

      expect(result).toBe(false);
    });

    it('should return true when user has one of multiple required roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        UserRole.USER,
        UserRole.ADMIN,
      ]);
      const user = { userId: '1', email: 'user@test.com', role: UserRole.USER };

      const result = guard.canActivate(mockContext(user));

      expect(result).toBe(true);
    });
  });
});
