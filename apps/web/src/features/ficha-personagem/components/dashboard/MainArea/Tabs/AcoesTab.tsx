import { useState, useEffect } from 'react';
import { CharacterResponse } from '@/services/characters.types';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, DynamicIcon, toast } from '@/shared/ui';
import { Sword, Zap, Shield, Repeat, Package, Activity, Dices, Plus, Minus, RotateCcw, Search, Hand } from 'lucide-react';
import { ACOES_COMBATE, buscarGrauNaTabela, CONDICOES } from '@/data';
import { DiceRoller } from '@/shared/components/DiceRoller';
import { getItemById } from '@/services/items.service';
import { getPowerById } from '@/services/powers.service';
import { getPowerArrayById } from '@/services/powerArrays.service';
import type { ItemResponse, WeaponItemResponse, PoderResponse, AcervoResponse } from '@/services/types';
import { UnarmedMasteryModal } from './UnarmedMasteryModal';
import { type ActivePower } from '@/features/ficha-personagem/hooks/usePowerUsage';
import { PowerUsageModal } from './PowerUsageModal';
import { ActivePowersTracker } from './ActivePowersTracker';
import type { ResolvePowerResponse } from '@/services/powers.service';
import { ResumoItem } from '@/features/criador-de-item/components/ResumoItem';
import { ResumoPoder } from '@/features/criador-de-poder/components/ResumoPoder';
import { ResumoAcervo } from '@/features/criador-de-poder/components/ResumoAcervo';
import { calcularDetalhesPoder } from '@/features/criador-de-poder/regras/calculadoraCusto';
import { poderResponseToPoder, acervoResponseToAcervo } from '@/features/criador-de-poder/utils/poderApiConverter';
import { useCatalog } from '@/context/useCatalog';
import {
  obterBonusFortalecerDanoRecuperacao,
  obterBonusFortalecerCaracteristicasItem,
  obterBonusFortalecerCaracteristicasDesarmado,
  obterBonusFortalecerAcoes
} from '../../../../utils/fortalecerHelper';
import { fortaleceAlvoMatch, getRollAdvantageDisadvantage } from '@aetherium/rules-engine';
import { isArmaDistancia, isArmaCorpoACorpo, obterReducaoCriticoParaArma } from '@/features/ficha-personagem/utils/benefitsHelper';
import { renderDescriptionWithTooltips } from '@/features/ficha-personagem/utils/conditionsHelper';

interface AcoesTabProps {
  character: CharacterResponse;
  onUpdateUnarmedMastery: (mastery: any) => Promise<void>;
  onSync: (data: any) => Promise<void>;
  activePowers: ActivePower[];
  isResolving: boolean;
  isConfirming: boolean;
  previewPower: any;
  confirmUsePower: any;
  maintainPower: any;
  deactivatePower: any;
}

