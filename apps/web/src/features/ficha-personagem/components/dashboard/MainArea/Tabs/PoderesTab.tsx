import { useState, useEffect, useRef } from 'react';
import { CharacterResponse, SyncCharacterData } from '@/services/characters.types';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, ModalFooter, Select, DynamicIcon, Input } from '@/shared/ui';
import { Zap, Plus, Search, Layers, Shield, Sparkles, Sword, Trash2, ChevronLeft, Package, Edit2, Info, Clock, Ruler, Timer, ChevronDown, ChevronUp, Check, Bookmark } from 'lucide-react';
import { DOMINIOS, ESCALAS } from '@/data';
import { fetchMyPeculiarities, createPeculiarity } from '@/services/peculiarities.service';
import { copyPublicPower } from '@/services/powers.service';
import { copyPowerArray } from '@/services/powerArrays.service';
import { charactersService } from '@/services/characters.service';
import type { PeculiaridadeResponse, PoderResponse, AcervoResponse } from '@/services/types';
import { toast } from '@/shared/ui';
import { BibliotecaAdicionarPoderModal } from './BibliotecaAdicionarPoderModal';
import { useCatalog } from '@/context/useCatalog';
import { ResumoPoder } from '@/features/criador-de-poder/components/ResumoPoder';
import { ResumoAcervo } from '@/features/criador-de-poder/components/ResumoAcervo';
import { CriadorAcervo } from '@/features/criador-de-poder/components/CriadorAcervo';
import { calcularDetalhesPoder, type Poder as PoderCalculo } from '@/features/criador-de-poder/regras/calculadoraCusto';
import { CriadorDePoderModal } from '@/features/gerenciador-criaturas/components/CriadorDePoderModal';
import { poderResponseToPoder, acervoResponseToAcervo } from '@/features/criador-de-poder/utils/poderApiConverter';

// Helper para obter nome da escala
function getNomeEscala(tipo: 'acao' | 'alcance' | 'duracao', valor: number): string {
  const escala = ESCALAS[tipo]?.escala.find((e: { valor: number }) => e.valor === valor);
  return escala?.nome || String(valor);
}

interface PoderesTabProps {
  character: CharacterResponse;
  _onSync: (data: SyncCharacterData) => Promise<void>;
  onAcquireDomainMastery: (domainId: string, masteryLevel: 'INICIANTE' | 'PRATICANTE' | 'MESTRE') => Promise<void>;
  onDiscardDomainMastery: (domainId: string) => void | Promise<void>;
  onAcquirePower: (powerId: string) => Promise<void>;
  onAcquirePowerArray: (powerArrayId: string) => Promise<void>;
  onEquipPower: (powerId: string) => Promise<void>;
  onUnequipPower: (powerId: string) => Promise<void>;
  onEquipPowerArray: (powerArrayId: string) => Promise<void>;
  onUnequipPowerArray: (powerArrayId: string) => Promise<void>;
  onRemovePower: (powerId: string) => void | Promise<void>;
  onRemovePowerArray: (powerArrayId: string) => void | Promise<void>;
}

