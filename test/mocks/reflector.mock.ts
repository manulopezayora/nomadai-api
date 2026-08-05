import { Reflector } from '@nestjs/core';

export const createMockReflector = (): jest.Mocked<Reflector> =>
  ({
    getAllAndOverride: jest.fn(),
    getAllAndMerge: jest.fn(),
    get: jest.fn(),
  }) as unknown as jest.Mocked<Reflector>;
