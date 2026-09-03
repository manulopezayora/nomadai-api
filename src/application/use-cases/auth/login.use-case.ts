import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRepositoryPort } from '../../../domain/ports/repositories/user.repository.port';
import { LoginDto } from '../../dto/login.dto';
import { UnauthorizedException } from '../../../domain/exceptions/unauthorized.exception';
import { ValidationException } from '../../../domain/exceptions/validation.exception';

export interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  };
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(UserRepositoryPort)
    private readonly userRepository: UserRepositoryPort,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResult> {
    if (!dto.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      throw new ValidationException(
        'VALIDATION_INVALID_EMAIL',
        'Invalid email format',
      );
    }

    if (!dto.password) {
      throw new ValidationException(
        'VALIDATION_PASSWORD_REQUIRED',
        'Password is required',
      );
    }

    const user = await this.userRepository.findByEmail(dto.email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(
        'AUTH_INVALID_CREDENTIALS',
        'Invalid credentials',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'AUTH_ACCOUNT_DISABLED',
        'Account is disabled',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'AUTH_INVALID_CREDENTIALS',
        'Invalid credentials',
      );
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
