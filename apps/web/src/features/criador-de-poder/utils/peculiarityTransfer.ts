import type { CreatePeculiaridadePayload, PeculiaridadeResponse } from '@/services/types';

export interface PeculiarityExportFile {
  schemaVersion: 1;
  type: 'aetherium-peculiarity';
  exportedAt: string;
  peculiarity: {
    sourceId: string;
    nome: string;
    descricao: string;
    espiritual: boolean;
    icone: string | null;
  };
}

export function createPeculiarityExport(
  peculiarity: PeculiaridadeResponse,
): PeculiarityExportFile {
  return {
    schemaVersion: 1,
    type: 'aetherium-peculiarity',
    exportedAt: new Date().toISOString(),
    peculiarity: {
      sourceId: peculiarity.id,
      nome: peculiarity.nome,
      descricao: peculiarity.descricao,
      espiritual: peculiarity.espiritual,
      icone: peculiarity.icone ?? null,
    },
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function readBoolean(record: Record<string, unknown>, keys: string[]): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', 'sim', 'yes', '1', 'espiritual'].includes(normalized)) return true;
      if (['false', 'não', 'nao', 'no', '0', 'material'].includes(normalized)) return false;
    }
    if (typeof value === 'number') return value !== 0;
  }
  return false;
}

export function parsePeculiarityImport(input: unknown): {
  peculiarities: Array<CreatePeculiaridadePayload & { sourceId?: string }>;
  warnings: string[];
} {
  const root = asRecord(input);
  const wrapped = root?.peculiarities ?? root?.peculiaridades ?? root?.peculiarity ?? root?.peculiaridade ?? root?.data ?? input;
  const candidates = Array.isArray(wrapped) ? wrapped : [wrapped];
  const peculiarities: Array<CreatePeculiaridadePayload & { sourceId?: string }> = [];
  const warnings: string[] = [];

  candidates.forEach((candidate, index) => {
    const record = asRecord(candidate);
    if (!record) {
      warnings.push(`Registro ${index + 1} ignorado: formato inválido.`);
      return;
    }

    const nome = readString(record, ['nome', 'name', 'title', 'titulo']);
    if (!nome) {
      warnings.push(`Registro ${index + 1} ignorado: nome ausente.`);
      return;
    }

    const descricao = readString(record, ['descricao', 'descrição', 'description', 'lore']) ?? '';
    const icone = readString(record, ['icone', 'ícone', 'icon', 'iconUrl', 'iconName']);
    const sourceId = readString(record, ['sourceId', 'source_id', 'originalId', 'id']);
    peculiarities.push({
      nome,
      descricao,
      espiritual: readBoolean(record, ['espiritual', 'spiritual', 'isSpiritual']),
      ...(icone ? { icone } : {}),
      isPublic: false,
      ...(sourceId ? { sourceId } : {}),
    });
  });

  if (peculiarities.length === 0) {
    throw new Error(warnings[0] ?? 'Nenhuma peculiaridade válida encontrada no arquivo.');
  }

  return { peculiarities, warnings };
}

export function safePeculiarityFilename(name: string): string {
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${normalized || 'peculiaridade'}.aetherium-peculiaridade.json`;
}
