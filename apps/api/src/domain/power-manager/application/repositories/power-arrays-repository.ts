import type { PaginationParams } from '@/core/repositories/paginationParams';
import type { PowerArray } from '../../enterprise/entities/power-array';

export abstract class PowerArraysRepository {
  abstract findById(id: string): Promise<PowerArray | null>;
  abstract findMany(params: PaginationParams): Promise<PowerArray[]>;
  abstract findByUserId(userId: string, params: PaginationParams): Promise<PowerArray[]>;
  abstract findByDomain(domainName: string, params: PaginationParams): Promise<PowerArray[]>;
  abstract findPublic(params: PaginationParams): Promise<PowerArray[]>;
  abstract create(powerArray: PowerArray): Promise<void>;
  abstract update(powerArray: PowerArray): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
