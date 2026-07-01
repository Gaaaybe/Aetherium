import { useState, useEffect, useMemo } from 'react';
import { CharacterResponse, EquipSlot } from '@/services/characters.types';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, ModalFooter, DynamicIcon, Input } from '@/shared/ui';
import { Plus, Search, Coins, Shield, Sword, Package, Backpack, Trash2, Info, Hammer, Gem, Sparkles, Box, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, Zap, Layers, Dices } from 'lucide-react';
import { DiceRoller } from '@/shared/components/DiceRoller';
import { toast } from '@/shared/ui';
import { getItemById, copyPublicItem } from '@/services/items.service';
import type { ItemResponse, ItemType, WeaponItemResponse, DefensiveItemResponse, ConsumableItemResponse, AcervoResponse } from '@/services/types';
import { BibliotecaAdicionarItemModal } from './BibliotecaAdicionarItemModal';
import { UpgradeItemModal } from './UpgradeItemModal';
import { CriadorDeItemModal } from '@/features/criador-de-item/components/CriadorDeItemModal';
import { ResumoItem } from '@/features/criador-de-item/components/ResumoItem';
import { ResumoPoder } from '@/features/criador-de-poder/components/ResumoPoder';
import { ResumoAcervo } from '@/features/criador-de-poder/components/ResumoAcervo';
import { calcularDetalhesPoder } from '@/features/criador-de-poder/regras/calculadoraCusto';
import { poderResponseToPoder, acervoResponseToAcervo } from '@/features/criador-de-poder/utils/poderApiConverter';
import { useCatalog } from '@/context/useCatalog';

const TYPE_LABELS: Record<ItemType, string> = {
  weapon: 'Arma',
  'defensive-equipment': 'Defesa',
  consumable: 'Consumível',
  artifact: 'Artefato',
  accessory: 'Acessório',
  general: 'Geral',
  'upgrade-material': 'Material',
};

const TYPE_COLORS: Record<ItemType, string> = {
  weapon: 'border-red-200 dark:border-red-900/50',
  'defensive-equipment': 'border-emerald-200 dark:border-emerald-900/50',
  consumable: 'border-amber-200 dark:border-amber-900/50',
  artifact: 'border-purple-200 dark:border-purple-900/50',
  accessory: 'border-cyan-200 dark:border-cyan-900/50',
  general: 'border-gray-200 dark:border-gray-700',
  'upgrade-material': 'border-orange-200 dark:border-orange-900/50',
};

const TYPE_ICON_COLORS: Record<ItemType, string> = {
  weapon: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-500',
  'defensive-equipment': 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-500',
  consumable: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800 text-amber-500',
  artifact: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800 text-purple-500',
  accessory: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-800 text-cyan-500',
  general: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400',
  'upgrade-material': 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800 text-orange-500',
};

const BADGE_COLORS: Record<ItemType, string> = {
  weapon: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'defensive-equipment': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  consumable: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  artifact: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  accessory: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  general: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  'upgrade-material': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

function ItemTypeIcon({ tipo, className }: { tipo: ItemType; className?: string }) {
  const cls = className ?? 'w-6 h-6';
  switch (tipo) {
    case 'weapon': return <Sword className={cls} />;
    case 'defensive-equipment': return <Shield className={cls} />;
    case 'consumable': return <Backpack className={cls} />;
    case 'artifact': return <Gem className={cls} />;
    case 'accessory': return <Sparkles className={cls} />;
    case 'upgrade-material': return <Hammer className={cls} />;
    default: return <Box className={cls} />;
  }
}

function ItemSubtitle({ item }: { item: ItemResponse }) {
  if (item.tipo === 'weapon') {
    const w = item as WeaponItemResponse;
    return (
      <span>
        {w.danos.map(d => `${d.dado} ${d.base}`).join(' + ')} · Crit {w.critMargin}/{w.critMultiplier}x · {w.alcance}
      </span>
    );
  }
  if (item.tipo === 'defensive-equipment') {
    const d = item as DefensiveItemResponse;
    return <span>RD {d.rdAtual} ({d.tipoEquipamento})</span>;
  }
  if (item.tipo === 'consumable') {
    const c = item as ConsumableItemResponse;
    return <span>{c.qtdDoses} dose{c.qtdDoses !== 1 ? 's' : ''}{c.isRefeicao ? ' · Refeição' : ''}</span>;
  }
  return null;
}

interface RunicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  runics: number;
  onAdd: (amount: number) => Promise<void>;
  onSpend: (amount: number) => Promise<void>;
  isProcessing: boolean;
}

