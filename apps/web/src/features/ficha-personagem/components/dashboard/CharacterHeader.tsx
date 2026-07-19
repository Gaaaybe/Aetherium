import { useState, useEffect, useRef } from 'react';
import { CharacterResponse, SyncCharacterData } from '@/services/characters.types';
import { Badge, Button, DynamicIcon, Modal, Input, ModalFooter, toast } from '@/shared/ui';
import { User, Settings, Shield, MoreHorizontal, Camera, Save, X, Edit2, ArrowUpCircle, Dices, Moon, Skull } from 'lucide-react';
import { FreeDiceRollerModal } from '@/shared/components/FreeDiceRollerModal';
import { FichaPropertiesModal } from './FichaPropertiesModal';
import { DeathTheme } from '../../hooks/useDeathTheme';

export const parseArtUrl = (url: string | null) => {
  if (!url) return { cleanUrl: '', zoom: 1, x: 0, y: 0 };
  const hashIndex = url.indexOf('#crop=');
  if (hashIndex === -1) {
    return { cleanUrl: url, zoom: 1, x: 0, y: 0 };
  }
  const cleanUrl = url.substring(0, hashIndex);
  const cropStr = url.substring(hashIndex + 6);
  const [zoomStr, xStr, yStr] = cropStr.split(',');
  return {
    cleanUrl,
    zoom: parseFloat(zoomStr) || 1,
    x: parseFloat(xStr) || 0,
    y: parseFloat(yStr) || 0,
  };
};

