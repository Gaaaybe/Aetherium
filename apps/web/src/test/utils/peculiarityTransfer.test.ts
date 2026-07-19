import { describe, expect, test } from 'vitest';
import { createPeculiarityExport, parsePeculiarityImport } from '@/features/criador-de-poder/utils/peculiarityTransfer';

describe('transferência de peculiaridades', () => {
  test('faz ida e volta do formato atual', () => {
    const exported = createPeculiarityExport({
      id: 'pec-1', userId: 'user-1', nome: 'Sangue Antigo', descricao: 'Uma herança.',
      espiritual: true, isPublic: true, icone: 'Sparkles', createdAt: '', updatedAt: null,
      userName: null,
    });
    expect(parsePeculiarityImport(exported).peculiarities[0]).toEqual({
      nome: 'Sangue Antigo', descricao: 'Uma herança.', espiritual: true,
      icone: 'Sparkles', isPublic: false, sourceId: 'pec-1',
    });
  });

  test('traduz campos legados e aceita backup em lote', () => {
    const result = parsePeculiarityImport({ peculiaridades: [
      { name: 'Mutação', description: 'Legado', isSpiritual: 'sim', icon: 'Dna' },
      { titulo: 'Tecnologia', lore: 'Implante', spiritual: 0 },
    ] });
    expect(result.peculiarities).toHaveLength(2);
    expect(result.peculiarities[0]).toMatchObject({ nome: 'Mutação', espiritual: true, icone: 'Dna' });
    expect(result.peculiarities[1]).toMatchObject({ nome: 'Tecnologia', espiritual: false });
  });

  test('ignora registros inválidos e relata aviso', () => {
    const result = parsePeculiarityImport([{ description: 'Sem nome' }, { nome: 'Válida' }]);
    expect(result.peculiarities).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
  });
});
