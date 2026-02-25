import type { ModificationBase } from '../../enterprise/entities/modification-base';

export abstract class ModificationsRepository {
  abstract findById(id: string): Promise<ModificationBase | null>;
  abstract findAll(): Promise<ModificationBase[]>;
  abstract findByType(type: 'extra' | 'falha'): Promise<ModificationBase[]>;
  abstract findByCategory(category: string): Promise<ModificationBase[]>;
  abstract findCustomModifications(): Promise<ModificationBase[]>;
  abstract create(modification: ModificationBase): Promise<void>;
  abstract update(modification: ModificationBase): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