export function CroppedImage({ src, alt, className, style, onError }: { src: string, alt: string, className?: string, style?: React.CSSProperties, onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void }) {
  const [aspectRatio, setAspectRatio] = useState(1);
  const { cleanUrl, zoom, x, y } = parseArtUrl(src);

  return (
    <div className={`relative overflow-hidden w-full h-full ${className || ''}`} style={style}>
      <img
        src={cleanUrl}
        alt={alt}
        className="absolute pointer-events-none select-none max-w-none max-h-none origin-center"
        style={{
          width: aspectRatio > 1 ? 'auto' : '100%',
          height: aspectRatio > 1 ? '100%' : 'auto',
          left: `calc(50% + ${x}%)`,
          top: `calc(50% + ${y}%)`,
          transform: `translate(-50%, -50%) scale(${zoom})`,
        }}
        onLoad={(e) => setAspectRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
        onError={onError}
      />
    </div>
  );
}

interface CharacterHeaderProps {
  character: CharacterResponse;
  onSync: (data: SyncCharacterData) => Promise<void>;
  onLevelUp: () => void;
  onOpenRest: () => void;
  deathTheme: DeathTheme;
}

export function CharacterHeader({ character, onSync, onLevelUp, onOpenRest, deathTheme }: CharacterHeaderProps) {
  // Estados para Modais
  const [isArtModalOpen, setIsArtModalOpen] = useState(false);
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
  const [isPropertiesModalOpen, setIsPropertiesModalOpen] = useState(false);
  const [isSavingProperties, setIsSavingProperties] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  // Estados para Enquadramento de Arte
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSavingArt, setIsSavingArt] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);
  const dragStart = useRef({ x: 0, y: 0 });

  // Estados para Edição de Nome e Identidade
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(character.narrative.name || character.narrative.identity);
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  
  const hasDistinctIdentity = character.narrative.name && character.narrative.name !== character.narrative.identity;
  const [tempIdentity, setTempIdentity] = useState(hasDistinctIdentity ? character.narrative.identity : '');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTempName(character.narrative.name || character.narrative.identity);
  }, [character.narrative.name, character.narrative.identity]);

  useEffect(() => {
    const hasIdent = character.narrative.name && character.narrative.name !== character.narrative.identity;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTempIdentity(hasIdent ? character.narrative.identity : '');
  }, [character.narrative.name, character.narrative.identity]);

  const [localLevel, setLocalLevel] = useState(character.level.toString());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    } catch {
      setLocalLevel(character.level.toString());
    }
  };

  const handleSaveName = async () => {
    const currentName = character.narrative.name || character.narrative.identity;
    if (tempName.trim() && tempName !== currentName) {
      await onSync({ narrative: { name: tempName } });
    } else {
      setTempName(currentName);
    }
    setIsEditingName(false);
  };

  const handleSaveIdentity = async () => {
    if (tempIdentity !== character.narrative.identity) {
      await onSync({ narrative: { identity: tempIdentity } });
    } else {
      setTempIdentity(character.narrative.identity);
    }
    setIsEditingIdentity(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.current.x,
      y: e.touches[0].clientY - dragStart.current.y,
    });
  };

  const openArtModal = () => {
    const { cleanUrl, zoom: savedZoom, x: savedX, y: savedY } = parseArtUrl(character.art);
    setTempUrl(cleanUrl);
    setZoom(savedZoom);
    setAspectRatio(1);
    // Convert back from percentages to pixels based on 192px crop box
    setPosition({
      x: (savedX / 100) * 192,
      y: (savedY / 100) * 192,
    });
    setIsArtModalOpen(true);
  };

  const openSymbolModal = () => {
    setTempUrl(character.symbol || '');
    setIsSymbolModalOpen(true);
  };

  const handleSyncArt = async () => {
    if (!tempUrl) {
      await onSync({ art: null });
      setIsArtModalOpen(false);
      return;
    }

    setIsSavingArt(true);
    try {
      const hashIndex = tempUrl.indexOf('#crop=');
      const cleanUrl = hashIndex === -1 ? tempUrl : tempUrl.substring(0, hashIndex);

      // Convert position from pixels to percentages of 192px crop box
      const pctX = (position.x / 192) * 100;
      const pctY = (position.y / 192) * 100;

      const croppedUrl = `${cleanUrl}#crop=${zoom},${pctX.toFixed(2)},${pctY.toFixed(2)}`;
      
      await onSync({ art: croppedUrl });
      setIsArtModalOpen(false);
    } catch {
      toast.error('Erro ao salvar arte.');
    } finally {
      setIsSavingArt(false);
    }
  };

  const handleSyncSymbol = async () => {
    await onSync({ symbol: tempUrl || null });
    setIsSymbolModalOpen(false);
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-none lg:rounded-lg shadow-sm border-b lg:border transition-all duration-700 p-3 md:p-6 ${deathTheme.headerClass || 'border-gray-200 dark:border-gray-800'}`}>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 lg:gap-6">
        <div className="flex items-center gap-4 lg:gap-6 w-full md:w-auto">
          {/* Avatar com Edição */}
          <div className="relative group shrink-0">
            <div 
              className={`w-16 h-16 md:w-24 md:h-24 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 flex items-center justify-center overflow-hidden shrink-0 shadow-inner transition-all duration-700 group-hover:scale-105 cursor-pointer relative ${deathTheme.avatarBorderClass}`}
              onClick={openArtModal}
            >
              {character.art ? (
                <CroppedImage 
                  src={character.art} 
                  alt={character.narrative.name || character.narrative.identity} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (character.narrative.name || character.narrative.identity);
                  }}
                />
              ) : (
                <User className="w-10 h-10 md:w-12 md:h-12 text-purple-400" />
              )}
              
              {/* Death overlay */}
              {deathTheme.showDeadOverlay && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 animate-in fade-in duration-700">
                  <Skull className="w-8 h-8 text-gray-300" />
                </div>
              )}

              {/* Hover overlay — only when not dead */}
              {!deathTheme.showDeadOverlay && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
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
                    <button onClick={() => { setIsEditingName(false); setTempName(character.narrative.name || character.narrative.identity); }} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                      <X className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <h1 
                  className="text-lg md:text-3xl font-black text-gray-900 dark:text-white tracking-tight cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 rounded -ml-2 transition-colors flex items-center gap-2 group/text truncate"
                  onClick={() => setIsEditingName(true)}
                >
                  <span className="truncate">{character.narrative.name || character.narrative.identity}</span>
                  <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover/text:opacity-100 transition-opacity shrink-0" />
                </h1>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-y-2 gap-x-2 md:gap-x-3 mt-1">
              {/* Death state badge */}
              {deathTheme.badgeLabel && (
                <Badge
                  variant="outline"
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border transition-all duration-700 ${deathTheme.badgeClass}`}
                >
                  {deathTheme.badgeLabel}
                </Badge>
              )}
              {isEditingIdentity ? (
                <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                  <input
                    type="text"
                    value={tempIdentity}
                    onChange={(e) => setTempIdentity(e.target.value)}
                    onBlur={handleSaveIdentity}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveIdentity()}
                    className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-none rounded px-2 py-0.5 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Identidade (Ex: Detetive Paranormal)"
                    autoFocus
                  />
                  <div className="flex shrink-0">
                    <button onClick={handleSaveIdentity} className="p-0.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setIsEditingIdentity(false); setTempIdentity(character.narrative.identity); }} className="p-0.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <span 
                  className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 py-0.5 rounded transition-colors flex items-center gap-1 group/ident w-full sm:w-auto"
                  onClick={() => setIsEditingIdentity(true)}
                  title="Editar Identidade"
                >
                  <span className="truncate">
                    {(character.narrative.name !== character.narrative.identity && character.narrative.identity) || (
                      <span className="italic opacity-60">Sem Identidade</span>
                    )}
                  </span>
                  <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover/ident:opacity-100 transition-opacity shrink-0" />
                </span>
              )}
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                <Badge variant="default" className="bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 whitespace-nowrap px-1.5 md:px-2.5">
                  Rank {character.calamityRank}
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

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPropertiesModalOpen(true)}
              className="h-9 w-9 md:h-10 md:w-10 !p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Propriedades da Ficha"
            >
              <Settings className="w-4 h-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 md:h-10 md:w-10 !p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Actions Row */}
      <div className="flex lg:hidden items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 overflow-x-auto no-scrollbar">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsDiceModalOpen(true)}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg shrink-0 border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400 text-xs font-bold"
        >
          <Dices className="w-3.5 h-3.5" />
          <span>Dados</span>
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={onOpenRest}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg shrink-0 border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 text-xs font-bold"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Descansar</span>
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsPropertiesModalOpen(true)}
          className="h-8 w-8 !p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ml-auto shrink-0"
          title="Propriedades da Ficha"
        >
          <Settings className="w-4 h-4 text-gray-500" />
        </Button>
      </div>

      {/* Diceroller Livre */}
      <FreeDiceRollerModal 
        isOpen={isDiceModalOpen} 
        onClose={() => setIsDiceModalOpen(false)} 
      />

      {/* Propriedades da Ficha */}
      <FichaPropertiesModal
        isOpen={isPropertiesModalOpen}
        onClose={() => setIsPropertiesModalOpen(false)}
        character={character}
        onSync={async (data) => {
          setIsSavingProperties(true);
          try {
            await onSync(data);
          } finally {
            setIsSavingProperties(false);
          }
        }}
        isProcessing={isSavingProperties}
      />

      {/* Modais de Edição */}
      <Modal isOpen={isArtModalOpen} onClose={() => setIsArtModalOpen(false)} title="Editar Arte do Personagem">
        <div className="space-y-4 py-4">
          <Input 
            label="URL da Imagem de Referência" 
            placeholder="https://..." 
            value={tempUrl} 
            onChange={(e) => {
              setTempUrl(e.target.value);
              setZoom(1);
              setPosition({ x: 0, y: 0 });
              setAspectRatio(1);
            }}
          />

          {tempUrl && (
            <div className="space-y-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Arraste a imagem para enquadrar e use o controle de zoom abaixo.
              </div>
              
              <div 
                className="w-48 h-48 mx-auto relative overflow-hidden rounded-lg border-2 border-purple-500 cursor-move bg-gray-100 dark:bg-gray-800 shadow-inner select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <img
                  src={tempUrl}
                  alt="Preview"
                  className="absolute pointer-events-none select-none max-w-none max-h-none origin-center"
                  style={{
                    width: aspectRatio > 1 ? 'auto' : '100%',
                    height: aspectRatio > 1 ? '100%' : 'auto',
                    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
                    left: '50%',
                    top: '50%',
                  }}
                  onLoad={(e) => setAspectRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
                />
              </div>

              <div className="space-y-1 max-w-xs mx-auto">
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                  <span>Zoom</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="4" 
                  step="0.05"
                  value={zoom} 
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
              
              <p className="text-[10px] text-gray-400 text-center max-w-xs mx-auto">
                Nota: As coordenadas de enquadramento serão salvas diretamente na URL da imagem de referência.
              </p>
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsArtModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSyncArt} loading={isSavingArt}>Salvar Arte</Button>
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
