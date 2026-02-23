import type { PaginationParams } from '@/core/repositories/paginationParams';
import type { Peculiarity } from '../../enterprise/entities/peculiarity';

export interface PeculiaritiesRepository {
  findById(id: string): Promise<Peculiarity | null>;
  findByUserId(userId: string, params: PaginationParams): Promise<Peculiarity[]>;
  create(peculiarity: Peculiarity): Promise<void>;
  update(peculiarity: Peculiarity): Promise<void>;
  delete(id: string): Promise<void>;
}
