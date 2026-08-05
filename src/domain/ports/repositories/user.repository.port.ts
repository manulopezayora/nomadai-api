import { User } from '../../entities/user.entity';
import { UserRole } from '../../enums/user-role.enum';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  provider?: string;
  providerId?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role?: UserRole;
}

export abstract class UserRepositoryPort {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findAll(): Promise<User[]>;
  abstract create(data: CreateUserData): Promise<User>;
  abstract update(id: string, data: UpdateUserData): Promise<User>;
}
