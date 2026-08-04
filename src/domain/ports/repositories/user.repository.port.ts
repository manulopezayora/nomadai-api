import { User } from '../../entities/user.entity';
import { UserRole } from '../../enums/user-role.enum';

export interface CreateUser_data {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  provider?: string;
  providerId?: string;
}

export interface UpdateUser_data {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role?: UserRole;
}

export abstract class UserRepositoryPort {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findAll(): Promise<User[]>;
  abstract create(data: CreateUser_data): Promise<User>;
  abstract update(id: string, data: UpdateUser_data): Promise<User>;
}
