import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../database/prisma/prisma.module';
import { PrismaUserRepository } from '../database/repositories/prisma-user.repository';
import { UserRepositoryPort } from '../../domain/ports/repositories/user.repository.port';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from '../../presentation/controllers/auth.controller';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' } as never,
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: UserRepositoryPort, useClass: PrismaUserRepository },
    RegisterUseCase,
    LoginUseCase,
    LocalStrategy,
    JwtStrategy,
  ],
  exports: [UserRepositoryPort, JwtModule],
})
export class AuthModule {}
