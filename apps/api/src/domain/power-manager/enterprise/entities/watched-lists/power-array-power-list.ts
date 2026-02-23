import { WatchedList } from '@/core/entities/watched-list';
import type { Power } from '../power';

export class PowerArrayPowerList extends WatchedList<Power> {
  compareItems(a: Power, b: Power): boolean {
    return a.id.equals(b.id);
  }
}
