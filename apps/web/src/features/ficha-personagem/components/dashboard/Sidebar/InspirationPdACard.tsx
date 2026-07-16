import { SyncCharacterData } from '@/services/characters.types';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/shared/ui';
import { Sparkles, Zap, Plus, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';

interface InspirationPdACardProps {
  inspiration: number;
  pda: {
    total: number;
    spent: number;
    extra: number;
    available: number;
  };
  onSync: (data: SyncCharacterData) => Promise<void>;
}

export function InspirationPdACard({ inspiration, pda, onSync }: InspirationPdACardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localExtraPda, setLocalExtraPda] = useState(pda.extra.toString());

  useEffect(() => {
    setLocalExtraPda(pda.extra.toString());
  }, [pda.extra]);

  const handleInspirationChange = async (delta: number) => {
    if (isUpdating) return;
    const newValue = Math.max(0, Math.min(3, inspiration + delta));
    if (newValue === inspiration) return;

    setIsUpdating(true);
    try {
      await onSync({ inspiration: newValue });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExtraPdaBlur = async () => {
    const parsed = parseInt(localExtraPda);
    if (isNaN(parsed) || parsed < 0) {
      setLocalExtraPda(pda.extra.toString());
      return;
    }
    
    if (parsed === pda.extra) return;

    setIsUpdating(true);
    try {
      await onSync({ extraPda: parsed });
    } catch (e) {
      setLocalExtraPda(pda.extra.toString());
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="overflow-hidden border-none shadow-md bg-white dark:bg-gray-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-500 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Recursos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inspiração */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-sm shadow-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tight">Inspiração</p>
              <p className="text-lg font-black text-amber-900 dark:text-amber-100 leading-none mt-0.5">{inspiration}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 w-9 !p-0 hover:bg-amber-200 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              onClick={() => handleInspirationChange(-1)}
              disabled={isUpdating || inspiration <= 0}
            >
              <Minus className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 !p-0 hover:bg-amber-200 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              onClick={() => handleInspirationChange(1)}
              disabled={isUpdating || inspiration >= 3}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Pontos de Ascensão (PdA) */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-tight">PdA Disponível</p>
              <p className="text-lg font-black text-indigo-900 dark:text-indigo-100 leading-none mt-0.5">{pda.available}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
              <span>Extra:</span>
              <input
                type="number"
                value={localExtraPda}
                onChange={(e) => setLocalExtraPda(e.target.value)}
                onBlur={handleExtraPdaBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleExtraPdaBlur()}
                disabled={isUpdating}
                className="w-10 px-1 py-0.5 text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Total: {pda.total} • Gasto: {pda.spent}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
