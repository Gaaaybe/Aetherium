// ─── Domínio ──────────────────────────────────────────────────────────────────

export type DomainName =
  | 'natural'
  | 'sagrado'
  | 'sacrilegio'
  | 'psiquico'
  | 'cientifico'
  | 'peculiar'
  | 'arma-branca'
  | 'arma-fogo'
  | 'arma-tensao'
  | 'arma-explosiva'
  | 'arma-tecnologica'
  | 'desarmado';

export interface DominioResponse {
  name: DomainName;
  areaConhecimento: string | null;
  peculiarId: string | null;
  espiritual?: boolean | null;
}

// ─── Custo ────────────────────────────────────────────────────────────────────

export interface CustoResponse {
  pda: number;
  pe: number;
  espacos: number;
}

export interface CustoAlternativoResponse {
  tipo: 'pe' | 'pv' | 'atributo' | 'item' | 'material';
  quantidade: number;
  descricao?: string;
  atributo?: string;
  itemId?: string;
}

// ─── Modificação aplicada ─────────────────────────────────────────────────────

export interface ModificacaoAplicadaResponse {
  modificationBaseId: string;
  scope: 'global' | 'local';
  grau: number | null;
  parametros: Record<string, unknown> | null;
  nota: string | null;
}

// ─── Efeito aplicado ──────────────────────────────────────────────────────────

export interface EfeitoAplicadoResponse {
  id: string;
  effectBaseId: string;
  grau: number;
  configuracaoId: string | null;
  inputValue: string | number | null;
  dadoModularizado: string | null;
  custo: CustoResponse;
  modifications: ModificacaoAplicadaResponse[];
  nota: string | null;
}

// ─── Poder ────────────────────────────────────────────────────────────────────

export interface PoderResponse {
  id: string;
  userId: string | null;
  nome: string;
  descricao: string;
  isPublic: boolean;
  icone: string | null;
  notas: string | null;
  dominio: DominioResponse;
  parametros: { acao: number; alcance: number; duracao: number };
  custoTotal: CustoResponse;
  custoAlternativo: CustoAlternativoResponse | null;
  effects: EfeitoAplicadoResponse[];
  globalModifications: ModificacaoAplicadaResponse[];
  createdAt: string;
  updatedAt: string | null;
  userName: string | null;
}

// ─── Payload criação/atualização de Poder ─────────────────────────────────────

export interface ModificacaoAplicadaPayload {
  modificationBaseId: string;
  scope: 'global' | 'local';
  grau?: number;
  parametros?: Record<string, unknown>;
  nota?: string;
}

export interface EfeitoAplicadoPayload {
  effectBaseId: string;
  grau: number;
  configuracaoId?: string;
  inputValue?: string | number;
  dadoModularizado?: string;
  modifications?: ModificacaoAplicadaPayload[];
  nota?: string;
}

export interface CustoAlternativoPayload {
  tipo: 'pe' | 'pv' | 'atributo' | 'item' | 'material';
  quantidade: number;
  descricao?: string;
  atributo?: string;
  itemId?: string;
}

export interface CreatePoderPayload {
  nome: string;
  descricao: string;
  dominio: { name: DomainName; areaConhecimento?: string; peculiarId?: string };
  parametros: { acao: number; alcance: number; duracao: number };
  effects: EfeitoAplicadoPayload[];
  globalModifications?: ModificacaoAplicadaPayload[];
  custoAlternativo?: CustoAlternativoPayload;
  isPublic?: boolean;
  notas?: string;
  icone?: string;
}

export type UpdatePoderPayload = Omit<Partial<CreatePoderPayload>, 'icone'> & {
  icone?: string | null;
};

// ─── Acervo ───────────────────────────────────────────────────────────────────

export interface AcervoResponse {
  id: string;
  userId: string | null;
  nome: string;
  descricao: string;
  isPublic: boolean;
  icone: string | null;
  notas: string | null;
  dominio: DominioResponse;
  parametrosBase: { acao: number; alcance: number; duracao: number } | null;
  custoTotal: CustoResponse;
  powers: PoderResponse[];
  createdAt: string;
  updatedAt: string | null;
  userName: string | null;
}

export interface CreateAcervoPayload {
  nome: string;
  descricao: string;
  dominio: { name: DomainName; areaConhecimento?: string; peculiarId?: string };
  powerIds: string[];
  parametrosBase?: { acao: number; alcance: number; duracao: number };
  isPublic?: boolean;
  notas?: string;
  icone?: string;
}

export type UpdateAcervoPayload = Omit<Partial<CreateAcervoPayload>, 'icone'> & {
  icone?: string | null;
};

// ─── Itens ───────────────────────────────────────────────────────────────────

export type ItemType =
  | 'weapon'
  | 'defensive-equipment'
  | 'consumable'
  | 'artifact'
  | 'accessory'
  | 'general'
  | 'upgrade-material';

export type WeaponRange = 'adjacente' | 'natural' | 'curto' | 'medio' | 'longo';
export type EquipmentType = 'traje' | 'protecao';
export type DurabilityStatus = 'INTACTO' | 'DANIFICADO';
export type SpoilageState = 'PERFEITA' | 'BOA' | 'NORMAL' | 'RUIM' | 'TERRIVEL';

export interface DamageDescriptorResponse {
  dado: string;
  base: string;
  espiritual: boolean;
  tipoDano?: string | null;
}

