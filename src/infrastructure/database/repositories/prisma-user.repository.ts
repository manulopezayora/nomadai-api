import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUser_data,
  UpdateUser_data,
  UserRepositoryPort,
} from '../../../domain/ports/repositories/user.repository.port';
import { User } from '../../../domain/entities/user.entity';
import { UserRole } from '../../../domain/enums/user-role.enum';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RawUser {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  provider: string;
  providerId: string | null;
  role: any;
  createdAt: Date;
  updatedAt: Date;
}

/* eslint-enable @typescript-eslint/no-explicit-any */

@Injectable()
export class PrismaUserRepository extends UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.instance.user.findUnique({ where: { id } });
    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.instance.user.findUnique({
      where: { email },
    });
    return user ? this.toDomain(user) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.instance.user.findMany();
    return users.map((u) => this.toDomain(u));
  }

  async create(data: CreateUser_data): Promise<User> {
    const user = await this.prisma.instance.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        provider: data.provider ?? 'local',
        providerId: data.providerId,
      },
    });
    return this.toDomain(user);
  }

  async update(id: string, data: UpdateUser_data): Promise<User> {
    const user = await this.prisma.instance.user.update({
      where: { id },
      data,
    });
    return this.toDomain(user);
  }

  private toDomain(raw: RawUser): User {
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
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
