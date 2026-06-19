import { BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

export class ResourceNotFoundError extends NotFoundException {
  constructor(message = 'Recurso não encontrado') {
    super(message);
  }
}

export class InvalidVisibilityError extends BadRequestException {
  constructor(message = 'Visibilidade inválida') {
    super(message);
  }
}

export class NotAllowedError extends ForbiddenException {
  constructor(message = 'Ação não permitida') {
    super(message);
  }
}

export class DependencyConflictError extends ConflictException {
  constructor(message = 'Conflito de dependência de poder') {
    super(message);
  }
}
