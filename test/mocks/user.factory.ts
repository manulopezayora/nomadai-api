import { User } from '../../src/domain/entities/user.entity';
import { UserRole } from '../../src/domain/enums/user-role.enum';

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-id-123',
  email: 'test@example.com',
  passwordHash: '$2b$10$hashedpassword',
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

export const createMockAdmin = (overrides?: Partial<User>): User =>
  createMockUser({
    id: 'admin-id-123',
    email: 'admin@example.com',
    firstName: 'Admin',
    role: UserRole.ADMIN,
    ...overrides,
  });
