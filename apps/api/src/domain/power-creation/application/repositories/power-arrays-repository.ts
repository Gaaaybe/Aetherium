import type { PowerArray } from '../../enterprise/entities/power-array';
import type { PaginationParams } from '@/core/repositories/paginationParams';

export interface PowerArraysRepository {
  findById(id: string): Promise<PowerArray | null>;
  findMany(params: PaginationParams): Promise<PowerArray[]>;
  findByUserId(userId: string, params: PaginationParams): Promise<PowerArray[]>;
  findByDomain(domainName: string, params: PaginationParams): Promise<PowerArray[]>;
  create(powerArray: PowerArray): Promise<void>;
  update(powerArray: PowerArray): Promise<void>;
  delete(id: string): Promise<void>;
}
