import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../../../domain/ports/repositories/user.repository.port';
import { User } from '../../../domain/entities/user.entity';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(UserRepositoryPort)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.userRepository.findAll();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return users.map(({ passwordHash: _, ...user }) => user);
  }
}
