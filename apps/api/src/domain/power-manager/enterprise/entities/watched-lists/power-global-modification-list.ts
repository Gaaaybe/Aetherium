import { WatchedList } from '@/core/entities/watched-list';
import type { AppliedModification } from '../value-objects/applied-modification';

export class PowerGlobalModificationList extends WatchedList<AppliedModification> {
  compareItems(a: AppliedModification, b: AppliedModification): boolean {
    return a.equals(b);
  }
}
