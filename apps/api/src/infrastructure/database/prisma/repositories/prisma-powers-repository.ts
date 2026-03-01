import type { PaginationParams } from '@/core/repositories/paginationParams';
import { PowersRepository } from '@/domain/power-manager/application/repositories/powers-repository';
import type { Power } from '@/domain/power-manager/enterprise/entities/power';

export class PrismaPowersRepository extends PowersRepository {
  findById(_id: string): Promise<Power | null> {
    throw new Error('Method not implemented.');
  }
  findMany(_params: PaginationParams): Promise<Power[]> {
    throw new Error('Method not implemented.');
  }
  findByUserId(_userId: string, _params: PaginationParams): Promise<Power[]> {
    throw new Error('Method not implemented.');
  }
  findByDomain(_domainName: string, _params: PaginationParams): Promise<Power[]> {
    throw new Error('Method not implemented.');
  }
  findUserCreatedPowers(_params: PaginationParams): Promise<Power[]> {
    throw new Error('Method not implemented.');
  }
  findPublic(_params: PaginationParams): Promise<Power[]> {
    throw new Error('Method not implemented.');
  }
  create(_power: Power): Promise<void> {
    throw new Error('Method not implemented.');
  }
  update(_power: Power): Promise<void> {
    throw new Error('Method not implemented.');
  }
  delete(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
