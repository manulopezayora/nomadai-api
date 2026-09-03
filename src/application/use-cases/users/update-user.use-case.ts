import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../../../domain/ports/repositories/user.repository.port';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { NotFoundException } from '../../../domain/exceptions/not-found.exception';
import { ForbiddenException } from '../../../domain/exceptions/forbidden.exception';
import { ValidationException } from '../../../domain/exceptions/validation.exception';
import { SafeUser, toSafeUser } from '../../dto/safe-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(UserRepositoryPort)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(
    id: string,
    dto: UpdateUserDto,
    currentUser: { userId: string; role: UserRole },
  ): Promise<SafeUser> {
    const targetUser = await this.userRepository.findById(id);

    if (!targetUser) {
      throw new NotFoundException('User', id);
    }

    const isOwnProfile = currentUser.userId === id;
    const isAdmin = currentUser.role === UserRole.ADMIN;

    if (!isOwnProfile && !isAdmin) {
      throw new ForbiddenException(
        'USER_FORBIDDEN',
        'You can only update your own profile',
      );
    }

    const wantsToChangeRole = dto.role !== undefined;
    const wantsToChangeActive = dto.isActive !== undefined;

    if (wantsToChangeRole || wantsToChangeActive) {
      if (!isAdmin) {
        throw new ForbiddenException(
          'USER_FORBIDDEN_ROLE_CHANGE',
          'Only admins can change role or isActive',
        );
      }

      if (isOwnProfile) {
        throw new ForbiddenException(
          'USER_FORBIDDEN_ROLE_CHANGE',
          'Admins cannot change their own role or isActive',
        );
      }

      if (wantsToChangeActive && dto.isActive === false) {
        const isTargetAdmin = targetUser.role === UserRole.ADMIN;

        if (isTargetAdmin) {
          const activeAdminCount =
            await this.userRepository.countActiveAdmins();

          if (activeAdminCount <= 1) {
            throw new ValidationException(
              'VALIDATION_INVALID_PARAMS',
              'Cannot deactivate the last active admin',
            );
          }
        }
      }
    }

    const updated = await this.userRepository.update(id, dto);
    return toSafeUser(updated);
  }
}
