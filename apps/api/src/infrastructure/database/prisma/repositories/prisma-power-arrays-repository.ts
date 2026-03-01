import type { PaginationParams } from '@/core/repositories/paginationParams';
import { PowerArraysRepository } from '@/domain/power-manager/application/repositories/power-arrays-repository';
import type { PowerArray } from '@/domain/power-manager/enterprise/entities/power-array';

export class PrismaPowerArraysRepository extends PowerArraysRepository {
  findById(_id: string): Promise<PowerArray | null> {
    throw new Error('Method not implemented.');
  }
  findMany(_params: PaginationParams): Promise<PowerArray[]> {
    throw new Error('Method not implemented.');
  }
  findByUserId(_userId: string, _params: PaginationParams): Promise<PowerArray[]> {
    throw new Error('Method not implemented.');
  }
  findByDomain(_domainName: string, _params: PaginationParams): Promise<PowerArray[]> {
    throw new Error('Method not implemented.');
  }
  findPublic(_params: PaginationParams): Promise<PowerArray[]> {
    throw new Error('Method not implemented.');
  }
  create(_powerArray: PowerArray): Promise<void> {
    throw new Error('Method not implemented.');
  }
  update(_powerArray: PowerArray): Promise<void> {
    throw new Error('Method not implemented.');
  }
  delete(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
