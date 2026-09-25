import { DomainException } from './domain.exception';

export class GeminiServiceException extends DomainException {
  readonly statusCode: number;
  readonly code: string;

  constructor(code: string, message: string, statusCode = 502) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
