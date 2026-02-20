import type { EffectBase } from '../../enterprise/entities/effect-base';

export interface EffectsRepository {
  findById(id: string): Promise<EffectBase | null>;
  findAll(): Promise<EffectBase[]>;
  findByCategory(category: string): Promise<EffectBase[]>;
  findCustomEffects(): Promise<EffectBase[]>;
  create(effect: EffectBase): Promise<void>;
  update(effect: EffectBase): Promise<void>;
  delete(id: string): Promise<void>;
}
