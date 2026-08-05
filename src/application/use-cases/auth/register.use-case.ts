import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRepositoryPort } from '../../../domain/ports/repositories/user.repository.port';
import { RegisterDto } from '../../dto/register.dto';
import { User } from '../../../domain/entities/user.entity';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { ConflictException } from '../../../domain/exceptions/conflict.exception';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(UserRepositoryPort)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(dto: RegisterDto): Promise<User> {
    if (!dto.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      throw new ValidationException('Invalid email format');
    }

    if (!dto.password || dto.password.length < 8) {
      throw new ValidationException('Password must be at least 8 characters');
    }

    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.userRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
  }
}
