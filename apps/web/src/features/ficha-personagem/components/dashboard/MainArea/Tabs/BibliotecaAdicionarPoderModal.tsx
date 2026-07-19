import { useState, useMemo, useEffect } from 'react';
import { Search, Zap, Layers, Sparkles, AlertCircle } from 'lucide-react';
import { Modal, Button, Input, DynamicIcon, Badge } from '@/shared/ui';
import { usePoderes } from '@/features/criador-de-poder/hooks/usePoderes';
import { usePowerArrays } from '@/features/criador-de-poder/hooks/usePowerArrays';
import type { PowerAcquisitionOptions } from '@/services/characters.types';

interface BibliotecaAdicionarPoderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcquirePower: (powerId: string, acquisition?: PowerAcquisitionOptions) => Promise<void>;
  onAcquirePowerArray: (powerArrayId: string, acquisition?: PowerAcquisitionOptions) => Promise<void>;
  isProcessing: boolean;
}

export function BibliotecaAdicionarPoderModal({
  isOpen,
  onClose,
  onAcquirePower,
  onAcquirePowerArray,
  isProcessing
}: BibliotecaAdicionarPoderModalProps) {
  const { poderes, loading: loadingPoderes } = usePoderes();
  const { acervos, loading: loadingAcervos } = usePowerArrays();
  
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'tudo' | 'poder' | 'acervo'>('tudo');
  const [isFreeAcquisition, setIsFreeAcquisition] = useState(false);
  const [acquisitionNote, setAcquisitionNote] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setIsFreeAcquisition(false);
      setAcquisitionNote('');
    }
  }, [isOpen]);

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    
    const poderesMapeados = poderes.map(p => ({ ...p, tipoItem: 'poder' as const }));
    const acervosMapeados = acervos.map(a => ({ ...a, tipoItem: 'acervo' as const }));
    
    let todos = [...poderesMapeados, ...acervosMapeados];
    
    if (filtro === 'poder') todos = poderesMapeados;
    if (filtro === 'acervo') todos = acervosMapeados;

    if (!termo) return todos.sort((a, b) => a.nome.localeCompare(b.nome));

    return todos.filter(item => 
      item.nome.toLowerCase().includes(termo) || 
      item.descricao.toLowerCase().includes(termo)
    ).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [poderes, acervos, busca, filtro]);

  const handleAcquire = async (item: any) => {
    const acquisition = isFreeAcquisition
      ? { isFreeAcquisition: true, acquisitionNote: acquisitionNote.trim() || undefined }
      : undefined;
    if (item.tipoItem === 'poder') {
      await onAcquirePower(item.id, acquisition);
    } else {
      await onAcquirePowerArray(item.id, acquisition);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar da Biblioteca" size="xl">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar poderes e acervos..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant={filtro === 'tudo' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setFiltro('tudo')}
              className={filtro === 'tudo' ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              Tudo
            </Button>
            <Button 
              variant={filtro === 'poder' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setFiltro('poder')}
              className={filtro === 'poder' ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              Poderes
            </Button>
            <Button 
              variant={filtro === 'acervo' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setFiltro('acervo')}
              className={filtro === 'acervo' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
            >
              Acervos
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-amber-300/50 bg-amber-50/60 p-3 dark:border-amber-800/60 dark:bg-amber-950/20">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={isFreeAcquisition}
              onChange={(event) => setIsFreeAcquisition(event.target.checked)}
              className="mt-1 h-4 w-4 accent-amber-500"
            />
            <span>
              <span className="block text-sm font-bold text-amber-900 dark:text-amber-200">Aquisição gratuita / narrativa</span>
              <span className="block text-xs text-amber-800/70 dark:text-amber-300/70">Não consome PdA. Use para recompensas de campanha, treinamentos ou concessões do mestre.</span>
            </span>
          </label>
          {isFreeAcquisition && (
            <Input
              value={acquisitionNote}
              onChange={(event) => setAcquisitionNote(event.target.value.slice(0, 300))}
              placeholder="Origem opcional (ex.: treinamento com Mestre Aldren)"
              className="mt-3"
            />
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {(loadingPoderes || loadingAcervos) ? (
            <div className="py-8 text-center text-gray-500">Carregando biblioteca...</div>
          ) : itensFiltrados.length === 0 ? (
            <div className="py-8 text-center text-gray-500 flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-gray-300" />
              <p>Nenhum item encontrado.</p>
            </div>
          ) : (
            itensFiltrados.map((item) => (
              <div
                key={`${item.tipoItem}-${item.id}`}
                className={`flex items-start justify-between gap-4 p-3 rounded-xl border transition-all ${
                  item.tipoItem === 'poder' 
                    ? 'bg-purple-50/30 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700'
                    : 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center border overflow-hidden ${
                    item.tipoItem === 'poder'
                      ? 'bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 text-purple-500'
                      : 'bg-white dark:bg-gray-900 border-indigo-200 dark:border-indigo-800 text-indigo-500'
                  }`}>
                    {item.icone ? (
                      <DynamicIcon name={item.icone} className="w-full h-full object-cover" />
                    ) : item.tipoItem === 'poder' ? (
                      <Zap className="w-6 h-6" />
                    ) : (
                      <Layers className="w-6 h-6" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                        {item.nome}
                      </h4>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border-none ${
                        item.tipoItem === 'poder' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                      }`}>
                        {item.tipoItem.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                      {item.descricao}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-gray-500">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {item.custoTotal.pda} PdA
                      </span>
                      <span>•</span>
                      <span>{item.custoTotal.espacos} Espaços</span>
                      <span>•</span>
                      <span className="uppercase">{item.dominio.name}</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  onClick={() => handleAcquire(item)}
                  loading={isProcessing}
                  className={`shrink-0 h-9 px-3 ${
                    item.tipoItem === 'poder'
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isFreeAcquisition ? 'Adicionar grátis' : 'Adicionar'}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
