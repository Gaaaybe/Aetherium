
export abstract class ValueObjectList<T> {
  private currentItems: T[];
  private initial: T[];

  constructor(initialItems?: T[]) {
    this.currentItems = initialItems ? [...initialItems] : [];
    this.initial = initialItems ? [...initialItems] : [];
  }

  abstract compareItems(a: T, b: T): boolean;

  public getItems(): T[] {
    return this.currentItems;
  }

  public getNewItems(): T[] {
    const remaining = [...this.initial];
    const added: T[] = [];

    for (const item of this.currentItems) {
      const idx = remaining.findIndex((r) => this.compareItems(r, item));
      if (idx >= 0) {
        remaining.splice(idx, 1);
      } else {
        added.push(item);
      }
    }

    return added;
  }

  public getRemovedItems(): T[] {
    const remaining = [...this.currentItems];
    const removed: T[] = [];

    for (const item of this.initial) {
      const idx = remaining.findIndex((r) => this.compareItems(r, item));
      if (idx >= 0) {
        remaining.splice(idx, 1);
      } else {
        removed.push(item);
      }
    }

    return removed;
  }

  public exists(item: T): boolean {
    return this.currentItems.some((v) => this.compareItems(v, item));
  }

  public add(item: T): void {
    this.currentItems.push(item);
  }

  public remove(item: T): void {
    const idx = this.currentItems.findIndex((v) => this.compareItems(v, item));
    if (idx >= 0) {
      this.currentItems.splice(idx, 1);
    }
  }

  public update(items: T[]): void {
    this.currentItems = [...items];
  }
}
