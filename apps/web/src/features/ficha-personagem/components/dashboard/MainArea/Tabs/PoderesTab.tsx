import { useState, useEffect } from 'react';
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
import { obterBonusFortalecerAtivos } from '@/features/ficha-personagem/utils/fortalecerHelper';

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
  activePowers?: any[];
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
  onRemovePowerArray,
  activePowers = [],
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

    const hasAlquebrado = (character?.conditions || []).some((c: string) => {
      const clean = c.includes('(') ? c.split('(')[0].trim() : c;
      return clean === 'Alquebrado';
    });
    const peCostMultiplier = hasAlquebrado ? 2 : 1;
    const peCost = calcularDetalhesPoder(poderResponseToPoder(detail as PoderResponse), catalogEfeitos, catalogModificacoes).peTotal * peCostMultiplier;

    return (
      <Card 
        key={isNested ? detail.id : power.id} 
        className={`border transition-all hover:shadow-md ${
          isEquipped 
            ? (isPassive ? 'border-blue-200 dark:border-blue-900/50' : 'border-purple-200 dark:border-purple-900/50')
            : 'border-gray-200 dark:border-gray-700 grayscale hover:grayscale-0 opacity-80 hover:opacity-100'
        } ${isNested ? 'bg-white/50 dark:bg-black/20 shadow-none border-dashed' : ''} ${isActive ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900 border-indigo-500' : ''}`}
        onClick={(e) => {
          if (isNested && arrayId) {
            e.stopPropagation();
            selectActivePowerInArray(arrayId, detail.id);
          } else {
            setViewingPower(poderResponseToPoder(detail));
          }
        }}
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
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setViewingPower(poderResponseToPoder(detail)); }} className="h-9 w-9 !p-0 text-gray-400 hover:text-indigo-500">
                  <Info className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingPower(poderResponseToPoder(detail)); }} className="h-9 w-9 !p-0 text-gray-400 hover:text-emerald-500" title="Editar">
                  <Edit2 className="w-4 h-4" />
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
                  className="h-9 w-9 !p-0 text-gray-400 hover:text-blue-500"
                  title="Salvar na Biblioteca"
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
                {isEquipped ? (
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onUnequipPower(power.powerId); }} className="h-9 w-9 !p-0 text-amber-500 hover:bg-amber-50 hover:text-amber-600" title="Desequipar">
                    <Package className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEquipPower(power.powerId); }} className="h-8 px-2 text-[10px] font-bold border text-gray-600 hover:text-purple-600 hover:border-purple-600" title="Equipar">
                    Equipar
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onRemovePower(power.powerId); }} className="h-9 w-9 !p-0 text-red-400 hover:bg-red-50 hover:text-red-600" title="Excluir">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
            {isNested && (
              <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto justify-end border-t sm:border-0 pt-2 sm:pt-0 border-gray-100 dark:border-gray-800 mt-1 sm:mt-0">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setViewingPower(poderResponseToPoder(detail)); }} className="h-8 w-8 !p-0 text-gray-400 hover:text-indigo-500">
                  <Info className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingPower(poderResponseToPoder(detail)); }} className="h-8 w-8 !p-0 text-gray-400 hover:text-emerald-500" title="Editar">
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
    const hasAlquebrado = (character?.conditions || []).some((c: string) => {
      const clean = c.includes('(') ? c.split('(')[0].trim() : c;
      return clean === 'Alquebrado';
    });
    const peCostMultiplier = hasAlquebrado ? 2 : 1;
    const peCostValue = (detail?.custoTotal?.pe || detail?.peCost || 0) * peCostMultiplier;
    
    return (
      <Card 
        key={array.id} 
        onClick={() => detail && setViewingArray(detail)}
        className={`border-2 transition-all cursor-pointer ${
          isEquipped 
            ? 'border-indigo-500/30 bg-indigo-50/10 dark:bg-indigo-900/5 shadow-md' 
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 opacity-90 grayscale hover:grayscale-0 hover:opacity-100'
        } relative overflow-hidden`}
      >
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
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); detail && setViewingArray(detail); }} className="h-9 w-9 !p-0 text-gray-400 hover:text-indigo-500">
                <Info className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); detail && setEditingArray(detail); }} className="h-9 w-9 !p-0 text-gray-400 hover:text-emerald-500" title="Editar">
                <Edit2 className="w-4 h-4" />
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
                className="h-9 w-9 !p-0 text-gray-400 hover:text-blue-500"
                title="Salvar na Biblioteca"
              >
                <Bookmark className="w-4 h-4" />
              </Button>
              {isEquipped ? (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onUnequipPowerArray(array.powerArrayId); }} className="h-9 w-9 !p-0 text-amber-500 hover:bg-amber-50 hover:text-amber-600" title="Desequipar">
                  <Package className="w-4 h-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEquipPowerArray(array.powerArrayId); }} className="h-8 px-2 text-[10px] font-bold border text-gray-600 hover:text-indigo-600 hover:border-indigo-600" title="Equipar">
                  Equipar
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onRemovePowerArray(array.powerArrayId); }} className="h-9 w-9 !p-0 text-red-400 hover:bg-red-50 hover:text-red-600" title="Excluir">
                <Trash2 className="w-4 h-4" />
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
              onClick={(e) => { e.stopPropagation(); toggleArrayExpansion(array.id); }}
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
              {(() => {
                const activeFortalecer = obterBonusFortalecerAtivos(activePowers);
                const bonusKeyMental = activeFortalecer.atributos[character.attributes.keyMental] || 0;
                const bonusKeyPhysical = activeFortalecer.atributos[character.attributes.keyPhysical] || 0;
                return (
                  <>
                    <div>
                      <p className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase">Mental CD</p>
                      <p className="text-lg font-black text-purple-900 dark:text-purple-100">
                        {10 + character.attributes[character.attributes.keyMental].rollModifier + bonusKeyMental}
                        {bonusKeyMental > 0 && (
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400 ml-1">
                            (+{bonusKeyMental})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase">Física CD</p>
                      <p className="text-lg font-black text-red-900 dark:text-red-100">
                        {10 + character.attributes[character.attributes.keyPhysical].rollModifier + bonusKeyPhysical}
                        {bonusKeyPhysical > 0 && (
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400 ml-1">
                            (+{bonusKeyPhysical})
                          </span>
                        )}
                      </p>
                    </div>
                  </>
                );
              })()}
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
                const isSealed = mastery.domainId === 'sagrado' && character.narrative?.deity?.isSealed;
                return (
                  <Badge 
                    key={mastery.domainId} 
                    variant={isSealed ? 'caos' : isPeculiarity ? 'espirito' : 'secondary'} 
                    className={`pl-1 pr-3 py-1 flex items-center gap-2 border-indigo-200 dark:border-indigo-800 cursor-pointer hover:opacity-80 transition-colors ${
                      isSealed
                        ? 'opacity-60 line-through'
                        : isPeculiarity ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
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
                      <span className="font-black uppercase text-[11px] leading-tight">{getDomainName(mastery)} {isSealed && "(SELADO)"}</span>
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
          {character.powers.some(p => p.isEquipped && !(detailedPowers[p.powerId]?.parametros?.duracao === 4)) && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1"><Zap className="w-3.5 h-3.5" /> Poderes Ativáveis</h3>
              <div className="flex flex-col gap-3">
                {character.powers.filter(p => p.isEquipped && !(detailedPowers[p.powerId]?.parametros?.duracao === 4)).map(p => renderPowerCard(p, true, false))}
              </div>
            </div>
          )}

          {/* Passivas */}
          {character.powers.some(p => p.isEquipped && (detailedPowers[p.powerId]?.parametros?.duracao === 4)) && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1"><Shield className="w-3.5 h-3.5 text-blue-500" /> Passivas Equipadas</h3>
              <div className="flex flex-col gap-3">
                {character.powers.filter(p => p.isEquipped && (detailedPowers[p.powerId]?.parametros?.duracao === 4)).map(p => renderPowerCard(p, true, true))}
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
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Nova Peculiaridade
                </label>
                <Button variant="ghost" size="sm" onClick={() => setIsCreatingPeculiarity(false)} className="flex items-center gap-1 text-gray-500 p-0 hover:text-gray-700 font-bold">
                  <ChevronLeft className="w-3.5 h-3.5" /> Voltar
                </Button>
              </div>
              <div className="space-y-4 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10">
                <Input label="Nome da Peculiaridade" value={newPeculiarity.nome} onChange={e => setNewPeculiarity({...newPeculiarity, nome: e.target.value})} />
                <div>
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 block">Descrição</label>
                  <textarea className="w-full px-3 py-2 border rounded-xl dark:bg-gray-800 text-sm h-24 outline-none focus:ring-2 focus:ring-purple-500 border-gray-200 dark:border-gray-700" placeholder="Descreva os efeitos e temática do domínio..." value={newPeculiarity.descricao} onChange={e => setNewPeculiarity({...newPeculiarity, descricao: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Energia" value={newPeculiarity.espiritual ? 'true' : 'false'} onChange={e => setNewPeculiarity({...newPeculiarity, espiritual: e.target.value === 'true'})} options={[{value: 'true', label: 'Espiritual'}, {value: 'false', label: 'Técnica'}]} />
                  <Input label="Ícone (URL)" value={newPeculiarity.icone} onChange={e => setNewPeculiarity({...newPeculiarity, icone: e.target.value})} />
                </div>
              </div>
            </div>
          ) : (
            <>
              {selectedDomain && (
                <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-500/20 shadow-md">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 shrink-0 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center border shadow-md overflow-hidden p-1">
                        {getDomainIcon(selectedDomain, "w-full h-full object-cover")}
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                          Domínio Selecionado
                        </span>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase leading-none mt-1">
                          {getDomainName({ domainId: selectedDomain })}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed max-w-md">
                          {DOMINIOS.find(d => d.id === selectedDomain)?.descricao || 
                           myPeculiarities.find(p => p.id === selectedDomain)?.descricao ||
                           'Domínio customizado e exclusivo do personagem.'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRemoveMastery} 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl h-10 w-10 !p-0"
                      title="Remover Mestria"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${
                      !showPeculiarityLibrary
                        ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10 ring-2 ring-indigo-500/20'
                        : 'border-gray-200 dark:border-gray-800 bg-transparent hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                    onClick={() => {
                      setShowPeculiarityLibrary(false);
                      if (!selectedDomain || myPeculiarities.some(p => p.id === selectedDomain)) {
                        setSelectedDomain(filteredSystemDomains[0]?.id || '');
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${
                        !showPeculiarityLibrary 
                          ? 'bg-indigo-500 text-white border-indigo-400' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-550 border-gray-200 dark:border-gray-700'
                      }`}>
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs uppercase tracking-wide text-gray-900 dark:text-white">
                          Sistema
                        </h4>
                        <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 font-bold">
                          Caminhos tradicionais
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${
                      showPeculiarityLibrary
                        ? 'border-purple-500 bg-purple-50/10 dark:bg-purple-950/10 ring-2 ring-purple-500/20'
                        : 'border-gray-200 dark:border-gray-800 bg-transparent hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                    onClick={() => {
                      setShowPeculiarityLibrary(true);
                      setSelectedDomain('');
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${
                        showPeculiarityLibrary 
                          ? 'bg-purple-500 text-white border-purple-400' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-550 border-gray-200 dark:border-gray-700'
                      }`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs uppercase tracking-wide text-gray-900 dark:text-white">
                          Peculiar
                        </h4>
                        <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 font-bold">
                          Customizados do herói
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {!showPeculiarityLibrary ? (
                  <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Selecione o Domínio
                    </label>
                    <div className="p-2.5 rounded-2xl border border-gray-150 dark:border-gray-800/80 bg-gray-50/30 dark:bg-black/10">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                        {filteredSystemDomains.map(d => {
                          const isSelected = selectedDomain === d.id;
                          const isEspiritual = d.categoria === 'espiritual';
                          const isArma = d.categoria === 'arma';
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => setSelectedDomain(d.id)}
                              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-20 transition-all relative overflow-hidden group ${
                                isSelected
                                  ? isEspiritual
                                    ? 'border-purple-500 bg-purple-50/20 dark:bg-purple-950/20 ring-2 ring-purple-500/20'
                                    : isArma
                                      ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20 ring-2 ring-red-500/20'
                                      : 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20'
                                  : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className={`p-1 rounded-lg border ${
                                  isSelected
                                    ? isEspiritual
                                      ? 'bg-purple-500 text-white border-purple-400'
                                      : isArma
                                        ? 'bg-red-500 text-white border-red-400'
                                        : 'bg-indigo-500 text-white border-indigo-400'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-550 border-gray-200 dark:border-gray-700'
                                }`}>
                                  {getDomainIcon(d.id, "w-3 h-3")}
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-wider opacity-60">
                                  {d.categoria}
                                </span>
                              </div>
                              <span className="font-black text-[10px] uppercase tracking-wide truncate text-gray-900 dark:text-white mt-2">
                                {d.nome}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in slide-in-from-right-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        Escolha a Peculiaridade
                      </label>
                      <Button variant="ghost" size="sm" onClick={() => setShowPeculiarityLibrary(false)} className="flex items-center gap-1 text-gray-500 p-0 hover:text-gray-700 font-bold">
                        <ChevronLeft className="w-3.5 h-3.5" /> Voltar
                      </Button>
                    </div>
                    
                    <div className="p-2.5 rounded-2xl border border-gray-150 dark:border-gray-800/80 bg-gray-50/30 dark:bg-black/10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                        {myPeculiarities.map(p => {
                          const isSelected = selectedDomain === p.id;
                          return (
                            <button 
                              key={p.id} 
                              type="button"
                              onClick={() => setSelectedDomain(p.id)} 
                              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                isSelected 
                                  ? 'border-purple-500 bg-purple-50/20 dark:bg-purple-900/20 ring-2 ring-purple-500/20' 
                                  : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                              }`}
                            >
                              <div className="w-10 h-10 shrink-0 rounded-xl bg-white dark:bg-gray-800 border flex items-center justify-center overflow-hidden p-1 shadow-sm">
                                {p.icone ? <DynamicIcon name={p.icone} className="w-full h-full object-cover" /> : <Shield className="w-5 h-5 text-purple-400" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-black uppercase text-gray-900 dark:text-white leading-tight block truncate">
                                  {p.nome}
                                </span>
                                <span className="text-[8px] text-gray-500 dark:text-gray-400 truncate block mt-0.5 uppercase tracking-wide">
                                  {p.espiritual ? 'Espiritual' : 'Técnico'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                        
                        <button
                          type="button"
                          onClick={() => setIsCreatingPeculiarity(true)}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-purple-300 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/10 transition-colors h-14"
                        >
                          <Plus className="w-4 h-4" /> 
                          <span className="text-xs uppercase font-black tracking-wide">Criar Peculiaridade</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Nível de Mestria
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { value: 'INICIANTE', label: 'Iniciante', icon: Shield },
                      { value: 'PRATICANTE', label: 'Praticante', icon: Sword },
                      { value: 'MESTRE', label: 'Mestre', icon: Sparkles }
                    ].map(opt => {
                      const isSelected = selectedMastery === opt.value;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSelectedMastery(opt.value as any)}
                          className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20 font-black'
                              : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/40 font-bold'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                          <span className="text-[10px] uppercase tracking-wide">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
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
          detalhes={(() => {
            const baseDetails = calcularDetalhesPoder(viewingPower as PoderCalculo, catalogEfeitos, catalogModificacoes);
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
