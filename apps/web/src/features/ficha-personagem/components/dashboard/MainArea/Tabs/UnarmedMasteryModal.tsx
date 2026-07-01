import { useState, useMemo, useEffect } from 'react';
import { Modal, ModalFooter, Button, Input, toast } from '@/shared/ui';
import { Target, Flame, Info, Sparkles, AlertCircle, Save } from 'lucide-react';
import type { CharacterResponse } from '@/services/characters.types';

interface UnarmedMasteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterResponse;
  onUpdate: (mastery: any) => Promise<void>;
  isProcessing: boolean;
}

export function UnarmedMasteryModal({
  isOpen,
  onClose,
  character,
  onUpdate,
  isProcessing,
}: UnarmedMasteryModalProps) {
  const current = character.unarmedMastery;
  
  const [customName, setCustomName] = useState(current?.customName || '');
  const [degree, setDegree] = useState(current?.degree || 0);
  const [marginImprovements, setMarginImprovements] = useState(current?.marginImprovements || 0);
  const [multiplierImprovements, setMultiplierImprovements] = useState(current?.multiplierImprovements || 0);
  const [damageType, setDamageType] = useState(current?.damageType || 'Impacto');

  // Preview das estatísticas
  const preview = useMemo(() => {
    const dieValue = Math.pow(2, degree + 1);
    
    // Melhorias são fixas (+1/-1)
    const criticalMargin = Math.max(10, 20 - marginImprovements);
    const criticalMultiplier = 2 + multiplierImprovements;
    
    // Cálculo do custo de PdA: Escalonado pelo Grau
    let cost = 0;
    cost += degree * 7;
    
    const improvementUnitCost = degree > 0 ? degree : 1;
    cost += marginImprovements * improvementUnitCost;
    cost += multiplierImprovements * improvementUnitCost;
    
    if (damageType.toLowerCase() !== 'impacto' && damageType !== '') {
      cost += 1;
    }

    // Diferença em relação ao atual
    const currentCost = current?.totalPdaCost || 0;
    const pdaDiff = cost - currentCost;

    return {
      damageDie: `1d${dieValue}`,
      criticalMargin,
      criticalMultiplier,
      totalCost: cost,
      pdaDiff,
      isValid: pdaDiff <= character.pda.available
    };
  }, [degree, marginImprovements, multiplierImprovements, damageType, character.pda.available, current]);

  // Validações de limites locais
  const maxMargin = degree * 2;
  const maxMultiplier = degree < 3 ? 0 : Math.min(3, Math.floor((degree - 1) / 2));

  useEffect(() => {
    // Corrigir excessos se o grau diminuir
    if (marginImprovements > degree * 2) setMarginImprovements(degree * 2);
    if (multiplierImprovements > maxMultiplier) setMultiplierImprovements(maxMultiplier);
  }, [degree]);

  const handleConfirm = async () => {
    if (!preview.isValid && preview.pdaDiff > 0) {
      toast.error('PdA insuficiente!');
      return;
    }

    await onUpdate({
      customName,
      degree,
      marginImprovements,
      multiplierImprovements,
      damageType
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Evolução de Domínio Desarmado" size="lg">
      <div className="space-y-6 py-2">
        {/* --- CABEÇALHO DE STATUS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black text-red-600/60 uppercase tracking-widest mb-1">Dano Atual</span>
            <span className="text-3xl font-black text-red-600">{preview.damageDie}</span>
            <span className="text-[10px] font-bold text-red-500/80 mt-1 uppercase">{damageType}</span>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest mb-1">Crítico</span>
            <span className="text-3xl font-black text-amber-600">{preview.criticalMargin}/x{preview.criticalMultiplier}</span>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black text-indigo-600/60 uppercase tracking-widest mb-1">Investimento PdA</span>
            <span className="text-3xl font-black text-indigo-600">{preview.totalCost}</span>
            <span className={`text-[9px] font-bold mt-1 uppercase ${preview.pdaDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {preview.pdaDiff === 0 ? 'Sem alteração' : preview.pdaDiff > 0 ? `+${preview.pdaDiff} PdA` : `${preview.pdaDiff} PdA (Reembolso)`}
            </span>
          </div>
        </div>

        {/* --- NOME PERSONALIZADO --- */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-purple-500" /> Nome do Ataque (Descritor)
          </label>
          <Input 
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Ex: Punho de Ferro, Chute Escaldante..."
            className="bg-gray-50 dark:bg-gray-900 border-none font-bold"
          />
        </div>

        {/* --- CONTROLES DE EVOLUÇÃO --- */}
        <div className="space-y-4">
          {/* GRAU */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold">G</span>
                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">Grau de Domínio</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">7 PdA por nível • Dobra o dado</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setDegree(Math.max(0, degree - 1))} className="h-8 w-8 !p-0">-</Button>
                <span className="text-xl font-black text-gray-900 dark:text-gray-100 w-6 text-center">{degree}</span>
                <Button variant="outline" size="sm" onClick={() => setDegree(Math.min(9, degree + 1))} className="h-8 w-8 !p-0" disabled={degree >= 9}>+</Button>
              </div>
            </div>
          </div>

          {/* MARGEM DE CRÍTICO */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                  <Target className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">Melhoria de Margem</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">1 PdA * Grau cada • Máx 2x por Grau (Teto 10)</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setMarginImprovements(Math.max(0, marginImprovements - 1))} className="h-8 w-8 !p-0">-</Button>
                <span className="text-xl font-black text-gray-900 dark:text-gray-100 w-6 text-center">{marginImprovements}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setMarginImprovements(Math.min(10, marginImprovements + 1))} 
                  className="h-8 w-8 !p-0"
                  disabled={marginImprovements >= maxMargin || marginImprovements >= 10}
                >+</Button>
              </div>
            </div>
            {marginImprovements >= maxMargin && degree < 5 && (
              <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                <Info className="w-3 h-3" /> Aumente o Grau para comprar mais melhorias de margem.
              </p>
            )}
          </div>

          {/* MULTIPLICADOR DE CRÍTICO */}
          <div className={`p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-3 shadow-sm transition-opacity ${degree < 3 ? 'opacity-40 grayscale' : 'opacity-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold">x</span>
                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">Melhoria de Multiplicador</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">1 PdA * Grau cada • Grau 3+ • 1x a cada 2 Graus (Teto x5)</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setMultiplierImprovements(Math.max(0, multiplierImprovements - 1))} className="h-8 w-8 !p-0" disabled={degree < 3}>-</Button>
                <span className="text-xl font-black text-gray-900 dark:text-gray-100 w-6 text-center">{multiplierImprovements}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setMultiplierImprovements(Math.min(3, multiplierImprovements + 1))} 
                  className="h-8 w-8 !p-0"
                  disabled={degree < 3 || multiplierImprovements >= maxMultiplier}
                >+</Button>
              </div>
            </div>
          </div>

          {/* TIPO DE DANO */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                  <Flame className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">Tipo de Dano (Descritor)</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Personalizar: 1 PdA • Ex: Fogo, Sagrado, Psíquico</p>
                </div>
              </div>
              <Input 
                value={damageType}
                onChange={(e) => setDamageType(e.target.value)}
                placeholder="Ex: Impacto, Fogo..."
                className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-xs font-bold p-2 w-32 h-9 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* MENSAGEM DE ERRO PDA */}
        {!preview.isValid && preview.pdaDiff > 0 && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-pulse">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-xs font-bold text-red-600">
              Você precisa de mais {preview.pdaDiff - character.pda.available} PdA para realizar esta evolução.
            </p>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleConfirm}
          loading={isProcessing}
          disabled={!preview.isValid && preview.pdaDiff > 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-4 rounded-xl shadow-lg shadow-indigo-600/30 gap-2"
        >
          <Save className="w-4 h-4" /> SALVAR
        </Button>
      </ModalFooter>
    </Modal>
  );
}
