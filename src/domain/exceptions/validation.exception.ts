import { DomainException } from './domain.exception';

export class ValidationException extends DomainException {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
