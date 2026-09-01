import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserData,
  UpdateUserData,
  UserRepositoryPort,
} from '../../../domain/ports/repositories/user.repository.port';
import { User } from '../../../domain/entities/user.entity';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { UserMapper } from '../prisma/mappers/user.mapper';

@Injectable()
export class PrismaUserRepository extends UserRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.instance.user.findUnique({ where: { id } });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.instance.user.findUnique({
      where: { email },
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findAll(offset: number, limit: number): Promise<User[]> {
    const users = await this.prisma.instance.user.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => UserMapper.toDomain(u));
  }

  async count(): Promise<number> {
    return this.prisma.instance.user.count();
  }

  async create(data: CreateUserData): Promise<User> {
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
    return UserMapper.toDomain(user);
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.prisma.instance.user.update({
      where: { id },
      data,
    });
    return UserMapper.toDomain(user);
  }

  async countActiveAdmins(): Promise<number> {
    return this.prisma.instance.user.count({
      where: { role: UserRole.ADMIN, isActive: true },
    });
  }
}
