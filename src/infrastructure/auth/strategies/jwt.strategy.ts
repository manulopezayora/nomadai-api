import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UserPayload } from '../../../shared/types/user-payload';

function extractTokenFromCookie(cookieName: string) {
  return (request: Request): string | null => {
    const cookies = request.cookies as Record<string, string> | undefined;
    return cookies?.[cookieName] ?? null;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(ConfigService) config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractTokenFromCookie('token'),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: {
    userId: string;
    email: string;
    role: string;
  }): UserPayload {
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role as UserPayload['role'],
    };
  }
}
