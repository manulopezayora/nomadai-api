import { DomainException } from './domain.exception';

export class GeminiServiceException extends DomainException {
  readonly statusCode = 502;
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
