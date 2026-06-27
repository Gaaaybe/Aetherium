import { useState, useEffect, useRef } from 'react';
import { CharacterResponse, SyncCharacterData } from '@/services/characters.types';
import { Badge, Button, DynamicIcon, Modal, Input, ModalFooter } from '@/shared/ui';
import { User, Settings, Shield, MoreHorizontal, Camera, Sparkles, Save, X, Edit2, ArrowUpCircle, Dices, Moon } from 'lucide-react';
import { FreeDiceRollerModal } from '@/shared/components/FreeDiceRollerModal';

interface CharacterHeaderProps {
  character: CharacterResponse;
  onSync: (data: SyncCharacterData) => Promise<void>;
  onLevelUp: () => void;
  onOpenRest: () => void;
}

export function CharacterHeader({ character, onSync, onLevelUp, onOpenRest }: CharacterHeaderProps) {
  // Estados para Modais
  const [isArtModalOpen, setIsArtModalOpen] = useState(false);
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  // Estados para Edição de Nome
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(character.narrative.identity);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [localLevel, setLocalLevel] = useState(character.level.toString());

  useEffect(() => {
    setLocalLevel(character.level.toString());
  }, [character.level]);

  const handleLevelBlur = async () => {
    const parsed = parseInt(localLevel);
    if (isNaN(parsed) || parsed < 1 || parsed > 250) {
      setLocalLevel(character.level.toString());
      return;
    }
    
    if (parsed === character.level) return;

    try {
      await onSync({ level: parsed });
    } catch (e) {
      setLocalLevel(character.level.toString());
    }
  };

  const handleSaveName = async () => {
    if (tempName.trim() && tempName !== character.narrative.identity) {
      await onSync({ narrative: { ...character.narrative, identity: tempName } });
    } else {
      setTempName(character.narrative.identity);
    }
    setIsEditingName(false);
  };

  const openArtModal = () => {
    setTempUrl(character.art || '');
    setIsArtModalOpen(true);
  };

  const openSymbolModal = () => {
    setTempUrl(character.symbol || '');
    setIsSymbolModalOpen(true);
  };

  const handleSyncArt = async () => {
    await onSync({ art: tempUrl || null });
    setIsArtModalOpen(false);
  };

  const handleSyncSymbol = async () => {
    await onSync({ symbol: tempUrl || null });
    setIsSymbolModalOpen(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-none lg:rounded-lg shadow-sm border-b lg:border border-gray-200 dark:border-gray-800 p-3 md:p-6 transition-all duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 lg:gap-6">
        <div className="flex items-center gap-4 lg:gap-6 w-full md:w-auto">
          {/* Avatar com Edição */}
          <div className="relative group shrink-0">
            <div 
              className="w-16 h-16 md:w-24 md:h-24 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-500/20 flex items-center justify-center overflow-hidden shrink-0 shadow-inner transition-transform group-hover:scale-105 cursor-pointer relative"
              onClick={openArtModal}
            >
              {character.art ? (
                <img 
                  src={character.art} 
                  alt={character.narrative.identity} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + character.narrative.identity;
                  }}
                />
              ) : (
                <User className="w-10 h-10 md:w-12 md:h-12 text-purple-400" />
              )}
              
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:-bottom-2 md:-right-2 bg-purple-600 text-white text-[10px] md:text-xs font-bold px-1.5 md:px-1.5 py-0.5 md:py-1 rounded shadow-lg border-2 border-white dark:border-gray-900 flex items-center gap-0.5 md:gap-1 group/level transition-colors whitespace-nowrap" title="Editar Nível">
              <span className="pl-0.5 md:pl-1">NV</span>
              <input 
                type="number"
                value={localLevel}
                onChange={(e) => setLocalLevel(e.target.value)}
                onBlur={handleLevelBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleLevelBlur()}
                className="w-5 md:w-8 bg-transparent border-none p-0 text-center font-bold focus:ring-0 focus:outline-none focus:bg-purple-700/50 rounded"
              />
              <ArrowUpCircle 
                className="w-3.5 h-3.5 opacity-80 hover:opacity-100 cursor-pointer text-white" 
                onClick={onLevelUp}
              />
            </div>
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-3 group/name w-full">
              {/* Símbolo do Personagem (URL de imagem) */}
              <div 
                className="w-8 h-8 md:w-10 md:h-10 shrink-0 hover:scale-110 transition-transform cursor-pointer relative group/symbol"
                onClick={openSymbolModal}
                title="Mudar Símbolo"
              >
                {character.symbol ? (
                  <DynamicIcon name={character.symbol} className="w-full h-full text-purple-500" />
                ) : (
                  <div className="w-full h-full rounded border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-purple-500 hover:border-purple-500 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Nome Editável In-place */}
              {isEditingName ? (
                <div className="flex items-center gap-1.5 flex-1 min-w-0 animate-in fade-in duration-200">
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="text-xl md:text-3xl font-black bg-gray-100 dark:bg-gray-800 border-none rounded px-2 py-0.5 w-full focus:ring-2 focus:ring-purple-500 outline-none truncate"
                  />
                  <div className="flex shrink-0">
                    <button onClick={handleSaveName} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                      <Save className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button onClick={() => { setIsEditingName(false); setTempName(character.narrative.identity); }} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                      <X className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <h1 
                  className="text-lg md:text-3xl font-black text-gray-900 dark:text-white tracking-tight cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 rounded -ml-2 transition-colors flex items-center gap-2 group/text truncate"
                  onClick={() => setIsEditingName(true)}
                >
                  <span className="truncate">{character.narrative.identity}</span>
                  <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover/text:opacity-100 transition-opacity shrink-0" />
                </h1>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-y-2 gap-x-2 md:gap-x-3 mt-1">
              <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 w-full sm:w-auto">
                {character.narrative.origin}
              </span>
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                <Badge variant="default" className="bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 whitespace-nowrap px-1.5 md:px-2.5">
                  Rank {character.calamityRank}
                </Badge>
                <Badge variant="default" className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 whitespace-nowrap px-1.5 md:px-2.5">
                  {character.spiritualPrinciple.stage === 'DIVINE' ? 'Desperto' : 'Mortal'}
                </Badge>
                
                <div className="flex items-center gap-1.5 px-1.5 md:px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold whitespace-nowrap">
                  <Shield className="w-3 h-3" />
                  <span className="hidden sm:inline">Eficiência</span> +{character.efficiencyBonus}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 dark:border-gray-800 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsDiceModalOpen(true)}
            className="flex items-center gap-2 h-9 md:h-10 px-3 md:px-4 rounded-lg shrink-0 border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 transition-all"
          >
            <Dices className="w-4 h-4" />
            <span className="text-sm font-bold">Dados</span>
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenRest}
            className="flex items-center gap-2 h-9 md:h-10 px-3 md:px-4 rounded-lg shrink-0 border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 hover:bg-purple-100 transition-all"
          >
            <Moon className="w-4 h-4" />
            <span className="text-sm font-bold">Descansar</span>
          </Button>

          <Button variant="outline" size="sm" className="flex items-center gap-2 h-9 md:h-10 px-3 md:px-4 rounded-lg shrink-0">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm">Bônus Ativos</span>
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-9 w-9 md:h-10 md:w-10 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <Settings className="w-5 h-5 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 md:h-10 md:w-10 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>

      {/* Diceroller Livre */}
      <FreeDiceRollerModal 
        isOpen={isDiceModalOpen} 
        onClose={() => setIsDiceModalOpen(false)} 
      />

      {/* Modais de Edição */}
      <Modal isOpen={isArtModalOpen} onClose={() => setIsArtModalOpen(false)} title="Editar Arte do Personagem">
        <div className="space-y-4 py-4">
          <Input 
            label="URL da Imagem" 
            placeholder="https://..." 
            value={tempUrl} 
            onChange={(e) => setTempUrl(e.target.value)}
          />
          {tempUrl && (
            <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden border-2 border-purple-500">
              <img src={tempUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsArtModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSyncArt}>Salvar Arte</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={isSymbolModalOpen} onClose={() => setIsSymbolModalOpen(false)} title="Editar Símbolo do Personagem">
        <div className="space-y-4 py-4">
          <Input 
            label="URL do Ícone/Símbolo" 
            placeholder="https://..." 
            value={tempUrl} 
            onChange={(e) => setTempUrl(e.target.value)}
          />
          {tempUrl && (
            <div className="w-16 h-16 mx-auto flex items-center justify-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border-2 border-purple-500">
              <DynamicIcon name={tempUrl} className="w-full h-full" />
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsSymbolModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSyncSymbol}>Salvar Símbolo</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
