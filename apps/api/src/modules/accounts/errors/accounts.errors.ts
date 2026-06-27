import { ConflictException, UnauthorizedException } from '@nestjs/common';

export class AlreadyExistsError extends ConflictException {
  constructor(message = 'Usuário com este e-mail já existe.') {
    super(message);
  }
}

export class WrongCredentialsError extends UnauthorizedException {
  constructor(message = 'Credenciais incorretas.') {
    super(message);
  }
}
