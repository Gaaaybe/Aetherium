import { useState, useEffect } from 'react';
import { useCharacterSheet } from '../hooks/useCharacterSheet';
import { CharacterHeader } from './dashboard/CharacterHeader';
import { SidebarColumn } from './dashboard/SidebarColumn';
import { StatsColumn } from './dashboard/StatsColumn';
import { MainArea } from './dashboard/MainArea';
import { MobileBottomNav } from './dashboard/Mobile/MobileBottomNav';
import { ConfirmDialog } from '@/shared/ui';
import { DescansoModal } from './dashboard/DescansoModal';

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
          <SidebarColumn character={character} onSync={sync} />
        </div>

        {/* Coluna 2: Detalhes de Atributos e Perícias */}
        <div className={`lg:col-span-3 space-y-6 ${activeMobileSection === 'geral' ? 'block' : 'hidden'} lg:block`}>
          <StatsColumn character={character} onSync={sync} />
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
          />
        </div>
      </div>

      <MobileBottomNav activeSection={activeMobileSection} onChange={handleMobileNavChange} />

      <DescansoModal
        isOpen={isRestModalOpen}
        onClose={() => setIsRestModalOpen(false)}
        character={character}
        onRest={rest}
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