export function AcoesTab({
  character,
  onUpdateUnarmedMastery,
  onSync,
  activePowers,
  isResolving,
  isConfirming,
  previewPower,
  confirmUsePower,
  maintainPower,
  deactivatePower,
}: AcoesTabProps) {
  const [detailedItems, setDetailedItems] = useState<Record<string, ItemResponse>>({});
  const [detailedPowers, setDetailedPowers] = useState<Record<string, PoderResponse>>({});
  const [detailedArrays, setDetailedArrays] = useState<Record<string, AcervoResponse>>({});
  
  const [viewingItem, setViewingItem] = useState<ItemResponse | null>(null);
  const [viewingPower, setViewingPower] = useState<any | null>(null);
  const [viewingArray, setViewingArray] = useState<any | null>(null);
  const { efeitos: catalogEfeitos, modificacoes: catalogModificacoes } = useCatalog();
  
  const [usingPower, setUsingPower] = useState<(PoderResponse & { originItemId?: string }) | null>(null);
  const [usingPowerFromActive, setUsingPowerFromActive] = useState<boolean>(false);
  const [resolution, setResolution] = useState<ResolvePowerResponse | null>(null);

  const handleUsePowerFromActive = async (activePower: ActivePower) => {
    const powerDetail = detailedPowers[activePower.powerId];
    if (!powerDetail) {
      toast.error('Detalhes do poder não encontrados.');
      return;
    }
    setUsingPower(powerDetail);
    setUsingPowerFromActive(true);
    setResolution(null);

    const peCost = powerDetail.custoTotal?.pe ?? 0;
    const res = await previewPower({
      powerId: powerDetail.id,
      nome: powerDetail.nome,
      icone: powerDetail.icone,
      duracao: powerDetail.parametros.duracao,
      peCost,
    }, character);

    if (res) {
      setResolution(res.resolution);
    }
  };

  // Contadores locais de turno
  const activeFortalecerAcoes = obterBonusFortalecerAcoes(activePowers);
  const defaultActions = 1 + activeFortalecerAcoes;

  const [actions, setActions] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`character_${character.id}_actions`);
      return stored ? parseInt(stored) : defaultActions;
    }
    return defaultActions;
  });
  const [movement, setMovement] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`character_${character.id}_movement`);
      return stored ? parseInt(stored) : 1;
    }
    return 1;
  });

  useEffect(() => {
    localStorage.setItem(`character_${character.id}_actions`, actions.toString());
  }, [actions, character.id]);

  useEffect(() => {
    localStorage.setItem(`character_${character.id}_movement`, movement.toString());
  }, [movement, character.id]);

  // Load from localStorage on character change
  useEffect(() => {
    const storedActions = localStorage.getItem(`character_${character.id}_actions`);
    const storedMovement = localStorage.getItem(`character_${character.id}_movement`);
    setActions(storedActions ? parseInt(storedActions) : defaultActions);
    setMovement(storedMovement ? parseInt(storedMovement) : 1);
  }, [character.id]);

  // Adjust actions based on changes in defaultActions (fortalecer powers turning on/off)
  const [prevDefaultActions, setPrevDefaultActions] = useState(defaultActions);
  useEffect(() => {
    const diff = defaultActions - prevDefaultActions;
    if (diff !== 0) {
      setActions(prev => Math.max(0, prev + diff));
      setPrevDefaultActions(defaultActions);
    }
  }, [defaultActions, prevDefaultActions]);


  // Busca e Filtro de Ações de Combate
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [rollingAction, setRollingAction] = useState<{
    name: string;
    damage?: string;
    modifier: number;
    damageModifier?: number;
    critMargin?: number;
    critMultiplier?: number;
    efficiencyBonus?: number;
    tipo?: 'ARMA' | 'DESARMADO';
    domains?: string[];
    itemId?: string;
    initialRule?: 'advantage' | 'disadvantage' | 'normal';
    initialExtraDice?: number;
  } | null>(null);

  const [isUnarmedModalOpen, setIsUnarmedModalOpen] = useState(false);
  const [isProcessingMastery, setIsProcessingMastery] = useState(false);

  const handleUpdateMastery = async (mastery: any) => {
    setIsProcessingMastery(true);
    try {
      await onUpdateUnarmedMastery(mastery);
      toast.success('Domínio Desarmado atualizado!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar domínio.');
    } finally {
      setIsProcessingMastery(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchAllDetails = async () => {
      // 1. Gather all equipped item IDs
      const itemIds: string[] = [];
      if (character.equipment.suitId) itemIds.push(character.equipment.suitId);
      if (character.equipment.accessoryId) itemIds.push(character.equipment.accessoryId);
      character.equipment.hands.forEach(h => itemIds.push(h.itemId));
      character.equipment.quickAccess.forEach(q => itemIds.push(q.itemId));
      const uniqueItemIds = Array.from(new Set(itemIds));

      // Fetch missing item details
      const newDetailedItems = { ...detailedItems };
      let itemsChanged = false;
      for (const id of uniqueItemIds) {
        if (!newDetailedItems[id]) {
          try {
            const detail = await getItemById(id);
            newDetailedItems[id] = detail;
            itemsChanged = true;
          } catch (err) {
            console.error(`Erro ao buscar item ${id}`, err);
          }
        }
      }
      if (itemsChanged && active) {
        setDetailedItems(newDetailedItems);
      }

      // 2. Gather all power IDs and power array IDs (character + equipped items)
      const equippedItemsList = uniqueItemIds
        .map(id => newDetailedItems[id])
        .filter(Boolean);

      const itemPowerIds = equippedItemsList.flatMap(item => item.powerIds || []);
      const itemPowerArrayIds = equippedItemsList.flatMap(item => item.powerArrayIds || []);

      const allPowerIds = Array.from(new Set([
        ...character.powers.map(p => p.powerId),
        ...itemPowerIds
      ]));

      const allPowerArrayIds = Array.from(new Set([
        ...character.powerArrays.map(a => a.powerArrayId),
        ...itemPowerArrayIds
      ]));

      // Fetch missing power details
      const newDetailedPowers = { ...detailedPowers };
      let powersChanged = false;
      for (const id of allPowerIds) {
        if (!newDetailedPowers[id]) {
          try {
            const detail = await getPowerById(id);
            newDetailedPowers[id] = detail;
            powersChanged = true;
          } catch (err) {
            console.error(`Erro ao buscar poder ${id}`, err);
          }
        }
      }
      if (powersChanged && active) {
        setDetailedPowers(newDetailedPowers);
      }

      // Fetch missing power array details
      const newDetailedArrays = { ...detailedArrays };
      let arraysChanged = false;
      for (const id of allPowerArrayIds) {
        if (!newDetailedArrays[id]) {
          try {
            const detail = await getPowerArrayById(id);
            newDetailedArrays[id] = detail;
            arraysChanged = true;
          } catch (err) {
            console.error(`Erro ao buscar acervo ${id}`, err);
          }
        }
      }
      if (arraysChanged && active) {
        setDetailedArrays(newDetailedArrays);
      }
    };

    fetchAllDetails();

    return () => {
      active = false;
    };
  }, [
    character.equipment.suitId,
    character.equipment.accessoryId,
    character.equipment.hands,
    character.equipment.quickAccess,
    character.powers,
    character.powerArrays
  ]);

  // Filtra itens e poderes que seriam exibidos como ações
  const equippedItems = character.equipment.hands;

  // 1. Poderes individuais equipados (do personagem)
  const individualEquipped = character.powers
    .filter(p => p.isEquipped)
    .map(p => detailedPowers[p.powerId])
    .filter((p): p is PoderResponse => !!p);

  // 2. Poderes de acervos equipados (do personagem)
  const arrayEquipped = character.powerArrays
    .filter(a => a.isEquipped)
    .flatMap(a => detailedArrays[a.powerArrayId]?.powers || []);

  // 3. Poderes de itens equipados
  const equippedItemIdsList = [
    character.equipment.suitId,
    character.equipment.accessoryId,
    ...character.equipment.hands.map(h => h.itemId),
    ...character.equipment.quickAccess.map(q => q.itemId),
  ].filter(Boolean);

  const itemIndividualPowers: (PoderResponse & { originItemName?: string; originItemId?: string })[] = [];
  const itemArrayPowers: (PoderResponse & { originItemName?: string; originItemId?: string })[] = [];

  equippedItemIdsList.forEach(itemId => {
    const itemDetail = detailedItems[itemId!];
    if (!itemDetail) return;

    if (itemDetail.powerIds) {
      itemDetail.powerIds.forEach(pid => {
        const power = detailedPowers[pid];
        if (power) {
          itemIndividualPowers.push({
            ...power,
            originItemName: itemDetail.nome,
            originItemId: itemDetail.id,
            originItemTipo: itemDetail.tipo
          } as any);
        }
      });
    }

    if (itemDetail.powerArrayIds) {
      itemDetail.powerArrayIds.forEach(paid => {
        const arrayDetail = detailedArrays[paid];
        if (arrayDetail && arrayDetail.powers) {
          arrayDetail.powers.forEach(power => {
            itemArrayPowers.push({
              ...power,
              originItemName: itemDetail.nome,
              originItemId: itemDetail.id,
              originItemTipo: itemDetail.tipo
            } as any);
          });
        }
      });
    }
  });

  // 4. Unifica e remove duplicatas por ID
  const allUsablePowers = Array.from(
    new Map([
      ...individualEquipped,
      ...arrayEquipped,
      ...itemIndividualPowers,
      ...itemArrayPowers
    ].map(p => [p.id, p])).values()
  );

  // 5. Filtra para exibir apenas poderes ativos (qualquer ação que não seja passiva - valor 5 e não permanente - valor 4)
  const activeEquippedPowers = allUsablePowers.filter(
    p => p.parametros?.duracao !== 4
  );

  const filteredCombatActions = ACOES_COMBATE.filter(acao => {
    const matchesSearch = acao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acao.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || acao.tipo === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
      {/* ─── Gerenciamento de Turno ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-md bg-white dark:bg-gray-900 overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500 opacity-20 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between text-gray-500 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Sword className="w-4 h-4 text-red-500" />
                Ações de Turno
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full hover:bg-red-50 !p-0 flex items-center justify-center transition-transform hover:rotate-180 duration-500" onClick={() => { setActions(defaultActions); setMovement(1); }} title="Reiniciar Turno">
                <RotateCcw className="w-4 h-4 text-red-500" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-around py-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Ação Padrão</span>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg border-red-100 !p-0 flex items-center justify-center" onClick={() => setActions(Math.max(0, actions - 1))}>
                  <Minus className="w-4 h-4 text-red-500" />
                </Button>
                {(() => {
                  const extraRestante = Math.max(0, actions - 1);
                  const baseRestante = Math.min(1, actions);
                  const textDisplay = extraRestante > 0 ? `${baseRestante} (+${extraRestante})` : `${actions}`;
                  return (
                    <span className="text-2xl font-black text-red-600 min-w-[3.5rem] text-center" title={`${baseRestante} Ação Base + ${extraRestante} Extra(s)`}>
                      {textDisplay}
                    </span>
                  );
                })()}
                <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg border-red-100 !p-0 flex items-center justify-center" onClick={() => setActions(actions + 1)}>
                  <Plus className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
            <div className="w-px h-10 bg-gray-100 dark:bg-gray-800" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Movimento</span>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg border-emerald-100 !p-0 flex items-center justify-center" onClick={() => setMovement(Math.max(0, movement - 1))}>
                  <Minus className="w-4 h-4 text-emerald-500" />
                </Button>
                <span className="text-3xl font-black text-emerald-600 w-8 text-center">{movement}</span>
                <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg border-emerald-100 !p-0 flex items-center justify-center" onClick={() => setMovement(movement + 1)}>
                  <Plus className="w-4 h-4 text-emerald-500" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white dark:bg-gray-900 border-l-4 border-l-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-blue-500" />
              Recursos / Reações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Inspiração</span>
              </div>
              <span className="text-lg font-black text-amber-600">{character.inspiration}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Reação / Rodada</span>
              </div>
              <span className="text-lg font-black text-blue-600">1</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ─── Ações Ativas (Itens e Poderes) ─────────────────────────────── */}
        <div className="space-y-6">
          <Card className="border-none shadow-md bg-white dark:bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
                <Package className="w-4 h-4 text-indigo-500" />
                Equipamentos em Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* --- ATAQUE DESARMADO (Universal) --- */}
                {(() => {
                  const unarmedCritBonus = obterBonusFortalecerCaracteristicasDesarmado(activePowers);
                  const criticoAprimoradoDesarmado = obterReducaoCriticoParaArma(character, null, true);
                  const finalCritMargin = Math.max(1, (character.unarmedMastery?.criticalMargin || 20) - unarmedCritBonus.critMarginBonus - criticoAprimoradoDesarmado);
                  const finalCritMultiplier = (character.unarmedMastery?.criticalMultiplier || 2) + unarmedCritBonus.critMultiplierBonus;

                  return (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-50/10 dark:bg-red-900/10 border border-red-100/50 dark:border-red-900/20 group hover:border-red-500/30 transition-all gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/20 shadow-sm group-hover:scale-110 transition-transform flex items-center justify-center overflow-hidden shrink-0">
                          <Hand className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                          <div className="flex items-center gap-2 leading-tight flex-wrap">
                            <h4 className="font-black text-xs text-gray-900 dark:text-gray-100 uppercase tracking-tight truncate">
                              {character.unarmedMastery?.customName || 'Ataque Desarmado'}
                            </h4>
                          </div>
                          <div className="flex items-center gap-x-1.5 gap-y-1 flex-wrap mt-0.5 min-w-0">
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter truncate shrink-0">
                              {character.unarmedMastery?.damageDie || '1d2'} {character.unarmedMastery?.damageType || 'Impacto'}
                            </p>
                            <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 text-[8px] font-black h-4 px-1.5 shrink-0">
                              CRIT: {finalCritMargin}+ / x{finalCritMultiplier}
                            </Badge>
                            <Badge variant="secondary" className="h-3.5 px-1.5 text-[8px] font-black bg-gray-100 dark:bg-gray-800 text-gray-500 border-none uppercase flex-shrink-0">
                              Grau {character.unarmedMastery?.degree || 0}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-[10px] font-bold border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 gap-1 active:scale-95"
                          onClick={() => {
                            const attrKey = character.attributes.keyPhysical || 'strength';
                            const mod = (character.attributes[attrKey] as any)?.rollModifier || 0;

                            const baseDamage = character.unarmedMastery?.damageDie || '1d2';
                            const fortalecerBonuses = obterBonusFortalecerDanoRecuperacao(activePowers, {
                              tipo: 'DESARMADO'
                            }, character);

                            let finalDamage = baseDamage;
                            for (const fb of fortalecerBonuses) {
                              if (fb.configId === 'dano') {
                                const descSuffix = fb.descritor ? ` [${fb.descritor}]` : '';
                                finalDamage += ` + ${fb.formula.replace(/^\+/, '')}${descSuffix}`;
                              }
                            }

                            const { rule, extraDice } = getRollAdvantageDisadvantage(character, 'attack', { attackType: 'melee' });

                            setRollingAction({
                              name: character.unarmedMastery?.customName || 'Ataque Desarmado',
                              damage: finalDamage,
                              modifier: mod,
                              damageModifier: mod,
                              critMargin: finalCritMargin,
                              critMultiplier: finalCritMultiplier,
                              efficiencyBonus: character.efficiencyBonus,
                              tipo: 'DESARMADO',
                              initialRule: rule,
                              initialExtraDice: extraDice
                            });
                          }}
                        >
                          <Dices className="w-3.5 h-3.5" /> Atacar
                        </Button>
                        
                        {/* Só exibe evolução se possuir o domínio */}
                        {character.domainMasteries?.some(d => d.domainId === 'desarmado' || d.nome?.includes('Desarmado')) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 !p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-90 flex items-center justify-center"
                            onClick={() => setIsUnarmedModalOpen(true)}
                            title="Evoluir Domínio Desarmado"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="h-px bg-gray-100 dark:bg-gray-800 my-2" />

                {equippedItems.length > 0 ? equippedItems.map((item, idx) => {
                  const itemDetail = detailedItems[item.itemId] as WeaponItemResponse | undefined;
                  if (!itemDetail) return null;

                  const itemFortalecerBonus = obterBonusFortalecerCaracteristicasItem(activePowers, itemDetail.id);
                  const criticoAprimoradoArma = obterReducaoCriticoParaArma(character, itemDetail);
                  const finalCritMargin = Math.max(1, (itemDetail.critMargin || 20) - itemFortalecerBonus.critMarginBonus - criticoAprimoradoArma);
                  const finalCritMultiplier = (itemDetail.critMultiplier || 2) + itemFortalecerBonus.critMultiplierBonus;

                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 group hover:border-indigo-500/30 transition-all gap-3">
                      <div 
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer hover:opacity-85 transition-opacity"
                        onClick={() => itemDetail && setViewingItem(itemDetail)}
                        title="Ver detalhes do equipamento"
                      >
                        <div className="w-11 h-11 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 shadow-sm group-hover:scale-110 transition-transform flex items-center justify-center overflow-hidden shrink-0">
                          {itemDetail?.icone && (itemDetail.icone.startsWith('http') || itemDetail.icone.startsWith('/')) ? (
                            <DynamicIcon name={itemDetail.icone} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Sword className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 italic truncate">
                            {itemDetail?.nome || item.itemId}
                          </h4>
                          <div className="flex items-center gap-x-1.5 gap-y-1 flex-wrap mt-0.5 min-w-0">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight shrink-0">
                              {itemDetail?.danos?.map(d => d.dado).join(' + ') || 'Arma Atacante'}
                            </p>
                            <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 text-[8px] font-black h-4 px-1.5 shrink-0">
                              CRIT: {finalCritMargin}+ / x{finalCritMultiplier}
                            </Badge>
                            {itemFortalecerBonus.alcanceBonus > 0 && (
                              <Badge key="alcance" className="bg-amber-100 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 text-[8px] font-black h-4 px-1 shrink-0">
                                ALCANCE: +{itemFortalecerBonus.alcanceBonus}m
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-[10px] font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50 gap-1 active:scale-95"
                          onClick={() => {
                            const escalonamentoBase = itemDetail?.atributoEscalonamento || itemDetail?.danos?.[0]?.base || 'FISICA';
                            const escalonamento = escalonamentoBase.toUpperCase();
                            const map: Record<string, keyof CharacterResponse['attributes']> = { 'FOR': 'strength', 'DES': 'dexterity', 'CON': 'constitution', 'INT': 'intelligence', 'SAB': 'wisdom', 'CAR': 'charisma', 'FISICA': character.attributes.keyPhysical, 'MENTAL': character.attributes.keyMental };
                            const attrKey = map[escalonamento] || character.attributes.keyPhysical || 'strength';
                            const mod = (character.attributes[attrKey] as any)?.rollModifier || 0;

                            const baseDamage = itemDetail?.danos?.map(d => d.dado).join(' + ') || '';
                            const weaponDomains = itemDetail?.dominios?.map((d: any) => d.name) || [];
                            const fortalecerBonuses = obterBonusFortalecerDanoRecuperacao(activePowers, {
                              tipo: 'ARMA',
                              domains: weaponDomains,
                              itemId: itemDetail?.id
                            }, character);

                            let finalDamage = baseDamage;
                            for (const fb of fortalecerBonuses) {
                              if (fb.configId === 'dano') {
                                const descSuffix = fb.descritor ? ` [${fb.descritor}]` : '';
                                finalDamage += ` + ${fb.formula.replace(/^\+/, '')}${descSuffix}`;
                              }
                            }

                            // Procurar poderes do próprio item que estão ativos/equipados e têm Efeito Dano
                            const itemDanoPowers = activePowers.filter(p => p.originItemId === itemDetail?.id);
                            for (const ip of itemDanoPowers) {
                              const powerInfo = detailedPowers[ip.powerId];
                              if (!powerInfo) continue;

                              const effects = powerInfo.effects || [];
                              for (const eff of effects) {
                                const baseId = eff.effectBaseId;
                                if (baseId === 'dano') {
                                  const degree = eff.grau || 1;
                                  
                                  const espiritualDomains = ['natural', 'sagrado', 'sacrilegio', 'psiquico'];
                                  const domainName = powerInfo.dominio?.name || '';
                                  const isEspiritualDomain = espiritualDomains.includes(domainName.toLowerCase());
                                  const isEspiritual = isEspiritualDomain || (domainName.toLowerCase() === 'peculiar' && !!(powerInfo.dominio as any)?.espiritual);
                                  const isInstantaneous = powerInfo.parametros?.duracao === 0;
                                  const itemTipo = ip.originItemTipo || (ip.originItemId ? detailedItems[ip.originItemId]?.tipo : undefined);
                                  const isDanoAcoplado = ((itemTipo?.toUpperCase() === 'WEAPON' || itemTipo === 'weapon') && !(isEspiritual && isInstantaneous));

                                  let formula = '';
                                  if (isDanoAcoplado) {
                                    formula = `1d${4 * Math.pow(2, Math.max(1, degree) - 1)}`;
                                  } else {
                                    const danoInfo = buscarGrauNaTabela(degree);
                                    formula = danoInfo ? danoInfo.dano : '';
                                  }

                                  if (formula) {
                                    const customDescriptor = (eff as any).inputCustomizado || (eff as any).inputValue;
                                    const descriptorVal = customDescriptor ? String(customDescriptor).trim() : domainName;
                                    const descriptor = descriptorVal ? ` [${descriptorVal.toUpperCase()}]` : '';
                                    finalDamage += ` + ${formula}${descriptor}[Acoplado]`;
                                  }
                                }
                              }
                            }

                            const itemFortalecerBonus = obterBonusFortalecerCaracteristicasItem(activePowers, itemDetail?.id);
                            const criticoAprimoradoArma = obterReducaoCriticoParaArma(character, itemDetail || undefined);
                            const finalCritMargin = Math.max(1, (itemDetail?.critMargin || 20) - itemFortalecerBonus.critMarginBonus - criticoAprimoradoArma);
                            const finalCritMultiplier = (itemDetail?.critMultiplier || 2) + itemFortalecerBonus.critMultiplierBonus;

                            const isDistancia = isArmaDistancia(itemDetail);
                            const isCorpoACorpo = isArmaCorpoACorpo(itemDetail);

                            const attackType = isDistancia ? 'ranged' : isCorpoACorpo ? 'melee' : undefined;
                            const { rule, extraDice } = getRollAdvantageDisadvantage(character, 'attack', { attackType });

                            setRollingAction({
                              name: itemDetail?.nome || 'Ataque',
                              damage: finalDamage,
                              modifier: mod,
                              damageModifier: mod,
                              critMargin: finalCritMargin,
                              critMultiplier: finalCritMultiplier,
                              efficiencyBonus: character.efficiencyBonus,
                              tipo: 'ARMA',
                              domains: weaponDomains,
                              itemId: itemDetail?.id,
                              initialRule: rule,
                              initialExtraDice: extraDice
                            });
                          }}
                        >
                          <Dices className="w-4 h-4" /> Atacar
                        </Button>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-gray-500 italic py-2">Nenhuma arma equipada.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white dark:bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
                <Zap className="w-4 h-4 text-purple-500" />
                Poderes Equipados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ActivePowersTracker
                activePowers={activePowers}
                character={character}
                onMaintain={async (activeId) => {
                  const ap = activePowers.find(p => p.id === activeId);
                  if (ap && ap.duracao === 1) { // Concentração
                    if (actions < 1) {
                      toast.error('Você não tem Ação Padrão restante neste turno para manter este poder!');
                      return;
                    }
                    setActions(prev => Math.max(0, prev - 1));
                  }
                  await maintainPower(activeId);
                }}
                onDeactivate={deactivatePower}
                onUse={handleUsePowerFromActive}
                isDisabled={isConfirming}
              />

              <div className="space-y-2">
                {activeEquippedPowers.length > 0 ? (
                  activeEquippedPowers.map((powerDetail: any) => {
                    return (
                      <div key={powerDetail.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 group hover:border-purple-500/30 transition-all gap-3">
                        <div 
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer hover:opacity-85 transition-opacity"
                          onClick={() => setViewingPower(powerDetail)}
                          title="Ver detalhes do poder"
                        >
                          <div className="w-11 h-11 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-100/50 dark:border-purple-900/30 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                            {powerDetail.icone && (powerDetail.icone.startsWith('http') || powerDetail.icone.startsWith('/')) ? (
                              <DynamicIcon name={powerDetail.icone} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Zap className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                              {powerDetail.nome}
                            </h4>
                            <div className="flex items-center gap-x-1.5 gap-y-1 flex-wrap mt-0.5 min-w-0">
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight truncate shrink-0">
                                {powerDetail.originItemName ? `Item: ${powerDetail.originItemName}` : 'Poder Ativo'}
                              </p>
                              <Badge variant="secondary" className="text-[8px] h-4 px-1.5 uppercase font-black bg-gray-155 dark:bg-gray-800 text-gray-500 border-none shadow-sm shrink-0">
                                {powerDetail.parametros?.acao === 1 ? 'Padrão' : powerDetail.parametros?.acao === 2 ? 'Livre' : 'Varia'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-[10px] font-bold border-purple-200 text-purple-600 hover:bg-purple-50 gap-1 active:scale-95"
                            disabled={isResolving}
                            onClick={async () => {
                              setUsingPower(powerDetail);
                              setUsingPowerFromActive(false);
                              setResolution(null);
                              
                              const peCost = powerDetail.custoTotal?.pe ?? 0;

                              const res = await previewPower({
                                powerId: powerDetail.id,
                                nome: powerDetail.nome,
                                icone: powerDetail.icone,
                                duracao: powerDetail.parametros.duracao,
                                peCost,
                              }, character);

                              if (res) {
                                setResolution(res.resolution);
                              }
                            }}
                          >
                            <Zap className="w-4 h-4" /> Usar
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 italic py-2">Nenhum poder ativo equipado.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Efeitos Passivos e Ações Gerais ────────────────────────────── */}
        <div className="space-y-6">
          <Card className="border-none shadow-md bg-white dark:bg-gray-900 border-l-4 border-l-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
                <Activity className="w-4 h-4 text-emerald-500" />
                Efeitos Passivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Poderes Passivos e Ativados Ligados */}
                {(() => {
                  const passiveOrActivatedPowersList: { powerId: string; isEquipped: boolean; id: string; originItemName?: string }[] = [];

                  character.powers.forEach(p => {
                    passiveOrActivatedPowersList.push({
                      powerId: p.powerId,
                      isEquipped: p.isEquipped,
                      id: p.id,
                    });
                  });

                  character.powerArrays
                    .filter(a => a.isEquipped)
                    .forEach(a => {
                      const arrayDetail = detailedArrays[a.powerArrayId];
                      if (arrayDetail && arrayDetail.powers) {
                        arrayDetail.powers.forEach(p => {
                          passiveOrActivatedPowersList.push({
                            powerId: p.id,
                            isEquipped: true,
                            id: p.id,
                          });
                        });
                      }
                    });

                  equippedItemIdsList.forEach(itemId => {
                    const itemDetail = detailedItems[itemId!];
                    if (!itemDetail) return;

                    if (itemDetail.powerIds) {
                      itemDetail.powerIds.forEach(pid => {
                        passiveOrActivatedPowersList.push({
                          powerId: pid,
                          isEquipped: true,
                          id: pid,
                          originItemName: itemDetail.nome
                        });
                      });
                    }

                    if (itemDetail.powerArrayIds) {
                      itemDetail.powerArrayIds.forEach(paid => {
                        const arrayDetail = detailedArrays[paid];
                        if (arrayDetail && arrayDetail.powers) {
                          arrayDetail.powers.forEach(p => {
                            passiveOrActivatedPowersList.push({
                              powerId: p.id,
                              isEquipped: true,
                              id: p.id,
                              originItemName: itemDetail.nome
                            });
                          });
                        }
                      });
                    }
                  });

                  const passiveEffectsToRender = passiveOrActivatedPowersList
                    .filter((p, index, self) => self.findIndex(t => t.powerId === p.powerId) === index)
                    .filter(p => {
                      const detail = detailedPowers[p.powerId];
                      if (!p.isEquipped || !detail) return false;
                      
                      // Permanente (duracao = 4)
                      if (detail.parametros?.duracao === 4) {
                        return true;
                      }
                      
                      // Ativado (3) e atualmente ligado (presente em activePowers)
                      if (detail.parametros?.duracao === 3) {
                        return activePowers.some(ap => ap.powerId === p.powerId);
                      }
                      
                      return false;
                    });

                  return (
                    <>
                      {passiveEffectsToRender.map(p => {
                        const detail = detailedPowers[p.powerId];
                        const isAtivado = detail?.parametros?.duracao === 3;
                        return (
                          <div 
                            key={p.id} 
                            className={`p-3 rounded-lg border group transition-colors cursor-pointer hover:opacity-85 ${
                              isAtivado 
                                ? 'bg-purple-50/30 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20' 
                                : 'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20'
                            }`}
                            onClick={() => detail && setViewingPower(detail)}
                            title="Ver detalhes do efeito passivo"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-lg border shadow-sm flex items-center justify-center overflow-hidden shrink-0 ${
                                isAtivado 
                                  ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-100/50 dark:border-purple-900/30 text-purple-500 dark:text-purple-400' 
                                  : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/30 text-emerald-500 dark:text-emerald-400'
                              }`}>
                                {detail?.icone && (detail.icone.startsWith('http') || detail.icone.startsWith('/')) ? (
                                  <DynamicIcon name={detail.icone} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                  isAtivado ? (
                                    <Zap className="w-6 h-6 text-purple-500" />
                                  ) : (
                                    <Shield className="w-6 h-6 text-emerald-500" />
                                  )
                                )}
                              </div>
                              <div>
                                <h4 className={`font-black text-sm ${isAtivado ? 'text-purple-900 dark:text-purple-100' : 'text-emerald-900 dark:text-emerald-100'}`}>
                                  {detail?.nome || p.powerId}
                                </h4>
                                <div className="flex gap-2 items-center mt-0.5">
                                  {isAtivado && (
                                    <span className="text-[9px] uppercase font-black tracking-widest text-purple-500">
                                      Ativado (Ligado)
                                    </span>
                                  )}
                                  {p.originItemName && (
                                    <Badge variant="secondary" className="h-3.5 px-1.5 text-[8px] font-black bg-gray-100 dark:bg-gray-800 text-gray-500 border-none uppercase">
                                      {p.originItemName}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className={`text-[11px] mt-1 pl-7 italic line-clamp-2 ${isAtivado ? 'text-purple-700/80 dark:text-purple-400/80' : 'text-emerald-700/80 dark:text-emerald-400/80'}`}>
                              {detail?.descricao}
                            </p>
                          </div>
                        );
                      })}

                      {/* Condições e Estados */}
                      {character.conditions.length > 0 ? character.conditions.map((cond) => {
                        const condData = CONDICOES.find(c => c.nome.toLowerCase() === cond.toLowerCase());
                        return (
                          <div key={cond} className="flex flex-col gap-1 p-3 rounded-lg bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
                            <div className="flex items-center gap-3">
                              <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
                              <div>
                                <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-100">{cond}</h4>
                                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-bold tracking-tighter">
                                  Condição Ativa • {condData?.patamar || 'Geral'}
                                </p>
                              </div>
                            </div>
                            {condData && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 italic font-medium pl-7 mt-1 leading-relaxed">
                                {renderDescriptionWithTooltips(condData.descricao, condData.nome, 'bottom')}
                              </p>
                            )}
                          </div>
                        );
                      }) : null}

                      {passiveEffectsToRender.length === 0 && character.conditions.length === 0 && (
                        <p className="text-sm text-gray-500 italic py-2">Nenhum efeito passivo relevante.</p>
                      )}
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white dark:bg-gray-900 flex flex-col h-[500px]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
                  <Sword className="w-4 h-4 text-gray-500" />
                  Guia de Ações
                </CardTitle>
              </div>
              <div className="relative group">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar regra ou ação..."
                  className="w-full pl-8 pr-4 py-1.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-1 mt-3 overflow-x-auto pb-1 scrollbar-none">
                {['ALL', 'PADRAO', 'MOVIMENTO', 'COMPLETA', 'REACAO', 'LIVRE', 'REGRA'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all whitespace-nowrap ${selectedCategory === cat
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'
                      }`}
                  >
                    {cat === 'ALL' ? 'Tudo' : cat === 'PADRAO' ? 'Padrão' : cat === 'COMPLETA' ? 'Completa' : cat === 'REACAO' ? 'Reação' : cat === 'LIVRE' ? 'Livre' : cat === 'REGRA' ? 'Regras' : 'Mover'}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto custom-scrollbar pt-0 mt-2">
              <div className="space-y-3 pr-1">
                {filteredCombatActions.length > 0 ? filteredCombatActions.map((action) => (
                  <div key={action.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border-[0.5px] border-gray-100 dark:border-gray-800 hover:border-indigo-500/30 transition-all group">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-black text-sm text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 transition-colors">{action.nome}</h4>
                      <Badge variant="secondary" className={`text-[8px] font-black uppercase px-1.5 py-0 border-none ${action.tipo === 'PADRAO' ? 'bg-red-50 text-red-600' :
                          action.tipo === 'MOVIMENTO' ? 'bg-emerald-50 text-emerald-600' :
                            action.tipo === 'COMPLETA' ? 'bg-amber-50 text-amber-600' :
                              action.tipo === 'REACAO' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {action.tipo}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed italic">{action.descricao}</p>
                  </div>
                )) : (
                  <div className="text-center py-10 opacity-50">
                    <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs italic">Nenhuma regra encontrada.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DiceRoller
        isOpen={!!rollingAction}
        onClose={() => setRollingAction(null)}
        label={rollingAction?.name || ''}
        modifier={rollingAction?.modifier || 0}
        damageFormula={rollingAction?.damage}
        damageModifier={rollingAction?.damageModifier}
        critMargin={rollingAction?.critMargin}
        critMultiplier={rollingAction?.critMultiplier}
        efficiencyBonus={rollingAction?.efficiencyBonus}
        initialApplyEfficiency={true}
        modifierLabel="Bônus de Ataque"
        rollButtonLabel="Atacar"
        initialRule={rollingAction?.initialRule}
        initialExtraDice={rollingAction?.initialExtraDice}
        onRoll={() => {
          if (deactivatePower && activePowers && rollingAction) {
            const isUnarmed = rollingAction.tipo === 'DESARMADO';
            const sourceInfo = isUnarmed
              ? { tipo: 'DESARMADO' as const }
              : { tipo: 'ARMA' as const, domains: rollingAction.domains || [], itemId: rollingAction.itemId };

            for (const ap of activePowers) {
              if (ap.duracao === 0) {
                const efeitos = ap.efeitos;
                if (!efeitos || !Array.isArray(efeitos)) continue;

                let matches = false;
                for (const ef of efeitos) {
                  const baseId = ef.efeitoBaseId || ef.effectBaseId;
                  const configId = ef.configuracaoSelecionada || ef.configuracaoId;

                  if (baseId === 'fortalecer' && (configId === 'dano' || configId === 'recuperacao')) {
                    const inputValue = ef.inputCustomizado || ef.inputValue;
                    if (!inputValue) continue;
                    try {
                      const parsed = JSON.parse(String(inputValue));
                      if (parsed && parsed.alvo && fortaleceAlvoMatch(parsed.alvo, sourceInfo, ap.originItemId)) {
                        matches = true;
                        break;
                      }
                    } catch {}
                  }
                }
                if (matches) {
                  deactivatePower(ap.id);
                }
              }
            }
          }
        }}
      />

      <UnarmedMasteryModal 
        isOpen={isUnarmedModalOpen}
        onClose={() => setIsUnarmedModalOpen(false)}
        character={character}
        onUpdate={handleUpdateMastery}
        isProcessing={isProcessingMastery}
      />

      {usingPower && (
        <PowerUsageModal
          isOpen={!!usingPower}
          onClose={() => {
            setUsingPower(null);
            setUsingPowerFromActive(false);
            setResolution(null);
          }}
          power={usingPower}
          character={character}
          currentPE={character.energy.currentPE}
          resolution={resolution}
          isResolving={isResolving}
          isConfirming={isConfirming}
          showOptionalPE={usingPowerFromActive}
          activePowers={activePowers}
          onSync={onSync}
          onDeactivate={deactivatePower}
          onConfirm={async ({ spendPE }) => {
            const detail = usingPower;
            const peCost = spendPE ? (detail.custoTotal?.pe ?? 0) : 0;
            await confirmUsePower(
              {
                powerId: detail.id,
                nome: detail.nome,
                icone: detail.icone,
                duracao: detail.parametros.duracao,
                peCost,
                efeitos: detail.effects,
                originItemId: detail.originItemId,
              },
              { skipActivation: usingPowerFromActive, mutations: resolution?.mutations }
            );
            setUsingPower(null);
            setUsingPowerFromActive(false);
            setResolution(null);
          }}
        />
      )}

      {viewingItem && (
        <ResumoItem
          isOpen={!!viewingItem}
          onClose={() => setViewingItem(null)}
          tipo={viewingItem.tipo}
          nome={viewingItem.nome}
          icone={viewingItem.icone ?? undefined}
          descricao={viewingItem.descricao}
          dominio={{ name: viewingItem.dominio.name, peculiarId: viewingItem.dominio.peculiarId ?? undefined }}
          dominios={viewingItem.dominios?.map(d => ({
            name: d.name,
            areaConhecimento: d.areaConhecimento ?? undefined,
            peculiarId: d.peculiarId ?? undefined,
          }))}
          custoBase={viewingItem.valorBase}
          nivelCalculado={viewingItem.nivelItem}
          custoRealCalculado={viewingItem.valorBase}
          precoVendaCalculado={Math.floor(viewingItem.valorBase / 2)}
          selectedPowers={viewingItem.powerIds?.map(id => detailedPowers[id]).filter(Boolean) || []}
          selectedPowerArrays={viewingItem.powerArrayIds?.map(id => detailedArrays[id]).filter(Boolean) || []}
          onOpenPowerDetails={(id) => setViewingPower(detailedPowers[id] || null)}
          onOpenPowerArrayDetails={(id) => setViewingArray(detailedArrays[id] || null)}
          itemData={viewingItem}
        />
      )}

      {viewingPower && (() => {
        const pCon = (viewingPower as any).efeitos ? viewingPower : poderResponseToPoder(viewingPower);
        return (
          <ResumoPoder
            isOpen={!!viewingPower}
            onClose={() => setViewingPower(null)}
            poder={pCon}
            detalhes={(() => {
              const baseDetails = calcularDetalhesPoder(pCon, catalogEfeitos, catalogModificacoes);
              const hasAlquebrado = (character?.conditions || []).some((c: string) => {
                const clean = c.includes('(') ? c.split('(')[0].trim() : c;
                return clean === 'Alquebrado';
              });
              const peCostMultiplier = hasAlquebrado ? 2 : 1;
              return {
                ...baseDetails,
                peTotal: baseDetails.peTotal * peCostMultiplier,
              };
            })()}
          />
        );
      })()}

      {viewingArray && (() => {
        const aCon = (viewingArray as any).poderes ? viewingArray : acervoResponseToAcervo(viewingArray as AcervoResponse);
        return (
          <ResumoAcervo
            isOpen={!!viewingArray}
            onClose={() => setViewingArray(null)}
            acervo={aCon as any}
          />
        );
      })()}
    </div>
  );
}
