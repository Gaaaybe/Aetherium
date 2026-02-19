import type { UseCaseError } from './use-case-errors';

export class NotAllowedError extends Error implements UseCaseError {
  constructor() {
    super('Not Allowed Error');
  }
}