export function PoderesTab({ 
  character, 
  _onSync, 
  onAcquireDomainMastery, 
  onDiscardDomainMastery, 
  onAcquirePower, 
  onAcquirePowerArray,
  onEquipPower,
  onUnequipPower,
  onEquipPowerArray,
  onUnequipPowerArray,
  onRemovePower,
  onRemovePowerArray
}: PoderesTabProps) {
  // ─── Estados Principais (Ordem Crítica) ──────────────────────────────────
  const [viewingPower, setViewingPower] = useState<any | null>(null);
  const [editingPower, setEditingPower] = useState<any | null>(null);
  const [viewingArray, setViewingArray] = useState<AcervoResponse | null>(null);
  const [editingArray, setEditingArray] = useState<AcervoResponse | null>(null);
  const [expandedArrays, setExpandedArrays] = useState<Set<string>>(new Set());
  const [savingToLibraryId, setSavingToLibraryId] = useState<string | null>(null);
  
  // ─── Persistência Local ────────────────────────────────────────────────
  const storageKey = `acervos-ativos-${character.id}`;
  const [activePowerByArray, setActivePowerByArray] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(activePowerByArray));
  }, [activePowerByArray, storageKey]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [detailedPowers, setDetailedPowers] = useState<Record<string, any>>({});
  const [detailedArrays, setDetailedArrays] = useState<Record<string, any>>({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [myPeculiarities, setMyPeculiarities] = useState<PeculiaridadeResponse[]>([]);
  
  const { efeitos: catalogEfeitos, modificacoes: catalogModificacoes } = useCatalog();

  // Seleção de Domínio
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedMastery, setSelectedMastery] = useState<'INICIANTE' | 'PRATICANTE' | 'MESTRE'>('INICIANTE');
  const [showPeculiarityLibrary, setShowPeculiarityLibrary] = useState(false);
  const [isCreatingPeculiarity, setIsCreatingPeculiarity] = useState(false);
  const [newPeculiarity, setNewPeculiarity] = useState({
    nome: '',
    descricao: '',
    espiritual: true,
    icone: ''
  });

  // ─── Efeitos de Carga ──────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const [peculiarities, powersList, arraysList] = await Promise.all([
          fetchMyPeculiarities(),
          charactersService.fetchCharacterPowers(character.id).catch(() => []),
          charactersService.fetchCharacterPowerArrays(character.id).catch(() => [])
        ]);
        
        setMyPeculiarities(peculiarities);
        
        const pMap: Record<string, any> = {};
        powersList.forEach(p => { pMap[p.id] = p; });
        setDetailedPowers(pMap);

        const aMap: Record<string, any> = {};
        const newActivePowerByArray = { ...activePowerByArray };
        let hasChanges = false;

        arraysList.forEach(a => { 
          aMap[a.id] = a;
          // Se não houver poder ativo definido para este acervo, define o primeiro como default
          if (!newActivePowerByArray[a.id] && a.powers && a.powers.length > 0) {
            newActivePowerByArray[a.id] = a.powers[0].id;
            hasChanges = true;
          }
        });

        if (hasChanges) {
          setActivePowerByArray(newActivePowerByArray);
        }
        
        setDetailedArrays(aMap);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setIsLoadingDetails(false);
      }
    };
    
    loadData();
  }, [character.id, character.powers.length, character.powerArrays.length, refreshKey]);

  // ─── Handlers ──────────────────────────────────────────────────────────
  const handleAddMastery = async () => {
    if (!selectedDomain || !selectedMastery) return;
    setIsProcessing(true);
    try {
      await onAcquireDomainMastery(selectedDomain, selectedMastery);
      closeModal();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveMastery = async () => {
    if (!selectedDomain) return;
    setIsProcessing(true);
    try {
      await onDiscardDomainMastery(selectedDomain);
      closeModal();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreatePeculiarity = async () => {
    if (!newPeculiarity.nome || !newPeculiarity.descricao) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    setIsProcessing(true);
    try {
      const created = await createPeculiarity({ ...newPeculiarity, isPublic: false });
      setMyPeculiarities(prev => [created, ...prev]);
      setSelectedDomain(created.id);
      setIsCreatingPeculiarity(false);
      setShowPeculiarityLibrary(false);
      toast.success('Peculiaridade criada!');
    } catch (err) {
      toast.error('Erro ao criar peculiaridade');
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDomain('');
    setSelectedMastery('INICIANTE');
    setShowPeculiarityLibrary(false);
    setIsCreatingPeculiarity(false);
  };

  const getDomainIcon = (mastery: any, className = "w-3 h-3") => {
    const domainId = typeof mastery === 'object' ? mastery.domainId : mastery;
    if (mastery?.icone) return <DynamicIcon name={mastery.icone} className={className} />;
    
    const localPeculiarity = myPeculiarities.find(p => p.id === domainId);
    if (localPeculiarity?.icone) return <DynamicIcon name={localPeculiarity.icone} className={className} />;

    const domainData = DOMINIOS.find(d => d.id === domainId);
    switch (domainData?.categoria) {
      case 'espiritual': return <Sparkles className={className} />;
      case 'arma': return <Sword className={className} />;
      default: return <Shield className={className} />;
    }
  };

  const getDomainName = (mastery: any) => {
    if (typeof mastery === 'object' && mastery.nome) return mastery.nome;
    const domainId = typeof mastery === 'object' ? mastery.domainId : mastery;
    const systemDomain = DOMINIOS.find(d => d.id === domainId);
    if (systemDomain) return systemDomain.nome;
    const peculiarity = myPeculiarities.find(p => p.id === domainId);
    return peculiarity?.nome || domainId;
  };

  const filteredSystemDomains = DOMINIOS.filter(d => d.id !== 'peculiar');

  const toggleArrayExpansion = (arrayId: string) => {
    const newSet = new Set(expandedArrays);
    if (newSet.has(arrayId)) {
      newSet.delete(arrayId);
    } else {
      newSet.add(arrayId);
    }
    setExpandedArrays(newSet);
  };

  const selectActivePowerInArray = (arrayId: string, powerId: string) => {
    setActivePowerByArray(prev => ({ ...prev, [arrayId]: powerId }));
  };

  // ─── Renderização de Poder ─────────────────────────────────────────────
  const renderPowerCard = (power: any, isEquipped: boolean, isPassive: boolean, isNested: boolean = false, isActive: boolean = false, arrayId?: string) => {
    const detail = isNested ? power : detailedPowers[power.powerId];
    if (!detail) return null;

    const peCost = calcularDetalhesPoder(poderResponseToPoder(detail as PoderResponse), catalogEfeitos, catalogModificacoes).peTotal;

    return (
      <Card 
        key={isNested ? detail.id : power.id} 
        className={`border transition-all hover:shadow-md ${
          isEquipped 
            ? (isPassive ? 'border-blue-200 dark:border-blue-900/50' : 'border-purple-200 dark:border-purple-900/50')
            : 'border-gray-200 dark:border-gray-700 grayscale hover:grayscale-0 opacity-80 hover:opacity-100'
        } ${isNested ? 'bg-white/50 dark:bg-black/20 shadow-none border-dashed' : ''} ${isActive ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900 border-indigo-500' : ''}`}
        onClick={() => isNested && arrayId && selectActivePowerInArray(arrayId, detail.id)}
      >
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto sm:flex-1">
              <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border overflow-hidden ${
                isEquipped 
                  ? (isPassive ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-500' : 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800 text-purple-500')
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
              }`}>
                {detail.icone ? <DynamicIcon name={detail.icone} className="w-full h-full object-cover" /> : (isPassive ? <Shield className="w-6 h-6" /> : <Zap className="w-6 h-6" />)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-gray-900 dark:text-gray-100 truncate text-base leading-tight cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); setViewingPower(poderResponseToPoder(detail)); }}>
                    {detail.nome}
                  </h4>
                  {isActive && <div className="bg-indigo-500 text-white rounded-full p-0.5 shadow-sm animate-in zoom-in duration-200"><Check className="w-3 h-3" /></div>}
                </div>
                <div className="flex items-center gap-x-2 gap-y-1 mt-1 flex-wrap text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-gray-500 whitespace-nowrap"><Sparkles className="w-3 h-3" /> {(isNested ? (detail.custoTotal?.pda ?? detail.pdaCost) : power.finalPdaCost)} PdA</span>
                  <span className="text-gray-300 hidden xs:inline">•</span>
                  <span className="text-gray-500 whitespace-nowrap">{(isNested ? (detail.custoTotal?.espacos ?? detail.slotCost) : power.slotCost)} Espaços</span>
                  <span className="text-gray-300 hidden xs:inline">•</span>
                  <span className="uppercase text-gray-500 whitespace-nowrap">{getDomainName({ domainId: detail.dominio.peculiarId || detail.dominio.name })}</span>
                </div>
              </div>
            </div>
            
            {!isNested && (
              <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto justify-end border-t sm:border-0 pt-2 sm:pt-0 border-gray-100 dark:border-gray-800 mt-1 sm:mt-0">
                <Button variant="ghost" size="sm" onClick={() => setViewingPower(poderResponseToPoder(detail))} className="h-9 w-9 p-0 text-gray-400 hover:text-indigo-500">
                  <Info className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingPower(poderResponseToPoder(detail))} className="h-9 w-9 p-0 text-gray-400 hover:text-emerald-500" title="Editar">
                  <Edit2 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={savingToLibraryId !== null}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setSavingToLibraryId(detail.id);
                    try {
                      await copyPublicPower(detail.id);
                      toast.success(`Poder "${detail.nome}" salvo na biblioteca!`);
                    } catch (err) {
                      toast.error('Erro ao salvar poder na biblioteca.');
                    } finally {
                      setSavingToLibraryId(null);
                    }
                  }}
                  className="h-9 w-9 p-0 text-gray-400 hover:text-blue-500"
                  title="Salvar na Biblioteca"
                >
                  <Bookmark className="w-5 h-5" />
                </Button>
                {isEquipped ? (
                  <Button variant="ghost" size="sm" onClick={() => onUnequipPower(power.powerId)} className="h-9 w-9 p-0 text-amber-500 hover:bg-amber-50 hover:text-amber-600" title="Desequipar">
                    <Package className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => onEquipPower(power.powerId)} className="h-8 px-2 text-[10px] font-bold border text-gray-600 hover:text-purple-600 hover:border-purple-600" title="Equipar">
                    Equipar
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => onRemovePower(power.powerId)} className="h-9 w-9 p-0 text-red-400 hover:bg-red-50 hover:text-red-600" title="Excluir">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            )}
            {isNested && (
              <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto justify-end border-t sm:border-0 pt-2 sm:pt-0 border-gray-100 dark:border-gray-800 mt-1 sm:mt-0">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setViewingPower(poderResponseToPoder(detail)); }} className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-500">
                  <Info className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingPower(poderResponseToPoder(detail)); }} className="h-8 w-8 p-0 text-gray-400 hover:text-emerald-500" title="Editar">
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[10px] bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1 whitespace-nowrap shrink-0"><Clock className="w-3 h-3" /> {getNomeEscala('acao', detail.parametros.acao)}</span>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <span className="flex items-center gap-1 whitespace-nowrap shrink-0"><Ruler className="w-3 h-3" /> {getNomeEscala('alcance', detail.parametros.alcance)}</span>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <span className="flex items-center gap-1 whitespace-nowrap shrink-0"><Timer className="w-3 h-3" /> {getNomeEscala('duracao', detail.parametros.duracao)}</span>
            {peCost > 0 && <><span className="text-gray-300 hidden sm:inline">•</span><span className="flex items-center gap-1 text-blue-500 font-bold whitespace-nowrap shrink-0"><Zap className="w-3 h-3" /> {peCost} PE</span></>}
          </div>
          
          {detail.descricao && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{detail.descricao}</p>
          )}

          {detail.efeitos && detail.efeitos.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {detail.efeitos.map((e: any, i: number) => (
                <Badge key={i} variant="outline" className={`text-[9px] px-1.5 py-0 border-dashed ${e.grau < 0 ? 'border-red-300 text-red-600' : 'border-indigo-300 text-indigo-600'}`}>
                  {catalogEfeitos.find(ce => ce.id === e.effectBaseId)?.nome || e.effectBaseId} {e.grau !== 0 && (e.grau > 0 ? `+${e.grau}` : e.grau)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderPowerArrayCard = (array: any, isEquipped: boolean) => {
    const detail = detailedArrays[array.powerArrayId];
    const isExpanded = expandedArrays.has(array.id);
    const peCostValue = detail?.custoTotal?.pe || detail?.peCost || 0;
    
    return (
      <Card key={array.id} className={`border-2 transition-all ${
        isEquipped 
          ? 'border-indigo-500/30 bg-indigo-50/10 dark:bg-indigo-900/5 shadow-md' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 opacity-90 grayscale hover:grayscale-0 hover:opacity-100'
      } relative overflow-hidden`}>
        {isEquipped && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />}
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 min-w-0">
              <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border overflow-hidden ${
                isEquipped ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
              }`}>
                {detail?.icone ? <DynamicIcon name={detail.icone} className="w-full h-full object-cover" /> : <Layers className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-black truncate text-base leading-tight ${isEquipped ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {detail?.nome || array.powerArrayId}
                </h4>
                <p className={`text-[10px] font-bold mt-1 ${isEquipped ? 'text-indigo-600' : 'text-gray-500'}`}>
                  Acervo • {array.finalPdaCost} PdA • {array.slotCost} Espaços {peCostValue > 0 && `• ${peCostValue} PE`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto justify-end border-t sm:border-0 pt-2 sm:pt-0 border-gray-100 dark:border-gray-800 mt-1 sm:mt-0">
              <Button variant="ghost" size="sm" onClick={() => detail && setViewingArray(detail)} className="h-9 w-9 p-0 text-gray-400 hover:text-indigo-500">
                <Info className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => detail && setEditingArray(detail)} className="h-9 w-9 p-0 text-gray-400 hover:text-emerald-500" title="Editar">
                <Edit2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={savingToLibraryId !== null}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!detail) return;
                  setSavingToLibraryId(detail.id);
                  try {
                    await copyPowerArray(detail.id);
                    toast.success(`Acervo "${detail.nome}" salvo na biblioteca!`);
                  } catch (err) {
                    toast.error('Erro ao salvar acervo na biblioteca.');
                  } finally {
                    setSavingToLibraryId(null);
                  }
                }}
                className="h-9 w-9 p-0 text-gray-400 hover:text-blue-500"
                title="Salvar na Biblioteca"
              >
                <Bookmark className="w-5 h-5" />
              </Button>
              {isEquipped ? (
                <Button variant="ghost" size="sm" onClick={() => onUnequipPowerArray(array.powerArrayId)} className="h-9 w-9 p-0 text-amber-500 hover:bg-amber-50 hover:text-amber-600" title="Desequipar">
                  <Package className="w-5 h-5" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => onEquipPowerArray(array.powerArrayId)} className="h-8 px-2 text-[10px] font-bold border text-gray-600 hover:text-indigo-600 hover:border-indigo-600" title="Equipar">
                  Equipar
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => onRemovePowerArray(array.powerArrayId)} className="h-9 w-9 p-0 text-red-400 hover:bg-red-50 hover:text-red-600" title="Excluir">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {detail?.descricao && (
            <p className="text-xs text-gray-500 line-clamp-1 leading-relaxed px-1">
              {detail.descricao}
            </p>
          )}

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <button 
              onClick={() => toggleArrayExpansion(array.id)}
              className="w-full flex items-center justify-between py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-[10px] font-bold text-gray-500 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-3 h-3" />
                VER PODERES DO ACERVO ({detail?.powers?.length || 0})
              </span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isExpanded && detail?.powers && (
              <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 pl-2 border-l-2 border-indigo-100 dark:border-indigo-900/50">
                {detail.powers.map((p: any) => renderPowerCard(
                  p, 
                  isEquipped, 
                  p.parametros.acao === 5 && p.parametros.duracao === 4, 
                  true, 
                  activePowerByArray[array.id] === p.id,
                  array.id
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* ─── Header de Status ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md bg-white dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-purple-500" /> Recursos de Poder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
              <div>
                <p className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase">Mental CD</p>
                <p className="text-lg font-black text-purple-900 dark:text-purple-100">
                  {10 + character.attributes[character.attributes.keyMental].rollModifier}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase">Física CD</p>
                <p className="text-lg font-black text-red-900 dark:text-red-100">
                  {10 + character.attributes[character.attributes.keyPhysical].rollModifier}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-md bg-white dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-indigo-500" /> Domínios & Mestrias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {character.domainMasteries.map((mastery) => {
                const isPeculiarity = !!mastery.nome || !DOMINIOS.find(d => d.id === mastery.domainId);
                return (
                  <Badge 
                    key={mastery.domainId} 
                    variant={isPeculiarity ? 'espirito' : 'secondary'} 
                    className={`pl-1 pr-3 py-1 flex items-center gap-2 border-indigo-200 dark:border-indigo-800 cursor-pointer hover:opacity-80 transition-colors ${
                      isPeculiarity ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                    }`}
                    onClick={() => {
                      setSelectedDomain(mastery.domainId);
                      setSelectedMastery(mastery.masteryLevel);
                      setIsModalOpen(true);
                    }}
                  >
                    <div className="w-11 h-11 shrink-0 flex items-center justify-center overflow-hidden rounded bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5 shadow-sm p-0.5">
                      {getDomainIcon(mastery, "w-full h-full object-cover")}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black uppercase text-[11px] leading-tight">{getDomainName(mastery)}</span>
                      <span className="text-[9px] font-bold opacity-70 leading-tight">{mastery.masteryLevel}</span>
                    </div>
                  </Badge>
                );
              })}
              <Button variant="ghost" size="sm" className="h-11 px-3 text-[10px] font-bold border border-dashed text-gray-400 hover:text-indigo-500" onClick={() => { setSelectedDomain(''); setSelectedMastery('INICIANTE'); setIsModalOpen(true); }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Resumo de Gasto ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-purple-50 dark:bg-purple-900/10 p-4 flex flex-col items-center">
          <p className="text-[10px] font-black text-purple-700/60 uppercase tracking-widest mb-1">PdA em Poderes</p>
          <p className="text-2xl font-black text-purple-900 dark:text-purple-100">
            {character.powers.reduce((acc, p) => acc + p.finalPdaCost, 0) + character.powerArrays.reduce((acc, p) => acc + p.finalPdaCost, 0)} PdA
          </p>
        </Card>
        <Card className="border-none shadow-sm bg-indigo-50 dark:bg-indigo-900/10 p-4 flex flex-col items-center">
          <p className="text-[10px] font-black text-indigo-700/60 uppercase tracking-widest mb-1">Espaços de Poder</p>
          <p className="text-2xl font-black text-indigo-900 dark:text-indigo-100">
            {character.slots?.usedSlots || 0} / {character.slots?.maxSlots || 0}
          </p>
        </Card>
      </div>

      {/* ─── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar no arsenal..." className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
          </div>
          <Badge variant="outline" className="h-8 px-3 font-bold">{character.powers.length + character.powerArrays.length} Total</Badge>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg shadow-purple-600/20">
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </div>

      {/* ─── Listagens ──────────────────────────────────────────────────── */}
      {isLoadingDetails ? (
        <div className="py-12 text-center text-gray-400">Hidratando arsenal...</div>
      ) : (
        <div className="space-y-8">
          {/* Ativáveis */}
          {character.powers.some(p => p.isEquipped && !(detailedPowers[p.powerId]?.parametros?.acao === 5 && detailedPowers[p.powerId]?.parametros?.duracao === 4)) && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1"><Zap className="w-3.5 h-3.5" /> Poderes Ativáveis</h3>
              <div className="flex flex-col gap-3">
                {character.powers.filter(p => p.isEquipped && !(detailedPowers[p.powerId]?.parametros?.acao === 5 && detailedPowers[p.powerId]?.parametros?.duracao === 4)).map(p => renderPowerCard(p, true, false))}
              </div>
            </div>
          )}

          {/* Passivas */}
          {character.powers.some(p => p.isEquipped && (detailedPowers[p.powerId]?.parametros?.acao === 5 && detailedPowers[p.powerId]?.parametros?.duracao === 4)) && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1"><Shield className="w-3.5 h-3.5 text-blue-500" /> Passivas Equipadas</h3>
              <div className="flex flex-col gap-3">
                {character.powers.filter(p => p.isEquipped && (detailedPowers[p.powerId]?.parametros?.acao === 5 && detailedPowers[p.powerId]?.parametros?.duracao === 4)).map(p => renderPowerCard(p, true, true))}
              </div>
            </div>
          )}

          {/* Acervos */}
          {character.powerArrays.some(a => a.isEquipped) && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1"><Layers className="w-3.5 h-3.5 text-indigo-500" /> Acervos em Uso</h3>
              <div className="flex flex-col gap-3">
                {character.powerArrays.filter(a => a.isEquipped).map(array => renderPowerArrayCard(array, true))}
              </div>
            </div>
          )}

          {/* Não Equipados */}
          {(character.powers.some(p => !p.isEquipped) || character.powerArrays.some(a => !a.isEquipped)) && (
            <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Não Equipados (Inventário)</h3>
              <div className="flex flex-col gap-3">
                {character.powers.filter(p => !p.isEquipped).map(p => renderPowerCard(p, false, false))}
                {character.powerArrays.filter(a => !a.isEquipped).map(array => renderPowerArrayCard(array, false))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Modais ─────────────────────────────────────────────────────── */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Gerenciar Domínio" size={isCreatingPeculiarity ? 'lg' : 'md'}>
        <div className="space-y-6 py-2">
          {isCreatingPeculiarity ? (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setIsCreatingPeculiarity(false)} className="flex items-center gap-1 text-gray-500 p-0"><ChevronLeft className="w-4 h-4" /> Voltar</Button>
              <Input label="Nome da Peculiaridade" value={newPeculiarity.nome} onChange={e => setNewPeculiarity({...newPeculiarity, nome: e.target.value})} />
              <textarea className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 text-sm h-24 outline-none focus:ring-2 focus:ring-purple-500" placeholder="Descrição..." value={newPeculiarity.descricao} onChange={e => setNewPeculiarity({...newPeculiarity, descricao: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Energia" value={newPeculiarity.espiritual ? 'true' : 'false'} onChange={e => setNewPeculiarity({...newPeculiarity, espiritual: e.target.value === 'true'})} options={[{value: 'true', label: 'Espiritual'}, {value: 'false', label: 'Técnica'}]} />
                <Input label="Ícone (URL)" value={newPeculiarity.icone} onChange={e => setNewPeculiarity({...newPeculiarity, icone: e.target.value})} />
              </div>
            </div>
          ) : (
            <>
              {selectedDomain && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border shadow-inner">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 shrink-0 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center border shadow-md overflow-hidden p-1">{getDomainIcon(selectedDomain, "w-full h-full object-cover")}</div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selecionado</p>
                      <p className="text-2xl font-black text-gray-900 dark:text-white uppercase">{getDomainName({ domainId: selectedDomain })}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemoveMastery} className="text-red-500 p-2 h-12 w-12"><Trash2 className="w-6 h-6" /></Button>
                </div>
              )}
              <div className="space-y-4">
                {!showPeculiarityLibrary ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className={`h-20 flex flex-col gap-1 ${!showPeculiarityLibrary ? 'border-indigo-500 bg-indigo-50/50' : ''}`} onClick={() => setShowPeculiarityLibrary(false)}><Shield className="w-5 h-5" />Sistema</Button>
                      <Button variant="outline" className={`h-20 flex flex-col gap-1 ${showPeculiarityLibrary ? 'border-purple-500 bg-purple-50/50' : ''}`} onClick={() => setShowPeculiarityLibrary(true)}><Sparkles className="w-5 h-5" />Peculiar</Button>
                    </div>
                    {!showPeculiarityLibrary && <Select label="Domínio" value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)} options={filteredSystemDomains.map(d => ({ value: d.id, label: d.nome }))} placeholder="Selecione..." />}
                  </>
                ) : (
                  <div className="space-y-4 animate-in slide-in-from-right-4">
                    <Button variant="ghost" size="sm" onClick={() => setShowPeculiarityLibrary(false)} className="flex items-center gap-1 text-gray-500 p-0"><ChevronLeft className="w-4 h-4" /> Voltar</Button>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {myPeculiarities.map(p => (
                        <button key={p.id} onClick={() => setSelectedDomain(p.id)} className={`flex items-center gap-4 p-3 rounded-xl border text-left transition-all ${selectedDomain === p.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500/20' : 'border-gray-100 hover:bg-gray-50'}`}>
                          <div className="w-14 h-14 shrink-0 rounded-xl bg-white border flex items-center justify-center overflow-hidden p-1">{p.icone ? <DynamicIcon name={p.icone} className="w-full h-full object-cover" /> : <Shield className="w-7 h-7 text-purple-400" />}</div>
                          <span className="text-sm font-black uppercase text-gray-900 dark:text-white leading-none">{p.nome}</span>
                        </button>
                      ))}
                      <Button variant="ghost" className="w-full border border-dashed border-purple-300 text-purple-600 mt-2" onClick={() => setIsCreatingPeculiarity(true)}><Plus className="w-4 h-4 mr-2" /> Criar Nova</Button>
                    </div>
                  </div>
                )}
                <Select label="Maestria" value={selectedMastery} onChange={e => setSelectedMastery(e.target.value as any)} options={[{ value: 'INICIANTE', label: 'Iniciante' }, { value: 'PRATICANTE', label: 'Praticante' }, { value: 'MESTRE', label: 'Mestre' }]} />
              </div>
            </>
          )}
        </div>
        <ModalFooter>
          {isCreatingPeculiarity ? (
            <><Button variant="ghost" onClick={() => setIsCreatingPeculiarity(false)}>Cancelar</Button><Button onClick={handleCreatePeculiarity} loading={isProcessing}>Criar e Selecionar</Button></>
          ) : (
            <><Button variant="ghost" onClick={closeModal}>Cancelar</Button><Button onClick={handleAddMastery} loading={isProcessing} disabled={!selectedDomain}>Salvar Maestria</Button></>
          )}
        </ModalFooter>
      </Modal>

      <BibliotecaAdicionarPoderModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAcquirePower={async id => { await onAcquirePower(id); setIsAddModalOpen(false); }} onAcquirePowerArray={async id => { await onAcquirePowerArray(id); setIsAddModalOpen(false); }} isProcessing={isProcessing} />

      {viewingPower && (
        <ResumoPoder
          isOpen={!!viewingPower}
          onClose={() => setViewingPower(null)}
          poder={viewingPower as PoderCalculo}
          detalhes={calcularDetalhesPoder(viewingPower as PoderCalculo, catalogEfeitos, catalogModificacoes)}
        />
      )}

      {viewingArray && (
        <ResumoAcervo
          isOpen={!!viewingArray}
          onClose={() => setViewingArray(null)}
          acervo={acervoResponseToAcervo(viewingArray)}
        />
      )}

      {editingPower && (
        <CriadorDePoderModal
          isOpen={!!editingPower}
          onClose={() => setEditingPower(null)}
          poderParaEditar={editingPower as any}
          onSave={async () => {
            setEditingPower(null);
            await _onSync({});
            setRefreshKey(k => k + 1);
          }}
        />
      )}

      {editingArray && (
        <CriadorAcervo
          isOpen={!!editingArray}
          onClose={() => setEditingArray(null)}
          acervoInicial={acervoResponseToAcervo(editingArray)}
          onSalvo={async () => {
            setEditingArray(null);
            await _onSync({});
            setRefreshKey(k => k + 1);
          }}
        />
      )}
    </div>
  );
}
