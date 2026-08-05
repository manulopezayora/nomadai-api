import { DomainException } from './domain.exception';

export class ForbiddenException extends DomainException {
  readonly statusCode = 403;

  constructor(message: string) {
    super(message);
  }
}
