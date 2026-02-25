import type { PaginationParams } from '@/core/repositories/paginationParams';
import type { Power } from '../../enterprise/entities/power';

export abstract class PowersRepository {
  abstract findById(id: string): Promise<Power | null>;
  abstract findMany(params: PaginationParams): Promise<Power[]>;
  abstract findByUserId(userId: string, params: PaginationParams): Promise<Power[]>;
  abstract findByDomain(domainName: string, params: PaginationParams): Promise<Power[]>;
  abstract findUserCreatedPowers(params: PaginationParams): Promise<Power[]>;
  abstract findPublic(params: PaginationParams): Promise<Power[]>;
  abstract create(power: Power): Promise<void>;
  abstract update(power: Power): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
