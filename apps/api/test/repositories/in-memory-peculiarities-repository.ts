import type { PaginationParams } from '@/core/repositories/paginationParams';
import type { PeculiaritiesRepository } from '@/domain/power-manager/application/repositories/peculiarities-repository';
import type { Peculiarity } from '@/domain/power-manager/enterprise/entities/peculiarity';

export class InMemoryPeculiaritiesRepository implements PeculiaritiesRepository {
  public items: Peculiarity[] = [];

  async findById(id: string): Promise<Peculiarity | null> {
    const peculiarity = this.items.find((item) => item.id.toString() === id);
    return peculiarity ?? null;
  }

  async findByUserId(userId: string, params: PaginationParams): Promise<Peculiarity[]> {
    const filtered = this.items.filter((item) => item.userId === userId);

    const startIndex = (params.page - 1) * 20;
    const endIndex = startIndex + 20;

    return filtered.slice(startIndex, endIndex);
  }

  async create(peculiarity: Peculiarity): Promise<void> {
    this.items.push(peculiarity);
  }

  async update(peculiarity: Peculiarity): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id.equals(peculiarity.id));

    if (itemIndex >= 0) {
      this.items[itemIndex] = peculiarity;
    }
  }

  async delete(id: string): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id.toString() === id);

    if (itemIndex >= 0) {
      this.items.splice(itemIndex, 1);
    }
  }
}
