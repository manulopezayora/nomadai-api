import { DomainException } from './domain.exception';

export class UnauthorizedException extends DomainException {
  readonly statusCode = 401;
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
