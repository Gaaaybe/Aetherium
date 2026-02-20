import type { EffectsRepository } from '../repositories/effects-repository';
import type { EffectBase } from '../../enterprise/entities/effect-base';

export class InMemoryEffectsRepository implements EffectsRepository {
  public items: EffectBase[] = [];

  async findById(id: string): Promise<EffectBase | null> {
    const effect = this.items.find((item) => item.effectId === id);
    return effect ?? null;
  }

  async findAll(): Promise<EffectBase[]> {
    return this.items;
  }

  async findByCategory(category: string): Promise<EffectBase[]> {
    return this.items.filter((item) => item.categorias.includes(category));
  }

  async findCustomEffects(): Promise<EffectBase[]> {
    return this.items.filter((item) => item.custom);
  }

  async create(effect: EffectBase): Promise<void> {
    this.items.push(effect);
  }

  async update(effect: EffectBase): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id.equals(effect.id));

    if (itemIndex >= 0) {
      this.items[itemIndex] = effect;
    }
  }

  async delete(id: string): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.effectId === id);

    if (itemIndex >= 0) {
      this.items.splice(itemIndex, 1);
    }
  }
}
