import type { PaginationParams } from '@/core/repositories/paginationParams';
import { PeculiaritiesRepository } from '@/domain/power-manager/application/repositories/peculiarities-repository';
import type { Peculiarity } from '@/domain/power-manager/enterprise/entities/peculiarity';

export class PrismaPeculiaritiesRepository extends PeculiaritiesRepository {
  findById(_id: string): Promise<Peculiarity | null> {
    throw new Error('Method not implemented.');
  }
  findByUserId(_userId: string, _params: PaginationParams): Promise<Peculiarity[]> {
    throw new Error('Method not implemented.');
  }
  create(_peculiarity: Peculiarity): Promise<void> {
    throw new Error('Method not implemented.');
  }
  update(_peculiarity: Peculiarity): Promise<void> {
    throw new Error('Method not implemented.');
  }
  delete(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
