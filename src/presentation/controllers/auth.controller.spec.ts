import { AuthController } from './auth.controller';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { UserRole } from '../../domain/enums/user-role.enum';
import { SafeUser } from '../../application/dto/safe-user.dto';

const mockSafeUser = (overrides?: Partial<SafeUser>): SafeUser => ({
  id: 'user-id-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  avatarUrl: null,
  provider: 'local',
  providerId: null,
  role: UserRole.USER,
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('AuthController', () => {
  let controller: AuthController;
  let mockRegisterUseCase: jest.Mocked<RegisterUseCase>;
  let mockLoginUseCase: jest.Mocked<LoginUseCase>;

  beforeEach(() => {
    mockRegisterUseCase = {
      execute: jest.fn(),
    } as any;
    mockLoginUseCase = {
      execute: jest.fn(),
    } as any;
    controller = new AuthController(mockRegisterUseCase, mockLoginUseCase);
  });

  describe('register', () => {
    it('should create user and return without passwordHash', async () => {
      const user = mockSafeUser();
      mockRegisterUseCase.execute.mockResolvedValue(user);

      const result = await controller.register({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('test@example.com');
    });

    it('should call registerUseCase with dto', async () => {
      const user = mockSafeUser();
      mockRegisterUseCase.execute.mockResolvedValue(user);

      await controller.register({
        email: 'test@test.com',
        password: 'password123',
        firstName: 'John',
      });

      expect(mockRegisterUseCase.execute).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
        firstName: 'John',
      });
    });
  });

  describe('login', () => {
    it('should return login result from use case', async () => {
      const loginResult = {
        accessToken: 'jwt-token',
        user: {
          id: 'user-123',
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'USER',
        },
      };
      mockLoginUseCase.execute.mockResolvedValue(loginResult);

      const result = await controller.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).toEqual(loginResult);
    });

    it('should call loginUseCase with dto', async () => {
      mockLoginUseCase.execute.mockResolvedValue({
        accessToken: 'token',
        user: {
          id: '1',
          email: 't@t.com',
          firstName: null,
          lastName: null,
          role: 'USER',
        },
      });

      await controller.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(mockLoginUseCase.execute).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
    });
  });

  describe('getProfile', () => {
    it('should return the user payload', () => {
      const userPayload = {
        userId: 'user-123',
        email: 'test@test.com',
        role: 'USER' as any,
      };

      const result = controller.getProfile(userPayload);

      expect(result).toEqual(userPayload);
    });
  });
});
