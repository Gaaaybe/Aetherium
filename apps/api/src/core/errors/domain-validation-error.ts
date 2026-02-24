export class DomainValidationError extends Error {
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'DomainValidationError';
    this.field = field;
  }
}
