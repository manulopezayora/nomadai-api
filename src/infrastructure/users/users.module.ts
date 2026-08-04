import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserRepositoryPort } from '../../domain/ports/repositories/user.repository.port';
import { PrismaUserRepository } from '../database/repositories/prisma-user.repository';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
import { UsersController } from '../../presentation/controllers/users.controller';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [
    { provide: UserRepositoryPort, useClass: PrismaUserRepository },
    ListUsersUseCase,
    UpdateUserUseCase,
  ],
})
export class UsersModule {}
