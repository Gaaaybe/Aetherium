import type { EffectBase } from '../../enterprise/entities/effect-base';

export abstract class EffectsRepository {
  abstract findById(id: string): Promise<EffectBase | null>;
  abstract findAll(): Promise<EffectBase[]>;
  abstract findByCategory(category: string): Promise<EffectBase[]>;
  abstract findCustomEffects(): Promise<EffectBase[]>;
  abstract create(effect: EffectBase): Promise<void>;
  abstract update(effect: EffectBase): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
