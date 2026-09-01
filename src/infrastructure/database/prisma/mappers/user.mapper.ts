import { User } from '../../../../domain/entities/user.entity';
import { UserRole } from '../../../../domain/enums/user-role.enum';
import {
  CreateUserData,
  UpdateUserData,
} from '../../../../domain/ports/repositories/user.repository.port';

interface PrismaUser {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  provider: string;
  providerId: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    return {
      id: raw.id,
      email: raw.email,
      passwordHash: raw.passwordHash,
      firstName: raw.firstName,
      lastName: raw.lastName,
      avatarUrl: raw.avatarUrl,
      provider: raw.provider,
      providerId: raw.providerId,
      role: raw.role as UserRole,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  static toPrismaCreate(data: CreateUserData) {
    return {
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      provider: data.provider ?? 'local',
      providerId: data.providerId,
    };
  }

  static toPrismaUpdate(data: UpdateUserData) {
    return {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };
  }
}
