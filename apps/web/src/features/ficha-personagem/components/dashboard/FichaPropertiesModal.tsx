import { useState, useEffect } from 'react';
import { Modal, ModalFooter, Button, Input } from '@/shared/ui';
import { Settings, Heart, Zap, Lock, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { CharacterResponse, SyncCharacterData } from '@/services/characters.types';

interface FichaPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterResponse;
  onSync: (data: SyncCharacterData) => Promise<void>;
  isProcessing: boolean;
}

export function FichaPropertiesModal({
  isOpen,
  onClose,
  character,
  onSync,
  isProcessing,
}: FichaPropertiesModalProps) {
  const [isPvLimited, setIsPvLimited] = useState(false);
  const [pvLimitValue, setPvLimitValue] = useState('');

  const [isPeLimited, setIsPeLimited] = useState(false);
  const [peLimitValue, setPeLimitValue] = useState('');

  // Sincroniza estado com o personagem ao abrir
  useEffect(() => {
    if (isOpen && character) {
      const pvLimit = character.health.limitMaxPV;
      if (pvLimit !== null && pvLimit !== undefined) {
        setIsPvLimited(true);
        setPvLimitValue(pvLimit.toString());
      } else {
        setIsPvLimited(false);
        setPvLimitValue('');
      }

      const peLimit = character.energy.limitMaxPE;
      if (peLimit !== null && peLimit !== undefined) {
        setIsPeLimited(true);
        setPeLimitValue(peLimit.toString());
      } else {
        setIsPeLimited(false);
        setPeLimitValue('');
      }
    }
  }, [isOpen, character]);

  const handleSave = async () => {
    const data: SyncCharacterData = {};

    if (isPvLimited) {
      const parsed = parseInt(pvLimitValue);
      data.limitMaxPV = isNaN(parsed) || parsed < 0 ? null : parsed;
    } else {
      data.limitMaxPV = null;
    }

    if (isPeLimited) {
      const parsed = parseInt(peLimitValue);
      data.limitMaxPE = isNaN(parsed) || parsed < 0 ? null : parsed;
    } else {
      data.limitMaxPE = null;
    }

    try {
      await onSync(data);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Propriedades da Ficha" size="md">
      <div className="space-y-6 py-4">
        {/* Descrição contextual */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 text-amber-800 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs font-bold leading-relaxed">
            Esta aba permite ajustar propriedades especiais e limites da sua ficha. Útil para debugar ou aplicar características específicas de campanha/poderes que restringem seus recursos vitais.
          </div>
        </div>

        {/* Seção PV */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">Restringir PV Máximo</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                  Capacidade Máxima: {character.health.maxPV} PV
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPvLimited}
                onChange={(e) => setIsPvLimited(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>

          {isPvLimited && (
            <div className="animate-in slide-in-from-top-2 duration-200 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-red-500" /> Novo Limite de PV Máximo
              </label>
              <Input
                type="number"
                min="0"
                max={character.health.maxPV}
                placeholder={`Ex: ${Math.floor(character.health.maxPV * 0.7)}`}
                value={pvLimitValue}
                onChange={(e) => setPvLimitValue(e.target.value)}
                className="font-bold bg-gray-50 dark:bg-gray-800 border-none"
              />
              <p className="text-[10px] text-gray-400 font-bold leading-tight">
                Seu PV atual e máximo efetivo não ultrapassarão este valor enquanto a restrição estiver ativa.
              </p>
            </div>
          )}
        </div>

        {/* Seção PE */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">Restringir PE Máximo</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                  Capacidade Máxima: {character.energy.maxPE} PE
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPeLimited}
                onChange={(e) => setIsPeLimited(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {isPeLimited && (
            <div className="animate-in slide-in-from-top-2 duration-200 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-blue-500" /> Novo Limite de PE Máximo
              </label>
              <Input
                type="number"
                min="0"
                max={character.energy.maxPE}
                placeholder={`Ex: ${Math.floor(character.energy.maxPE * 0.7)}`}
                value={peLimitValue}
                onChange={(e) => setPeLimitValue(e.target.value)}
                className="font-bold bg-gray-50 dark:bg-gray-800 border-none"
              />
              <p className="text-[10px] text-gray-400 font-bold leading-tight">
                Seu PE atual e máximo efetivo não ultrapassarão este valor enquanto a restrição estiver ativa.
              </p>
            </div>
          )}
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          loading={isProcessing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-4 rounded-xl shadow-lg shadow-indigo-600/30 gap-2"
        >
          <Settings className="w-4 h-4" /> SALVAR PROPRIEDADES
        </Button>
      </ModalFooter>
    </Modal>
  );
}