export interface ItemBaseResponse {
  id: string;
  userId: string | null;
  characterId: string | null;
  tipo: ItemType;
  nome: string;
  descricao: string;
  isPublic: boolean;
  canStack: boolean;
  maxStack: number;
  icone: string | null;
  notas: string | null;
  dominio: DominioResponse;
  dominios: DominioResponse[];
  custoBase: number;
  nivelItem: number;
  valorBase: number;
  precoVenda: number;
  durabilidade: DurabilityStatus;
  powerIds: string[];
  powerArrayIds: string[];
  createdAt: string;
  updatedAt: string | null;
  userName: string | null;
}

export interface WeaponItemResponse extends ItemBaseResponse {
  tipo: 'weapon';
  danos: DamageDescriptorResponse[];
  upgradeLevel: number;
  upgradeLevelMax: number;
  critMargin: number;
  critMultiplier: number;
  alcance: WeaponRange;
  alcanceExtraMetros: number;
  atributoEscalonamento: string | null;
}

export interface DefensiveItemResponse extends ItemBaseResponse {
  tipo: 'defensive-equipment';
  tipoEquipamento: EquipmentType;
  baseRD: number;
  rdAtual: number;
  upgradeLevel: number;
  upgradeLevelMax: number;
  atributoEscalonamento: string | null;
}

export interface ConsumableItemResponse extends ItemBaseResponse {
  tipo: 'consumable';
  descritorEfeito: string;
  qtdDoses: number;
  isRefeicao: boolean;
  spoilageState: SpoilageState | null;
}

export interface ArtifactItemResponse extends ItemBaseResponse {
  tipo: 'artifact';
  isAttuned: boolean;
}

export interface AccessoryItemResponse extends ItemBaseResponse {
  tipo: 'accessory';
}

export interface GeneralItemResponse extends ItemBaseResponse {
  tipo: 'general';
}

export interface UpgradeMaterialItemResponse extends ItemBaseResponse {
  tipo: 'upgrade-material';
  tier: number;
  maxUpgradeLimit: number;
}

export type ItemResponse =
  | WeaponItemResponse
  | DefensiveItemResponse
  | ConsumableItemResponse
  | ArtifactItemResponse
  | AccessoryItemResponse
  | GeneralItemResponse
  | UpgradeMaterialItemResponse;

export interface DamageDescriptorPayload {
  dado: string;
  base: string;
  espiritual: boolean;
  tipoDano?: string | null;
}

interface ItemCommonPayload {
  nome: string;
  descricao: string;
  dominio?: { name: DomainName; areaConhecimento?: string; peculiarId?: string };
  dominios: { name: DomainName; areaConhecimento?: string; peculiarId?: string }[];
  custoBase: number;
  nivelItem?: number;
  isPublic?: boolean;
  notas?: string;
  powerIds?: string[];
  powerArrayIds?: string[];
  icone?: string;
}

export type CreateItemPayload =
  | (ItemCommonPayload & {
      tipo: 'weapon';
      danos: DamageDescriptorPayload[];
      critMargin: number;
      critMultiplier: number;
      alcance: WeaponRange;
      alcanceExtraMetros?: number;
      atributoEscalonamento?: string;
      upgradeLevel?: number;
    })
  | (ItemCommonPayload & {
      tipo: 'defensive-equipment';
      tipoEquipamento: EquipmentType;
      baseRD?: number;
      atributoEscalonamento?: string;
      upgradeLevel?: number;
    })
  | (ItemCommonPayload & {
      tipo: 'consumable';
      descritorEfeito: string;
      qtdDoses: number;
      isRefeicao: boolean;
    })
  | (ItemCommonPayload & { tipo: 'artifact' })
  | (ItemCommonPayload & { tipo: 'accessory' })
  | (ItemCommonPayload & { tipo: 'general' })
  | (ItemCommonPayload & {
      tipo: 'upgrade-material';
      tier: number;
      maxUpgradeLimit: number;
    });

interface ItemCommonUpdatePayload extends Omit<Partial<ItemCommonPayload>, 'icone'> {
  icone?: string | null;
}

export type UpdateItemPayload =
  | (ItemCommonUpdatePayload & {
      tipo: 'weapon';
      danos?: DamageDescriptorPayload[];
      critMargin?: number;
      critMultiplier?: number;
      alcance?: WeaponRange;
      alcanceExtraMetros?: number;
      atributoEscalonamento?: string;
      upgradeLevel?: number;
    })
  | (ItemCommonUpdatePayload & {
      tipo: 'defensive-equipment';
      tipoEquipamento?: EquipmentType;
      baseRD?: number;
      atributoEscalonamento?: string;
      upgradeLevel?: number;
    })
  | (ItemCommonUpdatePayload & {
      tipo: 'consumable';
      descritorEfeito?: string;
      qtdDoses?: number;
    })
  | (ItemCommonUpdatePayload & { tipo: 'artifact' })
  | (ItemCommonUpdatePayload & { tipo: 'accessory' })
  | (ItemCommonUpdatePayload & { tipo: 'general' })
  | (ItemCommonUpdatePayload & {
      tipo: 'upgrade-material';
      tier?: number;
      maxUpgradeLimit?: number;
    });

// ─── Peculiaridade ────────────────────────────────────────────────────────────

export interface PeculiaridadeResponse {
  id: string;
  userId: string;
  nome: string;
  descricao: string;
  espiritual: boolean;
  isPublic: boolean;
  icone: string | null;
  createdAt: string;
  updatedAt: string | null;
  userName: string | null;
}

export interface CreatePeculiaridadePayload {
  nome: string;
  descricao: string;
  espiritual: boolean;
  isPublic?: boolean;
  icone?: string;
}

export type UpdatePeculiaridadePayload = Omit<
  Partial<CreatePeculiaridadePayload>,
  'icone'
> & {
  icone?: string | null;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  masterConfirm?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface DecodedToken {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}
