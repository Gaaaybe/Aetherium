import { BookOpen, Copy, Eye, FileText, FlaskConical, Gem, Package, RefreshCw, Shield, Sparkles, Star, Sword, Zap } from 'lucide-react';
import { Button, Card, CardContent, Modal, ModalFooter, toast, DynamicIcon } from '@/shared/ui';
import { DOMINIOS } from '@/data';
import { getThemeByItemType, PatternOverlay } from '@/shared/utils/summary-themes';
import type { AcervoResponse, DomainName, ItemResponse, PoderResponse, SpoilageState, WeaponRange } from '@/services/types';

interface ResumoItemProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: string;
  nome: string;
  icone?: string;
  descricao: string;
  dominio?: {
    name: DomainName;
    areaConhecimento?: string;
    peculiarId?: string;
  };
  dominios?: {
    name: DomainName;
    areaConhecimento?: string;
    peculiarId?: string;
  }[];
  custoBase: number;
  nivelCalculado: number;
  custoRealCalculado: number;
  precoVendaCalculado: number;
  selectedPowers: PoderResponse[];
  selectedPowerArrays: AcervoResponse[];
  onOpenPowerDetails: (powerId: string) => void;
  onOpenPowerArrayDetails: (powerArrayId: string) => void;
  itemData?: ItemResponse;
  isLoadingVinculos?: boolean;
}

function tipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    weapon: 'Arma',
    'defensive-equipment': 'Equipamento Defensivo',
    consumable: 'Consumível',
    artifact: 'Artefato',
    accessory: 'Acessório',
  };

  return labels[tipo] ?? tipo;
}

function tipoIconFallback(tipo: string) {
  if (tipo === 'weapon') return <Sword className="w-16 h-16 text-white/80" />;
  if (tipo === 'defensive-equipment') return <Shield className="w-16 h-16 text-white/80" />;
  if (tipo === 'consumable') return <FlaskConical className="w-16 h-16 text-white/80" />;
  if (tipo === 'artifact') return <Gem className="w-16 h-16 text-white/80" />;
  return <Package className="w-16 h-16 text-white/80" />;
}

function dominiosLabel(dominios?: ResumoItemProps['dominios'], singleDominio?: ResumoItemProps['dominio']): string {
  const doms = dominios !== undefined
    ? dominios
    : singleDominio
      ? [singleDominio]
      : [];

  if (doms.length === 0) return 'Sem domínio';

  return doms.map(d => {
    const base = DOMINIOS.find((dom) => dom.id === d.name)?.nome ?? d.name;
    if (d.name === 'cientifico' && d.areaConhecimento) {
      return `${base} - ${d.areaConhecimento}`;
    }
    return base;
  }).join(', ');
}

function alcanceLabel(alcance: WeaponRange): string {
  const labels: Record<WeaponRange, string> = {
    adjacente: 'Adjacente',
    natural: 'Natural',
    curto: 'Curto',
    medio: 'Médio',
    longo: 'Longo',
  };
  return labels[alcance];
}

function spoilageLabel(state: SpoilageState): string {
  const labels: Record<SpoilageState, string> = {
    PERFEITA: 'Perfeita',
    BOA: 'Boa',
    NORMAL: 'Normal',
    RUIM: 'Ruim',
    TERRIVEL: 'Terrível',
  };
  return labels[state];
}

