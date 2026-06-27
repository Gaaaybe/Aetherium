import { useState, useMemo, useEffect } from 'react';
import { Modal, ModalFooter, Button, Input, toast, DynamicIcon } from '@/shared/ui';
import { Hammer, ArrowRight, Zap, Shield, Sword, Sparkles, AlertCircle, Coins, Info } from 'lucide-react';
import type { ItemResponse, WeaponItemResponse, DefensiveItemResponse, UpgradeMaterialItemResponse } from '@/services/types';


interface UpgradeItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemResponse | null;
  inventory: Array<{ itemId: string; quantity: number }>;
  detailedItems: Record<string, ItemResponse>;
  currentRunics: number;
  onUpgrade: (materialId: string, runicsCost: number) => Promise<void>;
  isProcessing: boolean;
}

export function UpgradeItemModal({
  isOpen,
  onClose,
  item,
  inventory,
  detailedItems,
  currentRunics,
  onUpgrade,
  isProcessing,
}: UpgradeItemModalProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  
  const currentLevel = item ? (item as WeaponItemResponse | DefensiveItemResponse).upgradeLevel : 0;
  const nextLevel = currentLevel + 1;

  // Encontrar o material selecionado
  const selectedMaterial = useMemo(() => {
    if (!selectedMaterialId) return null;
    return detailedItems[selectedMaterialId] as UpgradeMaterialItemResponse | undefined;
  }, [selectedMaterialId, detailedItems]);

  // Fórmula de custo sugerida: Material.custoBase * (Lvl Atual + 1)
  const suggestedCost = useMemo(() => {
    if (selectedMaterial) {
      return selectedMaterial.custoBase * (currentLevel + 1);
    }
    return nextLevel * 500;
  }, [selectedMaterial, currentLevel, nextLevel]);

  const [runicsCost, setRunicsCost] = useState(suggestedCost.toString());
  
  // Tier mínimo necessário para o próximo nível (1-2: T1, 3-4: T2, 5-6: T3, 7-9: T4)
  const minTierRequired = Math.ceil(nextLevel / 2);

  // Resetar campos quando trocar de item
  useEffect(() => {
    if (item) {
      setSelectedMaterialId(null);
      setRunicsCost(suggestedCost.toString());
    }
  }, [item?.id]);

  // Atualizar custo quando selecionar material
  useEffect(() => {
    if (selectedMaterial) {
       setRunicsCost((selectedMaterial.custoBase * (currentLevel + 1)).toString());
    }
  }, [selectedMaterialId, currentLevel]);

  const materials = useMemo(() => {
    if (!item) return [];
    return inventory
      .map((i) => detailedItems[i.itemId])
      .filter((i): i is UpgradeMaterialItemResponse => 
        i?.tipo === 'upgrade-material' && i.maxUpgradeLimit > (item as WeaponItemResponse | DefensiveItemResponse).upgradeLevel
      );
  }, [inventory, detailedItems, item]);

  if (!item || (item.tipo !== 'weapon' && item.tipo !== 'defensive-equipment')) return null;

  const multiplier = Math.pow(2, nextLevel);

  const handleConfirm = async () => {
    if (!selectedMaterialId) {
      toast.error('Selecione um material de aprimoramento');
      return;
    }
    const cost = parseInt(runicsCost, 10);
    if (isNaN(cost) || cost < 0) {
      toast.error('Custo rúnico inválido');
      return;
    }
    if (cost > currentRunics) {
      toast.error('Rúnicos insuficientes');
      return;
    }

    await onUpgrade(selectedMaterialId, cost);
    onClose();
  };

  const renderWeaponPreview = (w: WeaponItemResponse) => {
    return (
      <div className="space-y-2">
        {w.danos.map((d, i) => {
          const [count, size] = d.dado.split('d').map(Number);
          return (
            <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5 dark:bg-black/20 border border-red-500/10">
              <span className="text-gray-400 text-[10px] uppercase font-bold">{d.base}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 line-through">{d.dado}</span>
                <ArrowRight className="w-3 h-3 text-red-500" />
                <span className="text-sm font-black text-red-500">{count}d{size * 2}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDefensePreview = (d: DefensiveItemResponse) => {
    const nextRD = d.baseRD * multiplier;
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-500" />
          <span className="text-xs font-bold text-gray-400 uppercase">Redução de Dano</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-medium text-gray-400 line-through">RD {d.rdAtual}</span>
          <ArrowRight className="w-4 h-4 text-emerald-500" />
          <span className="text-2xl font-black text-emerald-500">RD {nextRD}</span>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Forja de Aprimoramento" size="md">
      <div className="space-y-6 py-2">
        {/* Header do Item */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 shadow-inner">
          <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-500/20 shadow-lg bg-white dark:bg-gray-800 flex items-center justify-center">
            {item.icone ? (
              <DynamicIcon name={item.icone} className="w-full h-full object-cover" />
            ) : (
              item.tipo === 'weapon' ? <Sword className="w-8 h-8 text-red-500" /> : <Shield className="w-8 h-8 text-emerald-500" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 leading-none">{item.nome}</h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-none font-black text-[10px]">
                NÍVEL {currentLevel}
              </Badge>
              <ArrowRight className="w-3 h-3 text-gray-400" />
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 flex gap-1 border-none font-black text-[10px]">
                NÍVEL {nextLevel} <Sparkles className="w-2.5 h-2.5" />
              </Badge>
            </div>
          </div>
          <div className="ml-auto flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tighter">Status Atual</span>
            <span className="text-xl font-black text-amber-600">
               {item.tipo === 'defensive-equipment' ? `RD ${(item as DefensiveItemResponse).rdAtual}` : (item as WeaponItemResponse).danos[0].dado}
            </span>
          </div>
        </div>

        {/* Preview do Upgrade */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-3 h-3 text-amber-500" /> Resultados do Aprimoramento
          </p>
          {item.tipo === 'weapon' ? renderWeaponPreview(item as WeaponItemResponse) : renderDefensePreview(item as DefensiveItemResponse)}
        </div>

        {/* Seleção de Material */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Hammer className="w-3 h-3 text-amber-500" /> Material Necessário
          </p>
          <div className="grid grid-cols-1 gap-2">
            {materials.length > 0 ? (
              materials.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => setSelectedMaterialId(mat.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selectedMaterialId === mat.id
                      ? 'bg-amber-600 border-amber-500 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedMaterialId === mat.id ? 'bg-white/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                      {mat.icone ? <DynamicIcon name={mat.icone} className="w-full h-full object-cover" /> : <Hammer className="w-4 h-4 text-orange-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{mat.nome}</p>
                      <p className={`text-[9px] uppercase font-black ${selectedMaterialId === mat.id ? 'text-amber-100' : 'text-gray-400'}`}>Tier {mat.tier} (Até nível {mat.maxUpgradeLimit})</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <span className="text-[10px] font-bold">1 unidade</span>
                     {mat.tier > minTierRequired && (
                        <p className="text-[9px] text-amber-100/60 flex items-center gap-1 justify-end">
                          <Info className="w-2 h-2" /> Tier Superior (Gasto Excessivo)
                        </p>
                     )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8 text-gray-300" />
                <p className="text-xs text-gray-500 font-medium">Você não possui materiais de Tier {minTierRequired} ou superior para este nível.</p>
              </div>
            )}
          </div>
        </div>

        {/* Custo em Rúnicos */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/5 border border-amber-100 dark:border-amber-900/20 space-y-3">
          <div className="flex items-center justify-between font-black text-amber-900 dark:text-amber-100">
             <div className="flex items-center gap-2 uppercase tracking-tighter text-xs">
               <Coins className="w-4 h-4" /> Custo de Moedas
             </div>
             <div className="flex items-center gap-2">
               <span className="text-[10px] text-amber-700/60 uppercase">Saldo: ᚱ {currentRunics}</span>
             </div>
          </div>
          <Input 
            type="number" 
            value={runicsCost} 
            onChange={(e) => setRunicsCost(e.target.value)}
            className="text-right font-black text-2xl h-14 bg-white dark:bg-gray-900 border-none shadow-inner"
            placeholder="0"
          />
          <div className="flex justify-between items-center text-[10px] text-amber-700/60 font-medium px-1">
             <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Custo Mínimo Ideal: ᚱ {selectedMaterial ? (selectedMaterial.custoBase * (currentLevel + 1)) : '---'}</span>
             <span>* Valor sugerido para o nível atual</span>
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleConfirm}
          loading={isProcessing}
          disabled={!selectedMaterialId || currentRunics < parseInt(runicsCost, 10)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-black px-8 py-6 rounded-xl shadow-lg shadow-amber-600/30 gap-2 text-lg"
        >
          <Hammer className="w-5 h-5" /> FORJAR
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${className}`}>
      {children}
    </span>
  );
}
