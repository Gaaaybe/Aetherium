import { WatchedList } from '@/core/entities/watched-list';
import type { AppliedEffect } from '../applied-effect';

export class PowerEffectList extends WatchedList<AppliedEffect> {
  compareItems(a: AppliedEffect, b: AppliedEffect): boolean {
    return a.id.equals(b.id);
  }
}
