import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
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
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
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
