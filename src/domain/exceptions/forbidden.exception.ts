import { DomainException } from './domain.exception';

export class ForbiddenException extends DomainException {
  readonly statusCode = 403;
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
