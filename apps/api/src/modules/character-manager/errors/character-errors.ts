import { HttpException, HttpStatus } from '@nestjs/common';

export class ResourceNotFoundError extends HttpException {
  constructor(message = 'Recurso não encontrado') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class NotAllowedError extends HttpException {
  constructor(message = 'Ação não permitida') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class DomainValidationError extends HttpException {
  constructor(message: string, field?: string) {
    super({ message, field, error: 'Domain Validation Error' }, HttpStatus.BAD_REQUEST);
  }
}
