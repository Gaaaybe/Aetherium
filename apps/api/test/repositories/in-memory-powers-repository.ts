import type { PaginationParams } from '@/core/repositories/paginationParams';
import type { Power } from '@/domain/power-manager/enterprise/entities/power';
import type { PowersRepository } from '@/domain/power-manager/application/repositories/powers-repository';

export class InMemoryPowersRepository implements PowersRepository {
  public items: Power[] = [];

  async findById(id: string): Promise<Power | null> {
    const power = this.items.find((item) => item.id.toString() === id);
    return power ?? null;
  }

  async findMany(params: PaginationParams): Promise<Power[]> {
    const startIndex = (params.page - 1) * 20;
    const endIndex = startIndex + 20;

    return this.items.slice(startIndex, endIndex);
  }

  async findByUserId(userId: string, params: PaginationParams): Promise<Power[]> {
    const filtered = this.items.filter((item) => item.userId === userId);

    const startIndex = (params.page - 1) * 20;
    const endIndex = startIndex + 20;

    return filtered.slice(startIndex, endIndex);
  }

  async findByDomain(domainName: string, params: PaginationParams): Promise<Power[]> {
    const filtered = this.items.filter((item) => item.dominio.name === domainName);

    const startIndex = (params.page - 1) * 20;
    const endIndex = startIndex + 20;

    return filtered.slice(startIndex, endIndex);
  }

  async findUserCreatedPowers(params: PaginationParams): Promise<Power[]> {
    const filtered = this.items.filter((item) => !item.isOfficial());

    const startIndex = (params.page - 1) * 20;
    const endIndex = startIndex + 20;

    return filtered.slice(startIndex, endIndex);
  }

  async findPublic(params: PaginationParams): Promise<Power[]> {
    const filtered = this.items.filter((item) => item.isOfficial() || item.isPublic);

    const startIndex = (params.page - 1) * 20;
    const endIndex = startIndex + 20;

    return filtered.slice(startIndex, endIndex);
  }

  async create(power: Power): Promise<void> {
    this.items.push(power);
  }

  async update(power: Power): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id.equals(power.id));

    if (itemIndex >= 0) {
      this.items[itemIndex] = power;
    }
  }

  async delete(id: string): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id.toString() === id);

    if (itemIndex >= 0) {
      this.items.splice(itemIndex, 1);
    }
  }
}