function RunicsModal({ isOpen, onClose, runics, onAdd, onSpend, isProcessing }: RunicsModalProps) {
  const [mode, setMode] = useState<'add' | 'spend'>('add');
  const [amount, setAmount] = useState('');

  const handleConfirm = async () => {
    const val = parseInt(amount, 10);
    if (!val || val <= 0) { toast.error('Valor inválido'); return; }
    if (mode === 'add') {
      await onAdd(val);
    } else {
      await onSpend(val);
    }
    setAmount('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Rúnicos" size="sm">
      <div className="space-y-6 py-2">
        <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
          <span className="text-4xl font-black text-amber-600">ᚱ</span>
          <div>
            <p className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest">Saldo atual</p>
            <p className="text-3xl font-black text-amber-900 dark:text-amber-100">{runics}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('add')}
            className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${mode === 'add'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
          >
            <Plus className="w-4 h-4" /> Receber
          </button>
          <button
            onClick={() => setMode('spend')}
            className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${mode === 'spend'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
          >
            <Coins className="w-4 h-4" /> Gastar
          </button>
        </div>

        <Input
          label="Quantidade"
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ex: 50"
        />
      </div>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleConfirm}
          loading={isProcessing}
          className={mode === 'add' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
        >
          {mode === 'add' ? 'Receber' : 'Gastar'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

interface EquipModalProps {
  isOpen: boolean;
  item: ItemResponse | null;
  numberOfHands: number;
  maxQuickAccess: number;
  currentHandsCount: number;
  currentQuickAccessCount: number;
  onClose: () => void;
  onEquip: (slot: EquipSlot, quantity: number) => Promise<void>;
  isProcessing: boolean;
}

function EquipModal({ isOpen, item, numberOfHands, maxQuickAccess, currentHandsCount, currentQuickAccessCount, onClose, onEquip, isProcessing }: EquipModalProps) {
  const [slot, setSlot] = useState<EquipSlot>('hand');
  const [quantity, setQuantity] = useState(1);

  if (!item) return null;

  const slots = [
    { value: 'suit' as EquipSlot, label: 'Traje', available: item.tipo === 'defensive-equipment' },
    { value: 'accessory' as EquipSlot, label: 'Acessório', available: item.tipo === 'accessory' },
    { value: 'hand' as EquipSlot, label: 'Mãos', available: currentHandsCount < numberOfHands },
    { value: 'quick-access' as EquipSlot, label: 'Acesso Rápido', available: currentQuickAccessCount < maxQuickAccess },
  ].filter((s) => s.available);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Equipar: ${item.nome}`} size="sm">
      <div className="space-y-4 py-2">
        {slots.length === 0 ? (
          <div className="py-6 text-center text-gray-500">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p>Nenhum slot disponível para este item.</p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Slot</p>
              <div className="grid grid-cols-2 gap-2">
                {slots.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSlot(s.value)}
                    className={`py-2.5 rounded-lg font-bold text-sm transition-all ${slot === s.value
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {item.canStack && (
              <div className="flex items-center gap-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex-1">Quantidade</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-black">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(item.maxStack, q + 1))} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        {slots.length > 0 && (
          <Button onClick={() => onEquip(slot, quantity)} loading={isProcessing} className="bg-amber-600 hover:bg-amber-700 text-white">
            Equipar
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

interface InventarioTabProps {
  character: CharacterResponse;
  onEquipItem: (itemId: string, slot: EquipSlot, quantity?: number) => Promise<void>;
  onUnequipItem: (itemId: string, slot: EquipSlot, quantity?: number) => Promise<void>;
  onAddItem: (itemId: string, quantity?: number) => Promise<void>;
  onRemoveItem: (itemId: string, quantity?: number) => void;
  onChangeItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  onAddRunics: (amount: number) => Promise<void>;
  onSpendRunics: (amount: number) => Promise<void>;
  onUpgradeItem: (itemId: string, materialId: string, runicsCost: number) => Promise<void>;
  isSyncing: boolean;
}

export function InventarioTab({
  character,
  onEquipItem,
  onUnequipItem,
  onAddItem,
  onRemoveItem,
  onChangeItemQuantity,
  onAddRunics,
  onSpendRunics,
  onUpgradeItem,
  isSyncing,
}: InventarioTabProps) {
  const [detailedItems, setDetailedItems] = useState<Record<string, ItemResponse>>({});
  const [detailedPowers, setDetailedPowers] = useState<Record<string, any>>({});
  const [detailedArrays, setDetailedArrays] = useState<Record<string, any>>({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savingToLibraryId, setSavingToLibraryId] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRunicsModalOpen, setIsRunicsModalOpen] = useState(false);
  const [equipModalItem, setEquipModalItem] = useState<ItemResponse | null>(null);
  const [viewingItem, setViewingItem] = useState<ItemResponse | null>(null);
  const [editingItem, setEditingItem] = useState<ItemResponse | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [viewingPower, setViewingPower] = useState<any | null>(null);
  const [viewingArray, setViewingArray] = useState<any | null>(null);
  const [upgradeModalItem, setUpgradeModalItem] = useState<ItemResponse | null>(null);
  const [rollingAction, setRollingAction] = useState<{
    name: string;
    damage?: string;
    modifier: number;
    damageModifier?: number;
    critMargin?: number;
    critMultiplier?: number;
    efficiencyBonus?: number;
  } | null>(null);

  const { efeitos: catalogEfeitos, modificacoes: catalogModificacoes } = useCatalog();

  const [isProcessing, setIsProcessing] = useState(false);

  const storageKeyFreeAcquisition = `acquisicao-gratuita-${character.id}`;
  const [freeAcquisition, setFreeAcquisition] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(storageKeyFreeAcquisition);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem(storageKeyFreeAcquisition, JSON.stringify(freeAcquisition));
  }, [freeAcquisition, storageKeyFreeAcquisition]);

  const [busca, setBusca] = useState('');

  const allItemIds = useMemo(() => {
    const ids = new Set<string>();
    character.inventory.bag.forEach((i) => ids.add(i.itemId));
    if (character.equipment.suitId) ids.add(character.equipment.suitId);
    if (character.equipment.accessoryId) ids.add(character.equipment.accessoryId);
    character.equipment.hands.forEach((i) => ids.add(i.itemId));
    character.equipment.quickAccess.forEach((i) => ids.add(i.itemId));
    return [...ids];
  }, [character, refreshKey]);

  useEffect(() => {
    if (allItemIds.length === 0) { setIsLoadingDetails(false); return; }
    setIsLoadingDetails(true);

    const loadData = async () => {
      try {
        const results = await Promise.all(allItemIds.map((id) => getItemById(id).catch(() => null)));

        const map: Record<string, ItemResponse> = {};
        const allPowerIds = new Set<string>();
        const allArrayIds = new Set<string>();

        results.forEach((item) => {
          if (item) {
            map[item.id] = item;
            if (item.powerIds) item.powerIds.forEach(p => allPowerIds.add(p));
            if (item.powerArrayIds) item.powerArrayIds.forEach(a => allArrayIds.add(a));
          }
        });
        setDetailedItems(map);

        const { getPowerById } = await import('@/services/powers.service');
        const { getPowerArrayById } = await import('@/services/powerArrays.service');

        const [powersRes, arraysRes] = await Promise.all([
          Promise.all(Array.from(allPowerIds).map(id => getPowerById(id).catch(() => null))),
          Promise.all(Array.from(allArrayIds).map(id => getPowerArrayById(id).catch(() => null))),
        ]);

        const pMap: Record<string, any> = {};
        powersRes.forEach(p => { if (p) pMap[p.id] = p; });
        setDetailedPowers(pMap);

        const aMap: Record<string, any> = {};
        arraysRes.forEach(a => { if (a) aMap[a.id] = a; });
        setDetailedArrays(aMap);

      } catch (err) {
        console.error('Erro ao carregar detalhes do inventário:', err);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadData();
  }, [allItemIds.join(','), refreshKey]);

  const bagFiltered = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return character.inventory.bag.filter((i) => {
      if (!termo) return true;
      const detail = detailedItems[i.itemId];
      return detail?.nome.toLowerCase().includes(termo) || i.itemId.toLowerCase().includes(termo);
    });
  }, [character.inventory.bag, busca, detailedItems]);

  const handleAddItem = async (itemId: string) => {
    setIsProcessing(true);
    try {
      await onAddItem(itemId);
      setIsAddModalOpen(false);
      setRefreshKey(k => k + 1);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEquip = async (slot: EquipSlot, quantity: number) => {
    if (!equipModalItem) return;
    setIsProcessing(true);
    try {
      await onEquipItem(equipModalItem.id, slot, quantity);
      setEquipModalItem(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnequip = async (itemId: string, slot: EquipSlot, quantity: number = 1) => {
    await onUnequipItem(itemId, slot, quantity);
  };

  const renderEquipmentSlot = (label: string, icon: React.ReactNode, itemId: string | null | undefined, slot: EquipSlot, colorClass: string) => {
    const detail = itemId ? detailedItems[itemId] : null;
    return (
      <Card className={`border relative transition-all overflow-hidden hover:shadow-sm group ${detail ? colorClass : 'border-gray-100 dark:border-gray-800 border-dashed bg-gray-50/50 dark:bg-gray-800/10'}`}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between w-full">
            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border overflow-hidden ${detail && detail.tipo ? TYPE_ICON_COLORS[detail.tipo] : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400'}`}>
              {detail?.icone ? <DynamicIcon name={detail.icone} className="w-full h-full object-cover" /> : (detail ? <ItemTypeIcon tipo={detail.tipo} className="w-5 h-5" /> : icon)}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {detail && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setViewingItem(detail); }}
                  title="Ver detalhes"
                  className="h-8 w-8 !p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 shrink-0"
                >
                  <Info className="w-4 h-4" />
                </Button>
              )}
              {(detail || itemId) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleUnequip(itemId!, slot); }}
                  title="Desequipar"
                  className="h-8 w-8 !p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                >
                  <Package className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="w-full min-w-0">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider truncate" title={label}>{label}</p>
            <p className="text-sm font-black text-gray-900 dark:text-gray-100 truncate mt-0.5" title={detail?.nome ?? 'Vazio'}>{detail?.nome ?? 'Vazio'}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-4">
        <Card
          className="border-none shadow-sm bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 cursor-pointer hover:shadow-md transition-all flex items-center justify-between p-4 rounded-2xl"
          onClick={() => setIsRunicsModalOpen(true)}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-md shadow-amber-500/30">
              <span className="text-2xl font-black text-white">ᚱ</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-700/60 dark:text-amber-400/60 uppercase tracking-widest">Rúnicos Totais</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-100 leading-none">
                {Intl.NumberFormat('pt-BR').format(character.inventory.runics)}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <Button variant="ghost" size="sm" className="text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50">
              Gerenciar
            </Button>
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-gray-900 rounded-2xl">
          <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-xs font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-emerald-500" /> Equipamentos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {renderEquipmentSlot('Traje', <Shield className="w-5 h-5" />, character.equipment.suitId, 'suit', 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-900/10')}
              {renderEquipmentSlot('Acessório', <Sparkles className="w-5 h-5" />, character.equipment.accessoryId, 'accessory', 'border-cyan-200 dark:border-cyan-900/50 bg-cyan-50/30 dark:bg-cyan-900/10')}

              {character.equipment.hands.map((h, i) => (
                <div key={h.itemId + i}>
                  {renderEquipmentSlot(`Mão ${i + 1}${h.quantity > 1 ? ` (x${h.quantity})` : ''}`, <Sword className="w-5 h-5" />, h.itemId, 'hand', 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10')}
                </div>
              ))}
              {character.equipment.hands.length === 0 && renderEquipmentSlot('Mãos', <Sword className="w-5 h-5" />, null, 'hand', 'border-gray-100 dark:border-gray-800')}

              {character.equipment.quickAccess.map((q, i) => (
                <div key={q.itemId + i}>
                  {renderEquipmentSlot(`Acesso ${i + 1}${q.quantity > 1 ? ` (x${q.quantity})` : ''}`, <Zap className="w-5 h-5" />, q.itemId, 'quick-access', 'border-violet-200 dark:border-violet-900/50 bg-violet-50/30 dark:bg-violet-900/10')}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no inventário..."
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>
          <Badge className="h-8 px-3 font-bold shrink-0">
            {character.inventory.bag.length} {character.inventory.bag.length === 1 ? 'Item' : 'Itens'}
          </Badge>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-lg shadow-amber-600/20 ml-4"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </div>

      {isLoadingDetails ? (
        <div className="py-12 text-center text-gray-400">Carregando inventário...</div>
      ) : bagFiltered.length === 0 ? (
        <div className="py-16 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Backpack className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-bold">Inventário vazio.</p>
          <p className="text-gray-400 text-sm mt-1">Adicione itens da sua biblioteca.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bagFiltered.map((bagItem) => {
            const detail = detailedItems[bagItem.itemId];
            const isExpanded = expandedItemId === bagItem.itemId;
            return (
              <Card
                key={bagItem.itemId}
                className={`border transition-all hover:shadow-sm overflow-hidden ${detail ? TYPE_COLORS[detail.tipo] : 'border-gray-200 dark:border-gray-700'}`}
              >
                <div
                  className="p-1 px-3 flex items-center justify-between cursor-pointer group hover:bg-gray-50/50 dark:hover:bg-gray-800/20"
                  onClick={() => setExpandedItemId(isExpanded ? null : bagItem.itemId)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center border ${detail ? TYPE_ICON_COLORS[detail.tipo] : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'}`}>
                      {detail?.icone ? (
                        <DynamicIcon name={detail.icone} className="w-full h-full object-cover rounded-lg" />
                      ) : detail ? (
                        <ItemTypeIcon tipo={detail.tipo} />
                      ) : (
                        <Package className="w-6 h-6" />
                      )}
                    </div>

                    <div className="flex items-center flex-1 gap-2 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm leading-tight group-hover:text-amber-700 dark:group-hover:text-amber-500 transition-colors shrink">
                        {detail?.nome ?? bagItem.itemId}
                      </h4>
                      {detail?.durabilidade === 'DANIFICADO' && (
                        <Badge className="text-[9px] px-1 py-0 h-4 border-none bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 shrink-0">
                          Dan.
                        </Badge>
                      )}

                      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                        {bagItem.quantity > 1 && (
                          <span className="font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded text-[10px]">
                            x{bagItem.quantity}
                          </span>
                        )}
                        {detail && (
                          <Badge className={`text-[9px] px-1.5 py-0 h-4 border-none uppercase tracking-wider ${BADGE_COLORS[detail.tipo]}`}>
                            {TYPE_LABELS[detail.tipo]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pl-3 text-gray-400 dark:text-gray-500 group-hover:text-amber-600 transition-colors">
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180 text-amber-600' : ''}`} />
                  </div>
                </div>

                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    {detail ? (
                      <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                          <ItemSubtitle item={detail} />
                          <span className="text-gray-300">·</span>
                          <span>{detail.valorBase} ᚱ</span>
                        </div>

                        {detail.descricao && (
                          <div className="py-2 text-xs text-gray-700 dark:text-gray-400 whitespace-pre-wrap leading-relaxed italic border-l-2 border-amber-500/30 pl-3 bg-amber-50/20 dark:bg-amber-900/10 rounded-r-lg">
                            {detail.descricao}
                          </div>
                        )}

                        <div className="flex items-center py-2">
                          <label className="flex items-center gap-2 cursor-pointer bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700/50 w-fit">
                            <input
                              type="checkbox"
                              className="w-3.5 h-3.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 bg-white dark:bg-gray-800 dark:border-gray-600"
                              checked={!!freeAcquisition[bagItem.itemId]}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFreeAcquisition(prev => ({ ...prev, [bagItem.itemId]: checked }));
                              }}
                            />
                            <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium select-none">Poderes Adquirido Gratuitamente (sem PdA)</span>
                          </label>
                        </div>

                        {(detail.powerIds?.length > 0 || detail.powerArrayIds?.length > 0) && (
                          <div className="py-3 px-3 border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl space-y-2">
                            <p className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3" /> Poderes & Recursos Vinculados
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {detail.powerIds?.map((pid: string) => {
                                const p = detailedPowers[pid];
                                if (!p) return null;
                                return (
                                  <button
                                    key={pid}
                                    onClick={(e) => { e.stopPropagation(); setViewingPower(p); }}
                                    className="flex items-center gap-2 p-1.5 pr-3 rounded-lg bg-white dark:bg-black/20 border border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-400 transition-all group max-w-full"
                                  >
                                    <div className="w-7 h-7 rounded bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center border border-indigo-100 dark:border-indigo-800 shrink-0 overflow-hidden">
                                      {p.icone ? (
                                        <DynamicIcon name={p.icone} className="w-full h-full object-cover" />
                                      ) : (
                                        <Zap className="w-3.5 h-3.5 text-indigo-500" />
                                      )}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate group-hover:text-indigo-600 transition-colors">{p.nome}</span>
                                  </button>
                                );
                              })}
                              {detail.powerArrayIds?.map((aid: string) => {
                                const a = detailedArrays[aid];
                                if (!a) return null;
                                return (
                                  <button
                                    key={aid}
                                    onClick={(e) => { e.stopPropagation(); setViewingArray(a); }}
                                    className="flex items-center gap-2 p-1.5 pr-3 rounded-lg bg-white dark:bg-black/20 border border-purple-100 dark:border-purple-900/50 hover:border-purple-400 transition-all group max-w-full"
                                  >
                                    <div className="w-7 h-7 rounded bg-purple-50 dark:bg-purple-900/40 flex items-center justify-center border border-purple-100 dark:border-purple-800 shrink-0 overflow-hidden">
                                      {a.icone ? (
                                        <DynamicIcon name={a.icone} className="w-full h-full object-cover" />
                                      ) : (
                                        <Layers className="w-3.5 h-3.5 text-purple-500" />
                                      )}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate group-hover:text-purple-600 transition-colors">{a.nome}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800/50">
                          {detail.canStack ? (
                            <div className="flex items-center border border-amber-200 dark:border-amber-900/50 rounded-lg overflow-hidden bg-amber-50 dark:bg-amber-900/20">
                              <button onClick={(e) => { e.stopPropagation(); onChangeItemQuantity(bagItem.itemId, Math.max(0, bagItem.quantity - 1)); }} className="w-8 h-8 flex items-center justify-center text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/50">
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-amber-900 dark:text-amber-100">{bagItem.quantity}</span>
                              <button onClick={(e) => { e.stopPropagation(); onChangeItemQuantity(bagItem.itemId, bagItem.quantity + 1); }} className="w-8 h-8 flex items-center justify-center text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/50">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div />
                          )}

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setViewingItem(detail); }} className="h-7 px-2 text-[10px] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title="Ver Informações Completas">
                              Resumo
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingItem(detail); }} className="h-7 px-2 text-[10px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={savingToLibraryId !== null}
                              onClick={async (e) => {
                                e.stopPropagation();
                                setSavingToLibraryId(detail.id);
                                try {
                                  await copyPublicItem(detail.id);
                                  toast.success(`Item "${detail.nome}" salvo na biblioteca!`);
                                } catch (err) {
                                  toast.error('Erro ao salvar item na biblioteca.');
                                } finally {
                                  setSavingToLibraryId(null);
                                }
                              }}
                              className="h-7 px-2 text-[10px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="Salvar na Biblioteca"
                            >
                              Salvar na Lib
                            </Button>
                            {(detail.tipo === 'weapon' || detail.tipo === 'defensive-equipment') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setUpgradeModalItem(detail); }}
                                className="h-7 px-2 text-[10px] text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                              >
                                Aprimorar
                              </Button>
                            )}
                            {detail.tipo === 'weapon' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const w = detail as WeaponItemResponse;
                                  // Prioridade: Atributo do Item > Base do Primeiro Dano > Chave Física
                                  const escalonamentoBase = w.atributoEscalonamento || w.danos?.[0]?.base || 'FISICA';
                                  const escalonamento = escalonamentoBase.toUpperCase();

                                  const map: Record<string, keyof CharacterResponse['attributes']> = {
                                    'FOR': 'strength', 'FORÇA': 'strength', 'STRENGTH': 'strength',
                                    'DES': 'dexterity', 'DESTREZA': 'dexterity', 'DEXTERITY': 'dexterity',
                                    'CON': 'constitution', 'CONSTITUIÇÃO': 'constitution', 'CONSTITUTION': 'constitution',
                                    'INT': 'intelligence', 'INTELIGÊNCIA': 'intelligence', 'INTELLIGENCE': 'intelligence',
                                    'SAB': 'wisdom', 'SABEDORIA': 'wisdom', 'WISDOM': 'wisdom',
                                    'CAR': 'charisma', 'CARISMA': 'charisma', 'CHARISMA': 'charisma',
                                    'FISICA': character.attributes.keyPhysical,
                                    'FISICO': character.attributes.keyPhysical,
                                    'PHYSICAL': character.attributes.keyPhysical,
                                    'MENTAL': character.attributes.keyMental
                                  };

                                  const attrKey = map[escalonamento] || character.attributes.keyPhysical || 'strength';
                                  const attr = character.attributes[attrKey] as any;
                                  const mod = attr?.rollModifier || 0;

                                  setRollingAction({
                                    name: w.nome,
                                    damage: w.danos?.map(d => d.dado).join(' + '),
                                    modifier: mod,
                                    damageModifier: mod,
                                    critMargin: w.critMargin,
                                    critMultiplier: w.critMultiplier,
                                    efficiencyBonus: character.efficiencyBonus
                                  });
                                }}
                                className="h-7 px-3 text-[10px] font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 gap-1.5"
                              >
                                <Dices className="w-3 h-3" /> Atacar
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEquipModalItem(detail); }} className="h-7 px-3 text-[10px] font-bold border border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-900/30">
                              Equipar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onRemoveItem(bagItem.itemId, bagItem.quantity); }} className="h-7 w-7 !p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Excluir Item do Inventário">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 border-t border-gray-100 dark:border-gray-800 text-center">
                        <p className="text-xs text-red-500 mb-2">Este item foi deletado da sua base nativa! (Fantasma)</p>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onRemoveItem(bagItem.itemId, bagItem.quantity); }} className="h-7 px-3 text-[10px] bg-red-50 text-red-600 hover:bg-red-100">Limpar Erro</Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <BibliotecaAdicionarItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddItem={handleAddItem}
        isProcessing={isProcessing}
      />

      <RunicsModal
        isOpen={isRunicsModalOpen}
        onClose={() => setIsRunicsModalOpen(false)}
        runics={character.inventory.runics}
        onAdd={onAddRunics}
        onSpend={onSpendRunics}
        isProcessing={isSyncing}
      />

      <EquipModal
        isOpen={!!equipModalItem}
        item={equipModalItem}
        numberOfHands={character.equipment.numberOfHands}
        maxQuickAccess={character.equipment.maxQuickAccessSlots}
        currentHandsCount={character.equipment.hands.length}
        currentQuickAccessCount={character.equipment.quickAccess.length}
        onClose={() => setEquipModalItem(null)}
        onEquip={handleEquip}
        isProcessing={isProcessing}
      />

      <UpgradeItemModal
        isOpen={!!upgradeModalItem}
        onClose={() => setUpgradeModalItem(null)}
        item={upgradeModalItem}
        inventory={character.inventory.bag}
        detailedItems={detailedItems}
        currentRunics={character.inventory.runics}
        onUpgrade={(materialId, runicsCost) => onUpgradeItem(upgradeModalItem!.id, materialId, runicsCost)}
        isProcessing={isSyncing}
      />

      {viewingItem && (
        <ResumoItem
          isOpen={!!viewingItem}
          onClose={() => setViewingItem(null)}
          tipo={viewingItem.tipo}
          nome={viewingItem.nome}
          icone={viewingItem.icone ?? undefined}
          descricao={viewingItem.descricao}
          dominio={{ name: viewingItem.dominio.name, peculiarId: viewingItem.dominio.peculiarId ?? undefined }}
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

      {rollingAction && (
        <DiceRoller
          isOpen={!!rollingAction}
          onClose={() => setRollingAction(null)}
          label={rollingAction.name}
          modifier={rollingAction.modifier}
          damageFormula={rollingAction.damage}
          damageModifier={rollingAction.damageModifier}
          critMargin={rollingAction.critMargin}
          critMultiplier={rollingAction.critMultiplier}
          efficiencyBonus={rollingAction.efficiencyBonus}
          initialApplyEfficiency={true}
          modifierLabel="Bônus de Ataque"
          rollButtonLabel="Atacar"
        />
      )}

      {editingItem && (
        <CriadorDeItemModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          itemParaEditar={editingItem}
          poderesAdicionais={Object.values(detailedPowers)}
          acervosAdicionais={Object.values(detailedArrays)}
          onSave={() => {
            setEditingItem(null);
            setRefreshKey(k => k + 1);
          }}
        />
      )}

      {viewingPower && (() => {
        const pCon = (viewingPower as any).efeitos ? viewingPower : poderResponseToPoder(viewingPower);
        return (
          <ResumoPoder
            isOpen={!!viewingPower}
            onClose={() => setViewingPower(null)}
            poder={pCon}
            detalhes={calcularDetalhesPoder(pCon, catalogEfeitos, catalogModificacoes)}
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
