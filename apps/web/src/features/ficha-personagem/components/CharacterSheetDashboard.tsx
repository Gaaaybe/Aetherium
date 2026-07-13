import { useState, useEffect } from 'react';
import { useCharacterSheet } from '../hooks/useCharacterSheet';
import { CharacterHeader } from './dashboard/CharacterHeader';
import { SidebarColumn } from './dashboard/SidebarColumn';
import { StatsColumn } from './dashboard/StatsColumn';
import { MainArea } from './dashboard/MainArea';
import { MobileBottomNav } from './dashboard/Mobile/MobileBottomNav';
import { ConfirmDialog, Modal, ModalFooter, Input, Badge, toast, Button } from '@/shared/ui';
import { DescansoModal } from './dashboard/DescansoModal';
import { usePowerUsage } from '../hooks/usePowerUsage';
import { charactersService } from '@/services/characters.service';
import { obterBonusVidaEnergiaFortalecer } from '../utils/fortalecerHelper';
import { getPowerById } from '@/services/powers.service';
import { getPowerArrayById } from '@/services/powerArrays.service';
import { useAuth } from '@/context/useAuth';
import { Shield, HeartPulse, Plus, ArrowLeftRight } from 'lucide-react';

interface CharacterSheetDashboardProps {
  characterId: string;
}

