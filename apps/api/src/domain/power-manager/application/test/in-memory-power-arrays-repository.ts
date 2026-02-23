import type { PaginationParams } from '@/core/repositories/paginationParams';
import type { PowerArray } from '../../enterprise/entities/power-array';
import type { PowerArraysRepository } from '../repositories/power-arrays-repository';

export class InMemoryPowerArraysRepository implements PowerArraysRepository {
  public items: PowerArray[] = [];

  async findById(id: string): Promise<PowerArray | null> {
    const powerArray = this.items.find((item) => item.id.toString() === id);
    return powerArray ?? null;
  }

  async findMany(params: PaginationParams): Promise<PowerArray[]> {
    const startIndex = (params.page - 1) * 20;
    const endIndex = startIndex + 20;

    return this.items.slice(startIndex, endIndex);
  }

  async findByUserId(_userId: string, params: PaginationParams): Promise<PowerArray[]> {
    const startIndex = (params.page - 1) * 20;
    const endIndex = startIndex + 20;

    return this.items.slice(startIndex, endIndex);
  }

  async findByDomain(domainName: string, params: PaginationParams): Promise<PowerArray[]> {
    const filtered = this.items.filter((item) => item.dominio.name === domainName);

    const startIndex = (params.page - 1) * 20;
    const endIndex = startIndex + 20;

    return filtered.slice(startIndex, endIndex);
  }

  async create(powerArray: PowerArray): Promise<void> {
    this.items.push(powerArray);
  }

  async update(powerArray: PowerArray): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id.equals(powerArray.id));

    if (itemIndex >= 0) {
      this.items[itemIndex] = powerArray;
    }
  }

  async delete(id: string): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id.toString() === id);

    if (itemIndex >= 0) {
      this.items.splice(itemIndex, 1);
    }
  }
}
