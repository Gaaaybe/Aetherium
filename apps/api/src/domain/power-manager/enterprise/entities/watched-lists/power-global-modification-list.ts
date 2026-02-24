import { ValueObjectList } from '@/core/entities/value-object-list';
import type { AppliedModification } from '../value-objects/applied-modification';

export class PowerGlobalModificationList extends ValueObjectList<AppliedModification> {
  compareItems(a: AppliedModification, b: AppliedModification): boolean {
    return a.equals(b);
  }
}
