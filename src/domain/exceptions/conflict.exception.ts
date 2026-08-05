import { DomainException } from './domain.exception';

export class ConflictException extends DomainException {
  readonly statusCode = 409;

  constructor(message: string) {
    super(message);
  }
}
