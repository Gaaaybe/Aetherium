import { BookOpen, Copy, Eye, FileText, FlaskConical, Gem, Package, RefreshCw, Shield, Sparkles, Star, Sword, Zap, X, Hammer } from 'lucide-react';
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
  notas?: string;
}

function tipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    weapon: 'Arma',
    'defensive-equipment': 'Equipamento Defensivo',
    consumable: 'Consumível',
    artifact: 'Artefato',
    accessory: 'Acessório',
    general: 'Geral',
    'upgrade-material': 'Material de Upgrade',
  };

  return labels[tipo] ?? tipo;
}

function tipoIconFallback(tipo: string) {
  if (tipo === 'weapon') return <Sword className="w-16 h-16 text-white/80" />;
  if (tipo === 'defensive-equipment') return <Shield className="w-16 h-16 text-white/80" />;
  if (tipo === 'consumable') return <FlaskConical className="w-16 h-16 text-white/80" />;
  if (tipo === 'artifact') return <Gem className="w-16 h-16 text-white/80" />;
  if (tipo === 'upgrade-material') return <Hammer className="w-16 h-16 text-white/80" />;
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
        <Card className="border border-red-100 dark:border-red-950/20 bg-red-50/10 dark:bg-red-950/5">
          <CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wider text-red-500 font-extrabold flex items-center gap-2 mb-4">
              <Sword className="w-4 h-4" /> Estatísticas de Arma
            </p>
            {itemData.danos && itemData.danos.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 font-semibold">Fórmulas de Dano</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {itemData.danos.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl px-3 py-2.5 shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-base text-gray-900 dark:text-gray-100">{d.dado}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Dano</span>
                      </div>
                      <div className="h-8 w-px bg-gray-100 dark:bg-gray-800" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            Base: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[11px]">{d.base || 'Nenhum'}</span>
                          </span>
                          {d.tipoDano && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">
                              {d.tipoDano}
                            </span>
                          )}
                        </div>
                      </div>
                      {d.espiritual && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-800/40">
                          <Zap className="w-3 h-3" /> Espiritual
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-3 shadow-sm">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Alcance</p>
                <p className="font-bold text-sm text-gray-850 dark:text-gray-205">
                  {alcanceLabel(itemData.alcance)}
                  {itemData.alcanceExtraMetros > 0 && (
                    <span className="text-xs text-gray-500 font-normal ml-1">+{itemData.alcanceExtraMetros}m</span>
                  )}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-3 shadow-sm">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Crítico</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-150 dark:border-red-900/30">
                  {itemData.critMargin}–20 / ×{itemData.critMultiplier}
                </span>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-3 shadow-sm flex flex-col justify-between min-h-[72px]">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Aprimoramento</p>
                  <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                    <span className="text-purple-600 dark:text-purple-400">+{itemData.upgradeLevel}</span>
                    <span className="text-gray-400 text-[10px]">máx +{itemData.upgradeLevelMax || 7}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-600 dark:bg-purple-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(itemData.upgradeLevel / (itemData.upgradeLevelMax || 7)) * 100}%` }}
                  />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-3 shadow-sm">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Escalonamento</p>
                {itemData.atributoEscalonamento ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/20">
                    {itemData.atributoEscalonamento}
                  </span>
                ) : (
                  <p className="text-xs text-gray-400 italic">Nenhum</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case 'defensive-equipment':
      return (
        <Card className="border border-blue-100 dark:border-blue-950/20 bg-blue-50/10 dark:bg-blue-950/5">
          <CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wider text-blue-500 font-extrabold flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4" /> Estatísticas de Equipamento Defensivo
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-3 shadow-sm">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Tipo de Defesa</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20">
                  {itemData.tipoEquipamento === 'traje' ? 'Traje' : 'Proteção'}
                </span>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-3 shadow-sm sm:col-span-2 flex flex-col justify-between min-h-[72px]">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Resistência a Dano (RD)</p>
                  <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                    <span className="text-blue-600 dark:text-blue-400 font-black">{itemData.rdAtual} RD</span>
                    <span className="text-gray-450 text-[10px]">base {itemData.baseRD} RD</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${itemData.baseRD > 0 ? Math.min(100, (itemData.rdAtual / itemData.baseRD) * 100) : 100}%` }}
                  />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-3 shadow-sm flex flex-col justify-between min-h-[72px]">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Aprimoramento</p>
                  <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                    <span className="text-purple-600 dark:text-purple-400">+{itemData.upgradeLevel}</span>
                    <span className="text-gray-400 text-[10px]">máx +{itemData.upgradeLevelMax || 7}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-600 dark:bg-purple-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(itemData.upgradeLevel / (itemData.upgradeLevelMax || 7)) * 100}%` }}
                  />
                </div>
              </div>
              {itemData.atributoEscalonamento && (
                <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-3 shadow-sm sm:col-span-4">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Escalonamento de RD</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/20">
                    {itemData.atributoEscalonamento}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );

    case 'consumable':
      return (
        <Card className="border border-teal-100 dark:border-teal-950/20 bg-teal-50/10 dark:bg-teal-950/5">
          <CardContent className="pt-4 space-y-3">
            <p className="text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400 font-extrabold flex items-center gap-2 mb-2">
              <FlaskConical className="w-4 h-4" /> Estatísticas de Consumível
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-3 shadow-sm">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Doses</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800 dark:text-gray-250">{itemData.qtdDoses} {itemData.qtdDoses === 1 ? 'Dose' : 'Doses'}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {Array.from({ length: Math.min(itemData.qtdDoses, 5) }).map((_, i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full bg-teal-500 dark:bg-teal-400 shadow-sm animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                    {itemData.qtdDoses > 5 && (
                      <span className="text-[10px] font-black text-teal-600 dark:text-teal-400">+{itemData.qtdDoses - 5}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-3 shadow-sm">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Tipo de Consumível</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                  itemData.isRefeicao 
                    ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30' 
                    : 'bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30'
                }`}>
                  {itemData.isRefeicao ? '🍴 Refeição' : '🧪 Consumível'}
                </span>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-3 shadow-sm">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Estado / Conservação</p>
                {itemData.spoilageState ? (() => {
                  const stateColors: Record<SpoilageState, string> = {
                    PERFEITA: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30',
                    BOA: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
                    NORMAL: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
                    RUIM: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-455 dark:border-orange-900/30',
                    TERRIVEL: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
                  };
                  return (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${stateColors[itemData.spoilageState]}`}>
                      {spoilageLabel(itemData.spoilageState)}
                    </span>
                  );
                })() : (
                  <span className="text-xs text-gray-450 italic">Não especificado</span>
                )}
              </div>
            </div>
            {itemData.descritorEfeito && (
              <div className="rounded-xl border border-teal-200/50 dark:border-teal-900/30 bg-teal-50/30 dark:bg-teal-950/10 p-4">
                <p className="text-[10px] text-teal-600 dark:text-teal-400 uppercase font-black tracking-widest mb-1.5">Descrição do Efeito Ativo</p>
                <p className="text-sm font-medium text-teal-950 dark:text-teal-200 leading-relaxed italic">{itemData.descritorEfeito}</p>
              </div>
            )}
          </CardContent>
        </Card>
      );

    case 'artifact':
      return (
        <Card className="border border-amber-100 dark:border-amber-950/20 bg-amber-50/10 dark:bg-amber-950/5">
          <CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-2 mb-4">
              <Gem className="w-4 h-4" /> Estatísticas de Artefato
            </p>
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300 ${
              itemData.isAttuned 
                ? 'bg-amber-50/40 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/30 text-amber-800 dark:text-amber-300' 
                : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800 text-gray-500'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  itemData.isAttuned 
                    ? 'bg-amber-100/50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' 
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                }`}>
                  <Star className={`w-5 h-5 ${itemData.isAttuned ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-850 dark:text-gray-200">{itemData.isAttuned ? 'Sintonizado' : 'Não Sintonizado'}</p>
                  <p className="text-xs text-gray-400">
                    {itemData.isAttuned 
                      ? 'Este item está sintonizado com o usuário e concede seus bônus místicos.' 
                      : 'Requer sintonização para liberar todo o seu potencial cósmico.'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case 'upgrade-material':
      return (
        <Card className="border border-amber-100 dark:border-amber-950/20 bg-amber-50/10 dark:bg-amber-950/5">
          <CardContent className="pt-4">
            <p className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-2 mb-4">
              <Hammer className="w-4 h-4" /> Estatísticas de Material de Upgrade
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                <p className="text-[10px] text-gray-450 uppercase font-black tracking-widest mb-1">Tier / Patamar do Material</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-gray-800 dark:text-gray-200">Patamar {itemData.tier}</span>
                  <span className="text-xs text-gray-400 font-semibold">(Tier {itemData.tier})</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                <p className="text-[10px] text-gray-450 uppercase font-black tracking-widest mb-1">Limite Máximo de Upgrade</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black text-purple-600 dark:text-purple-400">Até +{itemData.maxUpgradeLimit}</span>
                  <span className="text-xs text-gray-400 font-semibold">no aprimoramento</span>
                </div>
              </div>
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
  notas,
}: ResumoItemProps) {
  const itemIcon = icone?.trim() ?? '';

  const copiarResumo = () => {
    const linhas = [
      `=== ${nome || 'Item sem nome'} ===`,
      `Tipo: ${tipoLabel(tipo)}`,
      `Domínio: ${dominiosLabel(dominios, dominio)}`,
      `Descrição: ${descricao || 'Sem descrição'}`,
      `Custo Base: ᚱ ${custoBase} | Nível: ${nivelCalculado} | Custo Real: ᚱ ${custoRealCalculado} | Preço Venda: ᚱ ${precoVendaCalculado}`,
    ];

    if (itemData && itemData.tipo === 'weapon') {
      linhas.push(
        `Danos: ${itemData.danos.map((d) => `${d.dado} (${d.base}${d.tipoDano ? ` · ${d.tipoDano}` : ''}${d.espiritual ? ', espiritual' : ''})`).join(', ')}`,
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
    } else if (itemData && itemData.tipo === 'upgrade-material') {
      linhas.push(
        `Patamar: ${itemData.tier} | Limite de Upgrade: +${itemData.maxUpgradeLimit}`,
      );
    }

    const finalNotas = (notas || itemData?.notas || '').trim();
    if (finalNotas) {
      linhas.push(`Notas: ${finalNotas}`);
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
  const finalNotas = (notas || itemData?.notas || '').trim();

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
                <p className="text-xl font-bold">ᚱ {custoBase}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10">
                <p className={`${theme.accentColor} text-xs mb-1`}>Custo Real</p>
                <p className="text-xl font-bold">ᚱ {custoRealCalculado}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10">
                <p className={`${theme.accentColor} text-xs mb-1`}>Preço de Venda</p>
                <p className="text-xl font-bold">ᚱ {precoVendaCalculado}</p>
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

        {/* Notas */}
        {finalNotas && (
          <Card className="border-l-4 border-l-amber-500/50 bg-amber-50/5 dark:bg-amber-950/2">
            <CardContent className="pt-4 space-y-2">
              <p className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-400 font-bold">Observações / Notas Adicionais</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap italic">
                {finalNotas}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Poderes e Acervos vinculados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2 font-bold">
                  <Sparkles className="w-4 h-4 text-purple-500" /> Poderes Vinculados ({selectedPowers.length})
                </p>
                {isLoadingVinculos && <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-500" />}
              </div>
              <div className="space-y-2">
                {selectedPowers.length === 0 && !isLoadingVinculos ? (
                  <p className="text-sm text-gray-500 italic">Nenhum poder vinculado</p>
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
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-[9px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950/30 text-purple-650 dark:text-purple-400 px-1.5 py-0.5 rounded border border-purple-150 dark:border-purple-900/35">
                                  {power.dominio?.name ? (DOMINIOS.find(d => d.id === power.dominio.name)?.nome || power.dominio.name) : 'Sem domínio'}
                                </span>
                                {power.custoTotal?.pe > 0 && (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/30 text-blue-650 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-150 dark:border-blue-900/35">
                                    {power.custoTotal.pe} PE
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Eye className="w-4 h-4 text-gray-400 shrink-0" />
                        </div>
                      </button>
                    ))}
                    {isLoadingVinculos && (
                      <div className="space-y-2 animate-pulse">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-16 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 p-2.5 flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-850 shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 w-2/5 bg-gray-200 dark:bg-gray-800 rounded" />
                              <div className="h-2.5 w-4/5 bg-gray-150 dark:bg-gray-805 rounded" />
                            </div>
                          </div>
                        ))}
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
                <p className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2 font-bold">
                  <BookOpen className="w-4 h-4 text-indigo-500" /> Acervos Vinculados ({selectedPowerArrays.length})
                </p>
                {isLoadingVinculos && <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-500" />}
              </div>
              <div className="space-y-2">
                {selectedPowerArrays.length === 0 && !isLoadingVinculos ? (
                  <p className="text-sm text-gray-500 italic">Nenhum acervo vinculado</p>
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
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-150 dark:border-indigo-900/35">
                                  {powerArray.dominio?.name ? (DOMINIOS.find(d => d.id === powerArray.dominio.name)?.nome || powerArray.dominio.name) : 'Sem domínio'}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                  {powerArray.powers.length} {powerArray.powers.length === 1 ? 'Poder' : 'Poderes'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Eye className="w-4 h-4 text-gray-400 shrink-0" />
                        </div>
                      </button>
                    ))}
                    {isLoadingVinculos && (
                      <div className="space-y-2 animate-pulse">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-16 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 p-2.5 flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-850 shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 w-2/5 bg-gray-200 dark:bg-gray-800 rounded" />
                              <div className="h-2.5 w-4/5 bg-gray-150 dark:bg-gray-805 rounded" />
                            </div>
                          </div>
                        ))}
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
          <X className="w-4 h-4 mr-2" /> Fechar
        </Button>
      </ModalFooter>
    </Modal>
  );
}