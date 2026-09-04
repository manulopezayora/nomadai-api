import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../../../domain/ports/repositories/user.repository.port';
import { SafeUser, toSafeUser } from '../../dto/safe-user.dto';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';

@Injectable()
export class CheckStatusUseCase {
  constructor(
    @Inject(UserRepositoryPort)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(userId: string): Promise<SafeUser> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User', userId);
    }

    return toSafeUser(user);
  }
}
