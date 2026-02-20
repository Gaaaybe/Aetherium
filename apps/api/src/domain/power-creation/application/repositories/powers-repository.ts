import type { Power } from '../../enterprise/entities/power';
import type { PaginationParams } from '@/core/repositories/paginationParams';

export interface PowersRepository {
  findById(id: string): Promise<Power | null>;
  findMany(params: PaginationParams): Promise<Power[]>;
  findByUserId(userId: string, params: PaginationParams): Promise<Power[]>;
  findByDomain(domainName: string, params: PaginationParams): Promise<Power[]>;
  findCustomPowers(params: PaginationParams): Promise<Power[]>;
  create(power: Power): Promise<void>;
  update(power: Power): Promise<void>;
  delete(id: string): Promise<void>;
}
