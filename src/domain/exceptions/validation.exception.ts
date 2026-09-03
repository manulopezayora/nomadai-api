import { DomainException } from './domain.exception';

export class ValidationException extends DomainException {
  readonly statusCode = 400;
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
