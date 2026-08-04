import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
import { UsersController } from '../../presentation/controllers/users.controller';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [ListUsersUseCase, UpdateUserUseCase],
})
export class UsersModule {}
