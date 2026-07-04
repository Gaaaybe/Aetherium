import { describe, expect, it } from 'vitest';
import { appliedEffectSchema } from './power.schemas.js';

describe('appliedEffectSchema validation', () => {
  it('should allow valid dano effect inputs', () => {
    const validDano = {
      effectBaseId: 'dano',
      grau: 3,
      inputValue: 'Fogo',
      modifications: [],
    };
    const parsed = appliedEffectSchema.safeParse(validDano);
    expect(parsed.success).toBe(true);
  });

  it('should reject dano effect inputs that exceed 30 characters', () => {
    const invalidDano = {
      effectBaseId: 'dano',
      grau: 3,
      inputValue: 'A'.repeat(31),
      modifications: [],
    };
    const parsed = appliedEffectSchema.safeParse(invalidDano);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toContain('O tipo/descritor de dano deve ter no máximo 30 caracteres');
    }
  });

  it('should allow other effects to have inputs exceeding 30 characters', () => {
    const otherEffect = {
      effectBaseId: 'outros',
      grau: 3,
      inputValue: 'A'.repeat(40),
      modifications: [],
    };
    const parsed = appliedEffectSchema.safeParse(otherEffect);
    expect(parsed.success).toBe(true);
  });
});
