import { JwtService } from '@nestjs/jwt';

export const createMockJwtService = (): jest.Mocked<JwtService> =>
  ({
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  }) as unknown as jest.Mocked<JwtService>;
