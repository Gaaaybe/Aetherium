import { useState, useEffect } from 'react';
import { useCharacterSheet } from '../hooks/useCharacterSheet';
import { CharacterHeader } from './dashboard/CharacterHeader';
import { SidebarColumn } from './dashboard/SidebarColumn';
import { StatsColumn } from './dashboard/StatsColumn';
import { MainArea } from './dashboard/MainArea';
import { MobileBottomNav } from './dashboard/Mobile/MobileBottomNav';
import { ConfirmDialog } from '@/shared/ui';
import { DescansoModal } from './dashboard/DescansoModal';
import { usePowerUsage } from '../hooks/usePowerUsage';
import { charactersService } from '@/services/characters.service';
import { obterBonusVidaEnergiaFortalecer } from '../utils/fortalecerHelper';
import { getPowerById } from '@/services/powers.service';
import { getPowerArrayById } from '@/services/powerArrays.service';

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
  } = useCharacterSheet(characterId);

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
      <CharacterHeader 
        character={character} 
        onSync={sync} 
        onLevelUp={levelUp} 
        onOpenRest={() => setIsRestModalOpen(true)} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna 1: Sidebar Fixa (Estatísticas vitais) */}
        <div className={`lg:col-span-3 space-y-6 ${activeMobileSection === 'geral' ? 'block' : 'hidden'} lg:block`}>
          <SidebarColumn character={character} onSync={sync} activePowers={allActivePowers} />
        </div>

        {/* Coluna 2: Detalhes de Atributos e Perícias */}
        <div className={`lg:col-span-3 space-y-6 ${activeMobileSection === 'geral' ? 'block' : 'hidden'} lg:block`}>
          <StatsColumn character={character} onSync={sync} activePowers={allActivePowers} deactivatePower={deactivatePower} />
        </div>

        {/* Coluna 3: Área Principal de Conteúdo Dinâmico */}
        <div className={`lg:col-span-6 space-y-6 ${activeMobileSection !== 'geral' ? 'block' : 'hidden'} lg:block`}>
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
    </div>
  );
}
