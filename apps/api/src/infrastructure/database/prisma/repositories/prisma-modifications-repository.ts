import { ModificationsRepository } from '@/domain/power-manager/application/repositories/modifications-repository';
import type { ModificationBase } from '@/domain/power-manager/enterprise/entities/modification-base';

export class PrismaModificationsRepository extends ModificationsRepository {
  findById(_id: string): Promise<ModificationBase | null> {
    throw new Error('Method not implemented.');
  }
  findAll(): Promise<ModificationBase[]> {
    throw new Error('Method not implemented.');
  }
  findByType(_type: 'extra' | 'falha'): Promise<ModificationBase[]> {
    throw new Error('Method not implemented.');
  }
  findByCategory(_category: string): Promise<ModificationBase[]> {
    throw new Error('Method not implemented.');
  }
  findCustomModifications(): Promise<ModificationBase[]> {
    throw new Error('Method not implemented.');
  }
  create(_modification: ModificationBase): Promise<void> {
    throw new Error('Method not implemented.');
  }
  update(_modification: ModificationBase): Promise<void> {
    throw new Error('Method not implemented.');
  }
  delete(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
