import type { UseCaseError } from '@/core/errors/use-case-errors';

export class InvalidVisibilityError extends Error implements UseCaseError {
  constructor(message?: string) {
    super(message ?? 'Operação de visibilidade inválida');
    this.name = 'InvalidVisibilityError';
  }
}