function TypeSpecificStats({ itemData }: { itemData: ItemResponse }) {
  switch (itemData.tipo) {
    case 'weapon':
      return (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2 mb-4">
              <Sword className="w-4 h-4" /> Estatísticas de Arma
            </p>
            {itemData.danos.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Dano</p>
                <div className="space-y-1">
                  {itemData.danos.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                      <span className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">{d.dado}</span>
                      <span className="text-xs text-gray-500 flex-1">base: {d.base}</span>
                      {d.espiritual && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                          <Zap className="w-3 h-3" /> Espiritual
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Alcance</p>
                <p className="font-semibold text-sm">
                  {alcanceLabel(itemData.alcance)}
                  {itemData.alcanceExtraMetros > 0 && (
                    <span className="text-xs text-gray-500 ml-1">+{itemData.alcanceExtraMetros}m</span>
                  )}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Crítico</p>
                <p className="font-semibold text-sm">{itemData.critMargin}–20 / ×{itemData.critMultiplier}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Aprimoramento</p>
                <p className="font-semibold text-sm">+{itemData.upgradeLevel} / +{itemData.upgradeLevelMax}</p>
              </div>
              {itemData.atributoEscalonamento && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Escalonamento</p>
                  <p className="font-semibold text-sm">{itemData.atributoEscalonamento}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );

    case 'defensive-equipment':
      return (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4" /> Estatísticas de Equipamento
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Tipo</p>
                <p className="font-semibold text-sm">{itemData.tipoEquipamento === 'traje' ? 'Traje' : 'Proteção'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">RD Base</p>
                <p className="font-semibold text-sm">{itemData.baseRD}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">RD Atual</p>
                <p className="font-semibold text-sm">{itemData.rdAtual}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Aprimoramento</p>
                <p className="font-semibold text-sm">+{itemData.upgradeLevel} / +{itemData.upgradeLevelMax}</p>
              </div>
              {itemData.atributoEscalonamento && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 sm:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Escalonamento</p>
                  <p className="font-semibold text-sm">{itemData.atributoEscalonamento}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );

    case 'consumable':
      return (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2 mb-4">
              <FlaskConical className="w-4 h-4" /> Estatísticas de Consumível
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Doses</p>
                <p className="font-semibold text-sm">{itemData.qtdDoses}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Tipo</p>
                <p className="font-semibold text-sm">{itemData.isRefeicao ? 'Refeição' : 'Consumível'}</p>
              </div>
              {itemData.spoilageState && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Qualidade</p>
                  <p className="font-semibold text-sm">{spoilageLabel(itemData.spoilageState)}</p>
                </div>
              )}
            </div>
            {itemData.descritorEfeito && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Efeito</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                  {itemData.descritorEfeito}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'artifact':
      return (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2 mb-4">
              <Gem className="w-4 h-4" /> Estatísticas de Artefato
            </p>
            <div className="flex items-center gap-2">
              <Star className={`w-5 h-5 ${itemData.isAttuned ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
              <span className={`font-semibold text-sm ${itemData.isAttuned ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500'}`}>
                {itemData.isAttuned ? 'Sintonizado' : 'Não Sintonizado'}
              </span>
            </div>
          </CardContent>
        </Card>
      );

    default:
      return null;
  }
}

export function ResumoItem({
  isOpen,
  onClose,
  tipo,
  nome,
  icone,
  descricao,
  dominio,
  dominios,
  custoBase,
  nivelCalculado,
  custoRealCalculado,
  precoVendaCalculado,
  selectedPowers,
  selectedPowerArrays,
  onOpenPowerDetails,
  onOpenPowerArrayDetails,
  itemData,
  isLoadingVinculos,
}: ResumoItemProps) {
  const itemIcon = icone?.trim() ?? '';

  const copiarResumo = () => {
    const linhas = [
      `=== ${nome || 'Item sem nome'} ===`,
      `Tipo: ${tipoLabel(tipo)}`,
      `Domínio: ${dominiosLabel(dominios, dominio)}`,
      `Descrição: ${descricao || 'Sem descrição'}`,
      `Custo Base: ${custoBase} | Nível: ${nivelCalculado} | Custo Real: ${custoRealCalculado} | Preço Venda: ${precoVendaCalculado}`,
    ];

    if (itemData && itemData.tipo === 'weapon') {
      linhas.push(
        `Danos: ${itemData.danos.map((d) => `${d.dado} (${d.base}${d.espiritual ? ', espiritual' : ''})`).join(', ')}`,
        `Alcance: ${alcanceLabel(itemData.alcance)}${itemData.alcanceExtraMetros > 0 ? ` +${itemData.alcanceExtraMetros}m` : ''} | Crítico: ${itemData.critMargin}–20 / ×${itemData.critMultiplier}`,
      );
    } else if (itemData && itemData.tipo === 'defensive-equipment') {
      linhas.push(
        `Tipo: ${itemData.tipoEquipamento === 'traje' ? 'Traje' : 'Proteção'} | RD Base: ${itemData.baseRD} | RD Atual: ${itemData.rdAtual}`,
      );
    } else if (itemData && itemData.tipo === 'consumable') {
      linhas.push(
        `Doses: ${itemData.qtdDoses} | ${itemData.isRefeicao ? 'Refeição' : 'Consumível'}${itemData.spoilageState ? ` | Qualidade: ${spoilageLabel(itemData.spoilageState)}` : ''}`,
      );
      if (itemData.descritorEfeito) linhas.push(`Efeito: ${itemData.descritorEfeito}`);
    }

    linhas.push(
      `Poderes (${selectedPowers.length}): ${selectedPowers.map((p) => p.nome).join(', ') || '-'}`,
      `Acervos (${selectedPowerArrays.length}): ${selectedPowerArrays.map((a) => a.nome).join(', ') || '-'}`,
    );

    navigator.clipboard.writeText(linhas.join('\n'));
    toast.success('Resumo do item copiado para a área de transferência.');
  };

  const theme = getThemeByItemType(tipo);
  const IconWatermark = theme.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="space-y-6">
        {/* Header com gradiente dinâmico por tipo */}
        <div className={`relative -mt-6 -mx-6 p-8 bg-gradient-to-br ${theme.bgGradient} ${theme.textColor} rounded-t-lg overflow-hidden transition-colors duration-500`}>
          {/* Padrão decorativo dinâmico */}
          <PatternOverlay pattern={theme.pattern} />

          {/* Ícone Watermark Gigante */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 opacity-10 pointer-events-none">
            <IconWatermark className="w-96 h-96 transform rotate-12" />
          </div>

          <div className="relative z-10">
            <p className={`text-xs uppercase tracking-widest ${theme.accentColor} opacity-80 flex items-center gap-2 mb-4`}>
              <FileText className="w-4 h-4" /> Resumo do Item
            </p>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 bg-black/20 border-gray-200/30 flex items-center justify-center p-0.5 shadow-md">
                  {itemIcon ? (
                    <DynamicIcon name={itemIcon} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    tipoIconFallback(tipo)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-3xl font-bold break-words">{nome || 'Item sem nome'}</h2>
                  <p className="mt-1 text-sm opacity-90">{tipoLabel(tipo)} · {dominiosLabel(dominios, dominio)}</p>
                  {itemData && (
                    <span
                      className={`inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        itemData.durabilidade === 'INTACTO'
                          ? 'bg-green-400/20 text-green-200'
                          : 'bg-red-400/20 text-red-200'
                      }`}
                    >
                      {itemData.durabilidade === 'INTACTO' ? '● Intacto' : '⚠ Danificado'}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[90px] flex-shrink-0 border border-white/20">
                <p className={`${theme.accentColor} text-xs mb-1`}>Nível</p>
                <p className="text-4xl font-bold text-yellow-300 drop-shadow-sm">{nivelCalculado}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10">
                <p className={`${theme.accentColor} text-xs mb-1`}>Custo Base</p>
                <p className="text-2xl font-bold">{custoBase}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10">
                <p className={`${theme.accentColor} text-xs mb-1`}>Custo Real</p>
                <p className="text-2xl font-bold">{custoRealCalculado}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10">
                <p className={`${theme.accentColor} text-xs mb-1`}>Preço de Venda</p>
                <p className="text-2xl font-bold">{precoVendaCalculado}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas específicas do tipo */}
        {itemData && <TypeSpecificStats itemData={itemData} />}

        {/* Descrição */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <p className="text-xs uppercase tracking-wide text-gray-500">Descrição</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {descricao || 'Sem descrição preenchida.'}
            </p>
          </CardContent>
        </Card>

        {/* Poderes e Acervos vinculados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2">
                  <Sword className="w-4 h-4" /> Poderes Vinculados ({selectedPowers.length})
                </p>
                {isLoadingVinculos && <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-500" />}
              </div>
              <div className="space-y-2">
                {selectedPowers.length === 0 && !isLoadingVinculos ? (
                  <p className="text-sm text-gray-500">Nenhum poder vinculado</p>
                ) : (
                  <>
                    {selectedPowers.map((power) => (
                      <button
                        key={power.id}
                        type="button"
                        onClick={() => onOpenPowerDetails(power.id)}
                        className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <div className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center">
                              {power.icone ? (
                                <DynamicIcon name={power.icone} className="w-full h-full" />
                              ) : (
                                <Sparkles className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{power.nome}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">{power.descricao || 'Sem descrição.'}</p>
                              <p className="text-[11px] text-gray-500 mt-1">Efeitos: {power.effects.length}</p>
                            </div>
                          </div>
                          <Eye className="w-4 h-4 text-gray-400 shrink-0" />
                        </div>
                      </button>
                    ))}
                    {isLoadingVinculos && (
                      <div className="flex items-center justify-center p-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg animate-pulse">
                         <p className="text-xs text-gray-400 italic">Buscando poderes vinculados...</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Acervos Vinculados ({selectedPowerArrays.length})
                </p>
                {isLoadingVinculos && <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-500" />}
              </div>
              <div className="space-y-2">
                {selectedPowerArrays.length === 0 && !isLoadingVinculos ? (
                  <p className="text-sm text-gray-500">Nenhum acervo vinculado</p>
                ) : (
                  <>
                    {selectedPowerArrays.map((powerArray) => (
                      <button
                        key={powerArray.id}
                        type="button"
                        onClick={() => onOpenPowerArrayDetails(powerArray.id)}
                        className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <div className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center">
                              {powerArray.icone ? (
                                <DynamicIcon name={powerArray.icone} className="w-full h-full" />
                              ) : (
                                <BookOpen className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{powerArray.nome}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">{powerArray.descricao || 'Sem descrição.'}</p>
                              <p className="text-[11px] text-gray-500 mt-1">Poderes: {powerArray.powers.length}</p>
                            </div>
                          </div>
                          <Eye className="w-4 h-4 text-gray-400 shrink-0" />
                        </div>
                      </button>
                    ))}
                    {isLoadingVinculos && (
                      <div className="flex items-center justify-center p-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg animate-pulse">
                         <p className="text-xs text-gray-400 italic">Buscando acervos vinculados...</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border border-espirito-200 dark:border-espirito-800 bg-espirito-50/60 dark:bg-espirito-900/20 p-4">
          <p className="text-sm text-espirito-800 dark:text-espirito-200 flex items-center gap-2">
            <Gem className="w-4 h-4" />
            O nível do item é calculado automaticamente pela soma dos graus de todos os efeitos dos poderes e acervos vinculados.
          </p>
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={copiarResumo}>
          <Copy className="w-4 h-4 mr-2" /> Copiar Resumo
        </Button>
        <Button variant="outline" onClick={onClose}>
          <Package className="w-4 h-4 mr-2" /> Fechar
        </Button>
      </ModalFooter>
    </Modal>
  );
}