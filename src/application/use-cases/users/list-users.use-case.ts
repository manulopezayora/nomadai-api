import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../../../domain/ports/repositories/user.repository.port';
import { User } from '../../../domain/entities/user.entity';
import { SafeUser, toSafeUser } from '../../dto/safe-user.dto';
import { PaginatedResponse } from '../../../shared/types/paginated-response';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(UserRepositoryPort)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<SafeUser>> {
    const offset = (page - 1) * limit;
    const [users, total]: [User[], number] = await Promise.all([
      this.userRepository.findAll(offset, limit),
      this.userRepository.count(),
    ]);

    return {
      data: users.map(toSafeUser),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
