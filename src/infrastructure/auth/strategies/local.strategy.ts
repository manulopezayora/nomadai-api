import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import * as bcrypt from 'bcryptjs';
import { UserRepositoryPort } from '../../../domain/ports/repositories/user.repository.port';
import { UserPayload } from '../../../shared/types/user-payload';
import { UnauthorizedException } from '../../../domain/exceptions/unauthorized.exception';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(UserRepositoryPort)
    private readonly userRepository: UserRepositoryPort,
  ) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<UserPayload> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
