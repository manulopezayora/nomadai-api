import { UnauthorizedException } from '../../../domain/exceptions/unauthorized.exception';
import * as bcrypt from 'bcryptjs';
import { createMockJwtService } from '../../../../test/mocks/jwt-service.mock';
import { createMockUserRepository } from '../../../../test/mocks/user-repository.mock';
import { createMockUser } from '../../../../test/mocks/user.factory';
import { LoginUseCase } from './login.use-case';

jest.mock('bcryptjs');

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockUserRepo: ReturnType<typeof createMockUserRepository>;
  let mockJwtService: ReturnType<typeof createMockJwtService>;

  beforeEach(() => {
    mockUserRepo = createMockUserRepository();
    mockJwtService = createMockJwtService();
    useCase = new LoginUseCase(mockUserRepo, mockJwtService);
    jest.clearAllMocks();
  });

  describe('invalid credentials', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        useCase.execute({ email: 'wrong@test.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user has no passwordHash', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(
        createMockUser({ passwordHash: null }),
      );

      await expect(
        useCase.execute({ email: 'oauth@test.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const user = createMockUser({
        passwordHash: '$2b$10$hashedpassword',
      });
      mockUserRepo.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        useCase.execute({ email: 'test@test.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('successful login', () => {
    const mockUser = createMockUser({
      id: 'user-123',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER' as any,
    });

    beforeEach(() => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token-123');
    });

    it('should return accessToken and user data', async () => {
      const result = await useCase.execute({
        email: 'test@test.com',
        password: 'correctpassword',
      });

      expect(result).toEqual({
        accessToken: 'jwt-token-123',
        user: {
          id: 'user-123',
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'USER',
        },
      });
    });

    it('should call jwtService.sign with correct payload', async () => {
      await useCase.execute({
        email: 'test@test.com',
        password: 'correctpassword',
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        userId: 'user-123',
        email: 'test@test.com',
        role: 'USER',
      });
    });

    it('should verify password with bcrypt', async () => {
      await useCase.execute({
        email: 'test@test.com',
        password: 'correctpassword',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctpassword',
        '$2b$10$hashedpassword',
      );
    });
  });
});
