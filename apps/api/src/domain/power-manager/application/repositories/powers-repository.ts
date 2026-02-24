import type { PaginationParams } from '@/core/repositories/paginationParams';
import type { Power } from '../../enterprise/entities/power';

export interface PowersRepository {
  findById(id: string): Promise<Power | null>;
  findMany(params: PaginationParams): Promise<Power[]>;
  findByUserId(userId: string, params: PaginationParams): Promise<Power[]>;
  findByDomain(domainName: string, params: PaginationParams): Promise<Power[]>;
  findUserCreatedPowers(params: PaginationParams): Promise<Power[]>;
  findPublic(params: PaginationParams): Promise<Power[]>;
  create(power: Power): Promise<void>;
  update(power: Power): Promise<void>;
  delete(id: string): Promise<void>;
}
