import { EffectsRepository } from '@/domain/power-manager/application/repositories/effects-repository';
import type { EffectBase } from '@/domain/power-manager/enterprise/entities/effect-base';

export class PrismaEffectsRepository extends EffectsRepository {
  findById(_id: string): Promise<EffectBase | null> {
    throw new Error('Method not implemented.');
  }
  findAll(): Promise<EffectBase[]> {
    throw new Error('Method not implemented.');
  }
  findByCategory(_category: string): Promise<EffectBase[]> {
    throw new Error('Method not implemented.');
  }
  findCustomEffects(): Promise<EffectBase[]> {
    throw new Error('Method not implemented.');
  }
  create(_effect: EffectBase): Promise<void> {
    throw new Error('Method not implemented.');
  }
  update(_effect: EffectBase): Promise<void> {
    throw new Error('Method not implemented.');
  }
  delete(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
