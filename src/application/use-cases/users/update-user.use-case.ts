import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepositoryPort } from '../../../domain/ports/repositories/user.repository.port';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { User } from '../../../domain/entities/user.entity';
import { UserRole } from '../../../domain/enums/user-role.enum';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(
    id: string,
    dto: UpdateUserDto,
    currentUser: { userId: string; role: UserRole },
  ): Promise<Omit<User, 'passwordHash'>> {
    const targetUser = await this.userRepository.findById(id);

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const isOwnProfile = currentUser.userId === id;
    const isAdmin = currentUser.role === UserRole.ADMIN;

    if (!isOwnProfile && !isAdmin) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Only admins can change roles
    if (dto.role && !isAdmin) {
      throw new ForbiddenException('Only admins can change user roles');
    }

    const updated = await this.userRepository.update(id, dto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}
