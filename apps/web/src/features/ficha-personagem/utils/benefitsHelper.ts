import { CharacterResponse } from '@/services/characters.types';
import { WeaponItemResponse } from '@/services/types';

// Mapa de DomainName (enum value) → label legível (usado no nome do benefício)
export const DOMINIO_LABEL_MAP: Record<string, string> = {
  'arma-branca': 'Arma Branca',
  'arma-fogo': 'Arma de Fogo',
  'arma-tensao': 'Arma de Tensão',
  'arma-explosiva': 'Arma Explosiva',
  'arma-tecnologica': 'Arma Tecnológica',
  'desarmado': 'Desarmado',
  'natural': 'Natural',
  'sagrado': 'Sagrado',
  'sacrilegio': 'Sacrilégio',
  'psiquico': 'Psíquico',
  'cientifico': 'Científico',
  'peculiar': 'Peculiar',
};

// Lista de domínios que fazem sentido para o benefício de crítico aprimorado
export const DOMINIOS_CRITICO_APRIMORADO = [
  { value: 'arma-branca', label: 'Arma Branca' },
  { value: 'arma-fogo', label: 'Arma de Fogo' },
  { value: 'arma-tensao', label: 'Arma de Tensão' },
  { value: 'arma-explosiva', label: 'Arma Explosiva' },
  { value: 'arma-tecnologica', label: 'Arma Tecnológica' },
  { value: 'desarmado', label: 'Desarmado' },
];

export const CRITICO_APRIMORADO_BASE_NAME = 'Crítico aprimorado para';

/**
 * Obtém o grau de um benefício possuído pelo personagem.
 */
export function obterGrauBeneficio(character: CharacterResponse, nomeBeneficio: string): number {
  if (!character.benefits) return 0;
  const benefit = character.benefits.find(
    (b) => b.name.trim().toLowerCase() === nomeBeneficio.trim().toLowerCase()
  );
  return benefit ? benefit.degree : 0;
}

/**
 * Retorna a redução total de margem de crítico para uma arma específica,
 * somando todos os benefícios "Crítico aprimorado para - [dominio]" que se
 * aplicam aos domínios da arma. Máx de 3 por instância de benefício.
 */
export function obterReducaoCriticoParaArma(
  character: CharacterResponse,
  weapon: WeaponItemResponse | null | undefined,
  isDesarmado = false
): number {
  if (!character.benefits) return 0;

  const criticosBeneficios = character.benefits.filter(
    (b) => b.name.trim().toLowerCase().startsWith(CRITICO_APRIMORADO_BASE_NAME.toLowerCase())
  );

  if (criticosBeneficios.length === 0) return 0;

  let totalReducao = 0;

  for (const b of criticosBeneficios) {
    // Extrair o domínio do nome: "Crítico aprimorado para - arma-fogo" → "arma-fogo"
    const partes = b.name.split(' - ');
    if (partes.length < 2) continue;
    const dominioBeneficio = partes[1].trim().toLowerCase();

    // Para ataque desarmado
    if (isDesarmado && dominioBeneficio === 'desarmado') {
      totalReducao += Math.min(3, b.degree);
      continue;
    }

    // Para arma: verificar se qualquer domínio da arma bate com o domínio do benefício
    if (weapon) {
      const dominiosDaArma = [
        weapon.dominio?.name,
        ...(weapon.dominios || []).map(d => d.name)
      ].filter(Boolean).map(d => (d as string).toLowerCase());

      if (dominiosDaArma.includes(dominioBeneficio)) {
        totalReducao += Math.min(3, b.degree);
      }
    }
  }

  return totalReducao;
}

/**
 * Verifica se uma arma é considerada de ataque à distância.
 */
export function isArmaDistancia(weapon: WeaponItemResponse | null | undefined): boolean {
  if (!weapon) return false;
  // Alcances à distância: curto, medio, longo
  const alcance = (weapon.alcance || '').toLowerCase();
  return ['curto', 'medio', 'longo'].includes(alcance);
}

/**
 * Verifica se uma arma é considerada de ataque corpo-a-corpo.
 */
export function isArmaCorpoACorpo(weapon: WeaponItemResponse | null | undefined): boolean {
  if (!weapon) return false;
  // Alcances corpo-a-corpo: adjacente, natural
  const alcance = (weapon.alcance || '').toLowerCase();
  return ['adjacente', 'natural'].includes(alcance);
}


