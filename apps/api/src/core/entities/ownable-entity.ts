import { AggregateRoot } from './aggregate-root';

export abstract class OwnableEntity<Props> extends AggregateRoot<Props> {
  protected abstract get userId(): string | undefined;
  protected abstract get isPublic(): boolean;

  isOfficial(): boolean {
    return !this.userId;
  }

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  canBeAccessedBy(userId?: string): boolean {
    if (this.isOfficial()) return true;
    if (this.isPublic) return true;
    if (userId && this.isOwnedBy(userId)) return true;
    return false;
  }

  canBeEditedBy(userId?: string): boolean {
    if (this.isOfficial()) return false;
    if (!userId) return false;
    return this.isOwnedBy(userId);
  }
}
