import { DomainException } from './domain.exception';

export class ConflictException extends DomainException {
  readonly statusCode = 409;
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
