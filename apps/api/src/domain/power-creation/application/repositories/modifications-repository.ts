import type { ModificationBase } from '../../enterprise/entities/modification-base';

export interface ModificationsRepository {
  findById(id: string): Promise<ModificationBase | null>;
  findAll(): Promise<ModificationBase[]>;
  findByType(type: 'extra' | 'falha'): Promise<ModificationBase[]>;
  findByCategory(category: string): Promise<ModificationBase[]>;
  findCustomModifications(): Promise<ModificationBase[]>;
  create(modification: ModificationBase): Promise<void>;
  update(modification: ModificationBase): Promise<void>;
  delete(id: string): Promise<void>;
}
