import { DomainException } from './domain.exception';

export class UnauthorizedException extends DomainException {
  readonly statusCode = 401;

  constructor(message: string) {
    super(message);
  }
}
