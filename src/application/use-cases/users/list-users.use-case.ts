import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../../../domain/ports/repositories/user.repository.port';
import { SafeUser, toSafeUser } from '../../dto/safe-user.dto';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(UserRepositoryPort)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(): Promise<SafeUser[]> {
    const users = await this.userRepository.findAll();
    return users.map(toSafeUser);
  }
}
