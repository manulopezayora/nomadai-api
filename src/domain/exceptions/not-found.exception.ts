import { DomainException } from './domain.exception';

export class NotFoundException extends DomainException {
  readonly statusCode = 404;
  readonly code: string;

  constructor(entity: string, id?: string) {
    super(id ? `${entity} with ID "${id}" not found` : `${entity} not found`);
    this.code = `${entity.toUpperCase()}_NOT_FOUND`;
  }
}
