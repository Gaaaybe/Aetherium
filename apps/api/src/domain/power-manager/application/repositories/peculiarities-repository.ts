import type { PaginationParams } from '@/core/repositories/paginationParams';
import type { Peculiarity } from '../../enterprise/entities/peculiarity';

export abstract class PeculiaritiesRepository {
  abstract findById(id: string): Promise<Peculiarity | null>;
  abstract findByUserId(userId: string, params: PaginationParams): Promise<Peculiarity[]>;
  abstract create(peculiarity: Peculiarity): Promise<void>;
  abstract update(peculiarity: Peculiarity): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
