import { DomainException } from './domain.exception';

export class NotFoundException extends DomainException {
  readonly statusCode = 404;

  constructor(entity: string, id?: string) {
    super(id ? `${entity} with ID "${id}" not found` : `${entity} not found`);
  }
}
