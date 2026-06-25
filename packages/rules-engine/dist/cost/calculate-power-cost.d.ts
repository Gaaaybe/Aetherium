export interface UniversalTableRow {
    grau: number;
    pe: number;
    espacos: number;
    dano?: string;
    distancia?: string;
    massa?: string;
    tempo?: string;
    velocidade?: string;
    deslocamento?: string;
}
export declare const UNIVERSAL_TABLE: UniversalTableRow[];
export interface AppliedModificationInput {
    modificationBaseId: string;
    grau: number;
    parametros?: {
        opcao?: string;
        configuracaoSelecionada?: string;
        [key: string]: any;
    } | null;
    posicao?: number;
}
export interface AppliedEffectInput {
    id: string;
    effectBaseId: string;
    grau: number;
    configuracaoId?: string | null;
    inputValue?: string | null;
    posicao?: number;
    modifications: AppliedModificationInput[];
}
export interface PowerParametersInput {
    acao: number;
    alcance: number;
    duracao: number;
}
export interface EffectBaseCatalogItem {
    id: string;
    nome: string;
    custoBase: number;
    parametrosPadraoAcao: number;
    parametrosPadraoAlcance: number;
    parametrosPadraoDuracao: number;
    configuracoes?: {
        tipo: string;
        label: string;
        opcoes: Array<{
            id: string;
            nome: string;
            modificadorCusto: number;
            grauMinimo?: number;
            descricao: string;
            custoProgressivo?: string;
        }>;
    } | null;
}
export interface ModificationBaseCatalogItem {
    id: string;
    nome: string;
    tipo: 'extra' | 'falha';
    custoFixo: number;
    custoPorGrau: number;
    configuracoes?: {
        tipo: string;
        label: string;
        opcoes: Array<{
            id: string;
            nome: string;
            modificadorCusto?: number;
            modificadorCustoFixo?: number;
            descricao: string;
        }>;
    } | null;
}
export interface PowerCost {
    pda: number;
    pe: number;
    espacos: number;
}
export interface PowerCostCalculationResult {
    custoTotal: PowerCost;
    custoPorEfeito: Record<string, PowerCost>;
}
export interface PowerCostCalculationInput {
    effects: AppliedEffectInput[];
    parametros: PowerParametersInput;
    globalModifications?: AppliedModificationInput[];
    effectBases: Record<string, EffectBaseCatalogItem>;
    modificationBases: Record<string, ModificationBaseCatalogItem>;
}
export declare function calculatePowerCost({ effects, parametros, globalModifications, effectBases, modificationBases, }: PowerCostCalculationInput): {
    success: boolean;
    error?: string;
    result?: PowerCostCalculationResult;
};
