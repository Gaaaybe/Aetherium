import type { UseCaseError } from './use-case-errors';

export class AlreadyExistsError extends Error implements UseCaseError {
  constructor() {
    super('Resource already exists');
  }
}
