import { BadRequestException, ConflictException } from '@nestjs/common';
import { createMockUserRepository } from '../../../../test/mocks/user-repository.mock';
import { createMockUser } from '../../../../test/mocks/user.factory';
import { RegisterUseCase } from './register.use-case';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let mockUserRepo: ReturnType<typeof createMockUserRepository>;

  beforeEach(() => {
    mockUserRepo = createMockUserRepository();
    useCase = new RegisterUseCase(mockUserRepo);
  });

  describe('validation', () => {
    it('should throw BadRequestException for invalid email format', async () => {
      await expect(
        useCase.execute({ email: 'not-an-email', password: 'password123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty email', async () => {
      await expect(
        useCase.execute({ email: '', password: 'password123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for short password', async () => {
      await expect(
        useCase.execute({ email: 'test@test.com', password: 'short' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty password', async () => {
      await expect(
        useCase.execute({ email: 'test@test.com', password: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept valid email and password', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(createMockUser());

      const result = await useCase.execute({
        email: 'valid@test.com',
        password: 'password123',
      });

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('duplicate email', () => {
    it('should throw ConflictException for existing email', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(createMockUser());

      await expect(
        useCase.execute({
          email: 'existing@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should not create user when email already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(createMockUser());

      await useCase
        .execute({ email: 'existing@test.com', password: 'password123' })
        .catch(() => undefined);

      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('successful registration', () => {
    beforeEach(() => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(createMockUser());
    });

    it('should create user with correct data', async () => {
      await useCase.execute({
        email: 'new@test.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(mockUserRepo.create).toHaveBeenCalledWith({
        email: 'new@test.com',
        passwordHash: expect.any(String),
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should hash the password', async () => {
      await useCase.execute({
        email: 'new@test.com',
        password: 'password123',
      });

      const createCall = mockUserRepo.create.mock.calls[0][0];
      expect(createCall.passwordHash).not.toBe('password123');
      expect(createCall.passwordHash).toMatch(/^\$2[aby]?\$/);
    });

    it('should return the created user', async () => {
      const user = createMockUser({ email: 'new@test.com' });
      mockUserRepo.create.mockResolvedValue(user);

      const result = await useCase.execute({
        email: 'new@test.com',
        password: 'password123',
      });

      expect(result).toEqual(user);
    });
  });
});
