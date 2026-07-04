import { CharacterResponse, SyncCharacterData } from '@/services/characters.types';
import type { EquipSlot } from '@/services/characters.types';
import { Card } from '@/shared/ui';
import { Sword, Zap, Gift, Backpack, BookOpen, StickyNote } from 'lucide-react';
import { AcoesTab } from './Tabs/AcoesTab';
import { PoderesTab } from './Tabs/PoderesTab';
import { BeneficiosTab } from './Tabs/BeneficiosTab';
import { InventarioTab } from './Tabs/InventarioTab';
import { NarrativeTab } from './Tabs/NarrativeTab';
import { AnotacoesTab } from './Tabs/AnotacoesTab';

interface MainAreaProps {
  character: CharacterResponse;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSync: (data: SyncCharacterData) => Promise<void>;
  isSyncing: boolean;
  onAcquireDomainMastery: (domainId: string, masteryLevel: 'INICIANTE' | 'PRATICANTE' | 'MESTRE') => Promise<void>;
  onDiscardDomainMastery: (domainId: string) => void;
  onAcquirePower: (powerId: string) => Promise<void>;
  onAcquirePowerArray: (powerArrayId: string) => Promise<void>;
  onEquipPower: (powerId: string) => Promise<void>;
  onUnequipPower: (powerId: string) => Promise<void>;
  onEquipPowerArray: (powerArrayId: string) => Promise<void>;
  onUnequipPowerArray: (powerArrayId: string) => Promise<void>;
  onRemovePower: (powerId: string) => void;
  onRemovePowerArray: (powerArrayId: string) => void;
  onEquipItem: (itemId: string, slot: EquipSlot, quantity?: number) => Promise<void>;
  onUnequipItem: (itemId: string, slot: EquipSlot, quantity?: number) => Promise<void>;
  onAddItemToInventory: (itemId: string, quantity?: number) => Promise<void>;
  onRemoveFromInventory: (itemId: string, quantity?: number) => void;
  onChangeItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  onAddRunics: (amount: number) => Promise<void>;
  onSpendRunics: (amount: number) => Promise<void>;
  onUpgradeItem: (itemId: string, materialId: string, runicsCost: number) => Promise<void>;
  onAcquireBenefit: (benefitName: string, targetDegree: number) => Promise<void>;
  onRemoveBenefit: (benefitId: string) => void;
  onUpdateUnarmedMastery: (mastery: any) => Promise<void>;
  activePowers: any[];
  isPowerResolving: boolean;
  isPowerConfirming: boolean;
  previewPower: any;
  confirmUsePower: any;
  maintainPower: any;
  deactivatePower: any;
}

export function MainArea({ 
  character, 
  activeTab, 
  setActiveTab, 
  onSync,
  isSyncing,
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
  onEquipItem,
  onUnequipItem,
  onAddItemToInventory,
  onRemoveFromInventory,
  onChangeItemQuantity,
  onAddRunics,
  onSpendRunics,
  onUpgradeItem,
  onAcquireBenefit,
  onRemoveBenefit,
  onUpdateUnarmedMastery,
  activePowers,
  isPowerResolving,
  isPowerConfirming,
  previewPower,
  confirmUsePower,
  maintainPower,
  deactivatePower,
}: MainAreaProps) {
  const tabs = [
    { id: 'acoes', label: 'Ações', icon: <Sword className="w-4 h-4" /> },
    { id: 'poderes', label: 'Poderes', icon: <Zap className="w-4 h-4" /> },
    { id: 'beneficios', label: 'Benefícios', icon: <Gift className="w-4 h-4" /> },
    { id: 'inventario', label: 'Inventário', icon: <Backpack className="w-4 h-4" /> },
    { id: 'narrativa', label: 'Narrativa', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'anotacoes', label: 'Anotações', icon: <StickyNote className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Tab Navigation */}
      <Card className={`border-none shadow-md bg-white dark:bg-gray-900 p-1 rounded-xl overflow-hidden ${activeTab === 'inventario' ? 'hidden lg:block' : 'block'}`}>
        <div className="flex flex-wrap md:flex-nowrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              } ${
                ['acoes', 'poderes', 'beneficios'].includes(tab.id) && !['acoes', 'poderes', 'beneficios'].includes(activeTab) ? 'hidden lg:flex' : ''
              } ${
                ['narrativa', 'anotacoes'].includes(tab.id) && !['narrativa', 'anotacoes'].includes(activeTab) ? 'hidden lg:flex' : ''
              } ${
                tab.id === 'inventario' && activeTab !== 'inventario' ? 'hidden lg:flex' : ''
              }`}
            >
              <div className="shrink-0">{tab.icon}</div>
              <span className="inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'acoes' && (
          <AcoesTab 
            character={character} 
            onUpdateUnarmedMastery={onUpdateUnarmedMastery} 
            onSync={onSync}
            activePowers={activePowers}
            isResolving={isPowerResolving}
            isConfirming={isPowerConfirming}
            previewPower={previewPower}
            confirmUsePower={confirmUsePower}
            maintainPower={maintainPower}
            deactivatePower={deactivatePower}
          />
        )}
        {activeTab === 'poderes' && (
          <PoderesTab 
            character={character} 
            _onSync={onSync} 
            onAcquireDomainMastery={onAcquireDomainMastery} 
            onDiscardDomainMastery={onDiscardDomainMastery}
            onAcquirePower={onAcquirePower}
            onAcquirePowerArray={onAcquirePowerArray}
            onEquipPower={onEquipPower}
            onUnequipPower={onUnequipPower}
            onEquipPowerArray={onEquipPowerArray}
            onUnequipPowerArray={onUnequipPowerArray}
            onRemovePower={onRemovePower}
            onRemovePowerArray={onRemovePowerArray}
            activePowers={activePowers}
          />
        )}
        {activeTab === 'beneficios' && <BeneficiosTab character={character} onAcquireBenefit={onAcquireBenefit} onRemoveBenefit={onRemoveBenefit} />}
        {activeTab === 'inventario' && (
          <InventarioTab
            character={character}
            onEquipItem={onEquipItem}
            onUnequipItem={onUnequipItem}
            onAddItem={onAddItemToInventory}
            onRemoveItem={onRemoveFromInventory}
            onChangeItemQuantity={onChangeItemQuantity}
            onAddRunics={onAddRunics}
            onSpendRunics={onSpendRunics}
            onUpgradeItem={onUpgradeItem}
            isSyncing={isSyncing}
          />
        )}
        {activeTab === 'narrativa' && <NarrativeTab character={character} _onSync={onSync} />}
        {activeTab === 'anotacoes' && <AnotacoesTab />}
      </div>
    </div>
  );
}
