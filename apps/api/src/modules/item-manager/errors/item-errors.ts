import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

export class ResourceNotFoundError extends NotFoundException {
  constructor(message = 'Resource not found') {
    super(message);
  }
}

export class InvalidItemDomainError extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export class NotAllowedError extends ForbiddenException {
  constructor(message = 'Not allowed') {
    super(message);
  }
}
