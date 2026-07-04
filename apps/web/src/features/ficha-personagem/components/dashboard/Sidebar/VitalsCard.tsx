import { useState } from 'react';
import { CharacterResponse, SyncCharacterData } from '@/services/characters.types';
import { Card, CardContent, Button, Input } from '@/shared/ui';
import { Heart, Zap, ShieldPlus } from 'lucide-react';
import { obterBonusVidaEnergiaFortalecer } from '@/features/ficha-personagem/utils/fortalecerHelper';

interface VitalsCardProps {
  health: CharacterResponse['health'];
  energy: CharacterResponse['energy'];
  onSync: (data: SyncCharacterData) => Promise<void>;
  activePowers?: any[];
  character?: any;
}

export function VitalsCard({ health, energy, onSync, activePowers = [], character }: VitalsCardProps) {
  const [pvValue, setPvValue] = useState('');
  const [peValue, setPeValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const bonuses = obterBonusVidaEnergiaFortalecer(activePowers, character);
  const totalMaxPV = health.maxPV + bonuses.maxPV;
  const totalMaxPE = energy.maxPE + bonuses.maxPE;

  const hpPercent = Math.min(100, Math.max(0, (health.currentPV / totalMaxPV) * 100));
  const pePercent = Math.min(100, Math.max(0, (energy.currentPE / totalMaxPE) * 100));

  const handleAdjustPV = async (type: 'damage' | 'heal' | 'temp') => {
    const val = parseInt(pvValue);
    if (isNaN(val) || val <= 0) return;

    setIsProcessing(true);
    try {
      if (type === 'damage') await onSync({ pvChange: -val, customMaxPV: totalMaxPV });
      if (type === 'heal') await onSync({ pvChange: val, customMaxPV: totalMaxPV });
      if (type === 'temp') await onSync({ tempPvChange: val });
      setPvValue('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdjustPE = async (type: 'consume' | 'recover' | 'temp') => {
    const val = parseInt(peValue);
    if (isNaN(val) || val <= 0) return;

    setIsProcessing(true);
    try {
      if (type === 'consume') await onSync({ peChange: -val, customMaxPE: totalMaxPE });
      if (type === 'recover') await onSync({ peChange: val, customMaxPE: totalMaxPE });
      if (type === 'temp') await onSync({ tempPeChange: val });
      setPeValue('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-none shadow-md bg-white dark:bg-gray-900 overflow-hidden">
      <CardContent className="p-4 space-y-8">
        {/* PV Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Vida (PV)</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                    {health.currentPV} <span className="text-sm font-medium text-gray-400 tracking-tight">/ {totalMaxPV}</span>
                  </span>
                  {bonuses.maxPV > 0 && (
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 ml-0.5 animate-pulse" title="Bônus Temporário de Fortalecer">
                      (+{bonuses.maxPV})
                    </span>
                  )}
                </div>
              </div>
            </div>
            {(health.temporaryPV > 0 || bonuses.tempPV > 0) && (
              <div className="flex items-center gap-1.5">
                {health.temporaryPV > 0 && (
                  <div className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 animate-pulse">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase leading-none">Temp</p>
                    <p className="text-sm font-black text-blue-700 dark:text-blue-300">+{health.temporaryPV}</p>
                  </div>
                )}
                {health.temporaryPV < bonuses.tempPV && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[9px] font-black uppercase text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50"
                    onClick={async () => {
                      setIsProcessing(true);
                      try {
                        await onSync({ tempPvChange: bonuses.tempPV });
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing}
                    title="Aplicar PV Temporário do Poder"
                  >
                    Aplicar +{bonuses.tempPV}
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="h-3.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-700 ease-out"
              style={{ width: `${hpPercent}%` }}
            />
            {health.temporaryPV > 0 && (
              <div
                className="absolute top-0 right-0 h-full bg-blue-400/40 border-l border-blue-500/50"
                style={{ width: `${Math.min(100, (health.temporaryPV / totalMaxPV) * 100)}%` }}
              />
            )}
          </div>

          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Valor..."
              className="h-9 text-xs font-bold"
              value={pvValue}
              onChange={(e) => setPvValue(e.target.value)}
            />
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2 text-[10px] font-black uppercase text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => handleAdjustPV('damage')}
                disabled={isProcessing}
              >
                Dano
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2 text-[10px] font-black uppercase text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => handleAdjustPV('heal')}
                disabled={isProcessing}
              >
                Cura
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 !p-0 text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => handleAdjustPV('temp')}
                disabled={isProcessing}
                title="PV Temporário"
              >
                <ShieldPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* PE Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Energia (PE)</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                    {energy.currentPE} <span className="text-sm font-medium text-gray-400 tracking-tight">/ {totalMaxPE}</span>
                  </span>
                  {bonuses.maxPE > 0 && (
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 ml-0.5 animate-pulse" title="Bônus Temporário de Fortalecer">
                      (+{bonuses.maxPE})
                    </span>
                  )}
                </div>
              </div>
            </div>
            {((energy.temporaryPE ?? 0) > 0 || bonuses.tempPE > 0) && (
              <div className="flex items-center gap-1.5">
                {(energy.temporaryPE ?? 0) > 0 && (
                  <div className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 animate-pulse">
                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase leading-none">Temp</p>
                    <p className="text-sm font-black text-amber-700 dark:text-amber-300">+{energy.temporaryPE}</p>
                  </div>
                )}
                {(energy.temporaryPE ?? 0) < bonuses.tempPE && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[9px] font-black uppercase text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/20 dark:border-amber-900/50"
                    onClick={async () => {
                      setIsProcessing(true);
                      try {
                        await onSync({ tempPeChange: bonuses.tempPE });
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing}
                    title="Aplicar PE Temporário do Poder"
                  >
                    Aplicar +{bonuses.tempPE}
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="h-3.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700 ease-out"
              style={{ width: `${pePercent}%` }}
            />
            {(energy.temporaryPE ?? 0) > 0 && (
              <div
                className="absolute top-0 right-0 h-full bg-amber-400/40 border-l border-amber-500/50"
                style={{ width: `${Math.min(100, ((energy.temporaryPE ?? 0) / totalMaxPE) * 100)}%` }}
              />
            )}
          </div>

          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Valor..."
              className="h-9 text-xs font-bold"
              value={peValue}
              onChange={(e) => setPeValue(e.target.value)}
            />
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2 text-[10px] font-black uppercase text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                onClick={() => handleAdjustPE('consume')}
                disabled={isProcessing}
              >
                Gasto
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2 text-[10px] font-black uppercase text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={() => handleAdjustPE('recover')}
                disabled={isProcessing}
              >
                Recup.
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 !p-0 text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={() => handleAdjustPE('temp')}
                disabled={isProcessing}
                title="PE Temporário"
              >
                <ShieldPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