export function CharacterSheetDashboard({ characterId }: CharacterSheetDashboardProps) {
  const {
    character,
    isLoading,
    isSyncing,
    sync,
    rest,
    levelUp,
    acquireDomainMastery,
    discardDomainMastery,
    acquirePower,
    acquirePowerArray,
    equipPower,
    unequipPower,
    equipPowerArray,
    unequipPowerArray,
    removePower,
    removePowerArray,
    addItemToInventory,
    removeFromInventory,
    changeItemQuantity,
    equipItem,
    unequipItem,
    upgradeItem,
    addRunics,
    spendRunics,
    acquireBenefit,
    removeBenefit,
    updateUnarmedMastery,
    pendingAction,
    clearPendingAction,
    refresh,
  } = useCharacterSheet(characterId);

  const { user: currentUser } = useAuth();
  const isAdminMode = !!(currentUser?.isAdmin && character?.userId !== currentUser?.id);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [usersList, setUsersList] = useState<{ id: string; name: string; email: string; roles: string[] }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const openTransferModal = async () => {
    setIsTransferModalOpen(true);
    setIsLoadingUsers(true);
    try {
      const list = await charactersService.fetchAllUsers();
      setUsersList(list);
    } catch (err) {
      toast.error('Erro ao carregar usuários.');
      console.error(err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleTransferOwner = async (newOwnerId: string, newOwnerName: string) => {
    if (!character) return;
    setIsTransferring(true);
    try {
      await charactersService.transferOwnership(characterId, newOwnerId);
      toast.success(`Ficha transferida para ${newOwnerName}!`);
      setIsTransferModalOpen(false);
      refresh();
    } catch (err) {
      toast.error('Erro ao transferir propriedade da ficha.');
      console.error(err);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleAdminHeal = async () => {
    if (!character) return;
    try {
      await sync({
        pvChange: character.health.maxPV - character.health.currentPV,
        peChange: character.energy.maxPE - character.energy.currentPE,
      });
      toast.success('Vida e Energia restauradas ao máximo!');
    } catch (err) {
      toast.error('Erro ao curar personagem.');
    }
  };

  const handleAdminAddRunics = async () => {
    if (!character) return;
    try {
      await charactersService.addRunics(characterId, 1000);
      toast.success('+1000 Rúnicos adicionados!');
      refresh();
    } catch (err) {
      toast.error('Erro ao adicionar rúnicos.');
    }
  };

  const {
    activePowers,
    isResolving: isPowerResolving,
    isConfirming: isPowerConfirming,
    previewPower,
    confirmUsePower,
    maintainPower,
    deactivatePower,
  } = usePowerUsage({
    characterId,
    onSync: sync,
  });

  const [equippedPassives, setEquippedPassives] = useState<any[]>([]);

  useEffect(() => {
    const loadPassives = async () => {
      try {
        const [powersList, arraysList, itemsList] = await Promise.all([
          charactersService.fetchCharacterPowers(characterId).catch(() => []),
          charactersService.fetchCharacterPowerArrays(characterId).catch(() => []),
          charactersService.fetchCharacterItems(characterId).catch(() => [])
        ]);

        if (!character) return;

        // 1. Get all equipped items
        const equippedItemIds = new Set<string>();
        if (character.equipment.suitId) equippedItemIds.add(character.equipment.suitId);
        if (character.equipment.accessoryId) equippedItemIds.add(character.equipment.accessoryId);
        character.equipment.hands.forEach(h => equippedItemIds.add(h.itemId));
        character.equipment.quickAccess.forEach(q => equippedItemIds.add(q.itemId));

        const equippedItems = itemsList.filter(item => equippedItemIds.has(item.id));
        const itemPowerIds = equippedItems.flatMap(item => item.powerIds || []);
        const itemPowerArrayIds = equippedItems.flatMap(item => item.powerArrayIds || []);

        // 2. Fetch missing powers/arrays that are on equipped items but not in our lists
        const missingPowerIds = itemPowerIds.filter(pid => !powersList.some(p => p.id === pid));
        const missingPowerArrayIds = itemPowerArrayIds.filter(paid => !arraysList.some(a => a.id === paid));

        const fetchedPowers = await Promise.all(
          missingPowerIds.map(pid => getPowerById(pid).catch(() => null))
        );
        const fetchedArrays = await Promise.all(
          missingPowerArrayIds.map(paid => getPowerArrayById(paid).catch(() => null))
        );

        const allPowers = [...powersList, ...fetchedPowers.filter(Boolean) as any[]];
        const allArrays = [...arraysList, ...fetchedArrays.filter(Boolean) as any[]];

        // 3. Individual equipped powers (from character)
        const individualEquipped = character.powers
          ?.filter(p => p.isEquipped)
          ?.map(p => allPowers.find(pl => pl.id === p.powerId))
          ?.filter(Boolean) || [];

        // 4. Array equipped powers (from character)
        const arrayEquipped = character.powerArrays
          ?.filter(a => a.isEquipped)
          ?.flatMap(a => {
            const arr = allArrays.find(al => al.id === a.powerArrayId);
            return arr?.powers || [];
          }) || [];

        // 5. Powers from equipped items
        const itemPowers: any[] = [];
        equippedItems.forEach(item => {
          item.powerIds?.forEach(pid => {
            const power = allPowers.find(p => p.id === pid);
            if (power) {
              itemPowers.push({
                ...power,
                originItemName: item.nome,
                originItemId: item.id,
                originItemTipo: item.tipo
              });
            }
          });
          item.powerArrayIds?.forEach(paid => {
            const arr = allArrays.find(a => a.id === paid);
            if (arr && arr.powers) {
              arr.powers.forEach((power: any) => {
                itemPowers.push({
                  ...power,
                  originItemName: item.nome,
                  originItemId: item.id,
                  originItemTipo: item.tipo
                });
              });
            }
          });
        });

        // 6. Merge and keep only permanent powers (duracao === 4)
        const allEquipped = Array.from(
          new Map([...individualEquipped, ...arrayEquipped, ...itemPowers].map(p => [p.id, p])).values()
        );

        const passives = allEquipped.filter(
          p => p.parametros?.duracao === 4
        );

        setEquippedPassives(passives);
      } catch (e) {
        console.error('Error loading passive powers:', e);
      }
    };

    if (character) {
      loadPassives();
    }
  }, [
    characterId,
    character?.powers,
    character?.powerArrays,
    character?.equipment?.suitId,
    character?.equipment?.accessoryId,
    character?.equipment?.hands,
    character?.equipment?.quickAccess
  ]);

  const allActivePowers = [
    ...(activePowers || []),
    ...equippedPassives.map(p => ({
      id: p.id,
      powerId: p.id,
      nome: p.nome,
      icone: p.icone,
      duracao: p.parametros?.duracao ?? 4,
      peCostPerRound: 0,
      activatedAt: Date.now(),
      effects: p.effects || p.efeitos || [],
      efeitos: p.effects || p.efeitos || [],
      originItemId: p.originItemId,
      originItemTipo: p.originItemTipo,
    }))
  ];

  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const storageKey = `aetherium-tab-${characterId}`;
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(storageKey) || 'acoes';
  });

  const [activeMobileSection, setActiveMobileSection] = useState('geral');

  useEffect(() => {
    localStorage.setItem(storageKey, activeTab);
    
    // Sincroniza a nav mobile com a aba atual
    if (['acoes', 'poderes', 'beneficios'].includes(activeTab)) {
      setActiveMobileSection('combate');
    } else if (activeTab === 'inventario') {
      setActiveMobileSection('inventario');
    } else if (['narrativa', 'anotacoes'].includes(activeTab)) {
      setActiveMobileSection('lore');
    }
  }, [activeTab, storageKey]);

  const handleMobileNavChange = (section: string) => {
    setActiveMobileSection(section);
    if (section === 'combate' && !['acoes', 'poderes', 'beneficios'].includes(activeTab)) {
      setActiveTab('acoes');
    } else if (section === 'inventario') {
      setActiveTab('inventario');
    } else if (section === 'lore' && !['narrativa', 'anotacoes'].includes(activeTab)) {
      setActiveTab('narrativa');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!character) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 lg:pb-0">
      {isAdminMode && (
        <div className="bg-gradient-to-r from-red-950/40 to-slate-900/60 backdrop-blur-md border border-red-500/30 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-red-950/20 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-red-400 tracking-wide uppercase">Modo Administrador</span>
                <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">Acesso Total</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Você está editando a ficha de outro jogador. Alterações serão salvas em tempo real.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handleAdminHeal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 transition-all cursor-pointer"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              Restaurar PV/PE
            </button>
            
            <button
              onClick={handleAdminAddRunics}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              +1000 ᚱ
            </button>
            
            <button
              onClick={openTransferModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-400 transition-all cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Transferir Dono
            </button>
          </div>
        </div>
      )}

      <CharacterHeader 
        character={character} 
        onSync={sync} 
        onLevelUp={levelUp} 
        onOpenRest={() => setIsRestModalOpen(true)} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna 1: Sidebar Fixa (Estatísticas vitais) */}
        <div className={`lg:col-span-3 space-y-6 min-w-0 ${activeMobileSection === 'geral' ? 'block' : 'hidden'} lg:block`}>
          <SidebarColumn character={character} onSync={sync} activePowers={allActivePowers} />
        </div>

        {/* Coluna 2: Detalhes de Atributos e Perícias */}
        <div className={`lg:col-span-3 space-y-6 min-w-0 ${activeMobileSection === 'geral' ? 'block' : 'hidden'} lg:block`}>
          <StatsColumn character={character} onSync={sync} activePowers={allActivePowers} deactivatePower={deactivatePower} />
        </div>

        {/* Coluna 3: Área Principal de Conteúdo Dinâmico */}
        <div className={`lg:col-span-6 space-y-6 min-w-0 ${activeMobileSection !== 'geral' ? 'block' : 'hidden'} lg:block`}>
          <MainArea 
            character={character} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onSync={sync}
            isSyncing={isSyncing}
            onAcquireDomainMastery={acquireDomainMastery}
            onDiscardDomainMastery={discardDomainMastery}
            onAcquirePower={acquirePower}
            onAcquirePowerArray={acquirePowerArray}
            onEquipPower={equipPower}
            onUnequipPower={unequipPower}
            onEquipPowerArray={equipPowerArray}
            onUnequipPowerArray={unequipPowerArray}
            onRemovePower={removePower}
            onRemovePowerArray={removePowerArray}
            onEquipItem={equipItem}
            onUnequipItem={unequipItem}
            onAddItemToInventory={addItemToInventory}
            onRemoveFromInventory={removeFromInventory}
            onChangeItemQuantity={changeItemQuantity}
            onAddRunics={addRunics}
            onSpendRunics={spendRunics}
            onUpgradeItem={upgradeItem}
            onAcquireBenefit={acquireBenefit}
            onRemoveBenefit={removeBenefit}
            onUpdateUnarmedMastery={updateUnarmedMastery}
            activePowers={allActivePowers}
            isPowerResolving={isPowerResolving}
            isPowerConfirming={isPowerConfirming}
            previewPower={previewPower}
            confirmUsePower={confirmUsePower}
            maintainPower={maintainPower}
            deactivatePower={deactivatePower}
          />
        </div>
      </div>

      <MobileBottomNav activeSection={activeMobileSection} onChange={handleMobileNavChange} />

      <DescansoModal
        isOpen={isRestModalOpen}
        onClose={() => setIsRestModalOpen(false)}
        character={character}
        onRest={(payload) => {
          const bonuses = obterBonusVidaEnergiaFortalecer(allActivePowers, character);
          return rest({
            ...payload,
            customMaxPV: character.health.maxPV + bonuses.maxPV,
            customMaxPE: character.energy.maxPE + bonuses.maxPE,
          });
        }}
        isProcessing={isSyncing}
      />

      <ConfirmDialog
        isOpen={!!pendingAction}
        onClose={clearPendingAction}
        onConfirm={pendingAction?.onConfirm ?? (async () => {})}
        title={pendingAction?.title}
        message={pendingAction?.message ?? ''}
        confirmText={pendingAction?.confirmText}
        variant={pendingAction?.variant ?? 'warning'}
      />

      <Modal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)} 
        title="Transferir Propriedade da Ficha"
        size="md"
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecione o usuário que passará a ser o dono desta ficha.
          </p>
          
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              (() => {
                const filtered = usersList.filter(
                  (u) =>
                    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchQuery.toLowerCase())
                );
                
                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                      Nenhum usuário encontrado.
                    </div>
                  );
                }
                
                return filtered.map((u) => (
                  <div 
                    key={u.id} 
                    className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        {u.name}
                        {u.id === character?.userId && (
                          <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200">
                            Dono Atual
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                    </div>
                    
                    {u.id !== character?.userId && (
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => handleTransferOwner(u.id, u.name)}
                        disabled={isTransferring}
                      >
                        Selecionar
                      </Button>
                    )}
                  </div>
                ));
              })()
            )}
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsTransferModalOpen(false)}>
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
