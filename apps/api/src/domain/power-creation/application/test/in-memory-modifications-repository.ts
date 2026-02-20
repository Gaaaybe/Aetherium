import type { ModificationsRepository } from '../repositories/modifications-repository';
import type { ModificationBase } from '../../enterprise/entities/modification-base';

export class InMemoryModificationsRepository implements ModificationsRepository {
  public items: ModificationBase[] = [];

  async findById(id: string): Promise<ModificationBase | null> {
    const modification = this.items.find((item) => item.modificationId === id);
    return modification ?? null;
  }

  async findAll(): Promise<ModificationBase[]> {
    return this.items;
  }

  async findByType(type: 'extra' | 'falha'): Promise<ModificationBase[]> {
    return this.items.filter((item) => item.tipo === type);
  }

  async findByCategory(category: string): Promise<ModificationBase[]> {
    return this.items.filter((item) => item.categoria === category);
  }

  async findCustomModifications(): Promise<ModificationBase[]> {
    return this.items.filter((item) => item.custom);
  }

  async create(modification: ModificationBase): Promise<void> {
    this.items.push(modification);
  }

  async update(modification: ModificationBase): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id.equals(modification.id));

    if (itemIndex >= 0) {
      this.items[itemIndex] = modification;
    }
  }

  async delete(id: string): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.modificationId === id);

    if (itemIndex >= 0) {
      this.items.splice(itemIndex, 1);
    }
  }
}
