import { useState, useMemo, useEffect } from 'react';
import { User, Trash2, ShieldAlert, Sparkles, LayoutDashboard, ShieldCheck, BookOpen, Zap, Edit3, Sword, Layers, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, EmptyState, Badge, ConfirmDialog, Input, DynamicIcon, toast } from '@/shared/ui';
import { useAdminCharacters } from '../features/ficha-personagem/hooks/useAdminCharacters';
import { useAdminPowers } from '../features/ficha-personagem/hooks/useAdminPowers';
import { useAdminItems } from '../features/ficha-personagem/hooks/useAdminItems';
import { useAdminPowerArrays } from '../features/ficha-personagem/hooks/useAdminPowerArrays';
import { useAdminPeculiarities } from '../features/ficha-personagem/hooks/useAdminPeculiarities';
import { CroppedImage } from '../features/ficha-personagem/components/dashboard/CharacterHeader';
import { ResumoPoder } from '../features/criador-de-poder/components/ResumoPoder';
import { ResumoItem } from '../features/criador-de-item/components/ResumoItem';
import { ResumoVinculoModal } from '../features/criador-de-item/components/ResumoVinculoModal';
import { CriadorDeItemModal } from '../features/criador-de-item/components/CriadorDeItemModal';
import { CriadorAcervo } from '../features/criador-de-poder/components/CriadorAcervo';
import { ResumoAcervo } from '../features/criador-de-poder/components/ResumoAcervo';
import { ResumoPeculiaridade } from '../features/criador-de-poder/components/ResumoPeculiaridade';
import { FormPeculiaridadeCustomizada } from '../features/criador-de-poder/components/FormPeculiaridadeCustomizada';
import { updatePeculiarity } from '../services/peculiarities.service';
import { exportItem } from '../services/items.service';
import { poderResponseToPoder, acervoResponseToAcervo } from '../features/criador-de-poder/utils/poderApiConverter';
import { calcularDetalhesPoder } from '../features/criador-de-poder/regras/calculadoraCusto';
import { useCatalog } from '../context/useCatalog';
import { getThemeByDomain, getThemeByItemType, PatternOverlay } from '../shared/utils/summary-themes';
import { MarkdownText } from '../shared/components';
import { CriadorDePoderModal } from '../features/gerenciador-criaturas/components/CriadorDePoderModal';
import { getPowerById } from '../services/powers.service';
import { getPowerArrayById } from '../services/powerArrays.service';
import type { PoderResponse, ItemResponse, AcervoResponse, PeculiaridadeResponse } from '../services/types';

function CardPoderAdmin({
  power,
  onPromote,
  onDelete,
  onEdit,
  onVerResumo,
  onExport,
}: {
  power: PoderResponse;
  onPromote: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onVerResumo: () => void;
  onExport: () => void;
}) {
  const theme = getThemeByDomain(power.dominio.name);

  return (
    <Card 
      hover 
      padding="none"
      className="flex flex-row overflow-hidden transition-all duration-300 border-l-4 border-purple-500/50 min-h-[180px] h-auto shadow-xl"
    >
      <div 
        className={`w-24 relative flex-shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br ${theme.bgGradient} bg-opacity-10 cursor-pointer group`}
        onClick={onVerResumo}
      >
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-0" />
        <PatternOverlay pattern={theme.pattern} />
        {power.icone ? (
          <img
            src={power.icone}
            alt={power.nome}
            className="w-16 h-16 rounded-xl object-cover shadow-2xl z-10 border border-white/20 transition-transform group-hover:scale-110"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center z-10 border border-white/20 shadow-2xl transition-transform group-hover:scale-110">
             <Zap className="w-8 h-8 text-white opacity-80" />
          </div>
        )}
      </div>

      <CardContent className="p-5 flex flex-col justify-between flex-1 min-w-0 relative">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onVerResumo}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-gray-950 dark:text-gray-50 truncate text-xl leading-tight">
              {power.nome}
            </h3>
            <Badge variant="secondary" size="sm" className="shrink-0 text-[10px] font-black bg-slate-100 dark:bg-slate-800">
              {power.custoTotal.pda} PdA
            </Badge>
          </div>
          
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-900/10 dark:bg-white/10 ${theme.accentColor}`}>
                {power.dominio.name}
              </span>
              {power.userName && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium italic">
                  por {power.userName}
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 max-h-[72px] overflow-hidden leading-relaxed">
            <MarkdownText>{power.descricao}</MarkdownText>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2.5 shrink-0">
             <div className="flex flex-col">
               <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Efeitos</span>
               <span className="text-sm font-black text-gray-700 dark:text-gray-300 leading-none">{power.effects.length}</span>
             </div>
             {power.custoTotal.pe > 0 && (
               <div className="flex flex-col border-l border-gray-100 dark:border-gray-800 pl-2.5">
                 <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Custo</span>
                 <span className="text-sm font-black text-purple-600 dark:text-purple-400 leading-none">{power.custoTotal.pe} PE</span>
               </div>
             )}
          </div>
          
          <div className="flex flex-wrap gap-1.5 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onExport(); }}
              className="h-8 px-2.5 text-[10px] font-black active:scale-95 transition-all uppercase tracking-wider text-green-500 hover:text-green-600 border-green-500/20 hover:bg-green-500/5 dark:border-green-900/30 flex items-center justify-center gap-1"
              title="Exportar JSON"
            >
              <Download className="w-3.5 h-3.5" /> Exportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-8 px-2.5 text-[10px] font-black active:scale-95 transition-all uppercase tracking-wider text-blue-500 hover:text-blue-600 border-blue-500/20 hover:bg-blue-500/5 dark:border-blue-900/30 flex items-center justify-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Editar
            </Button>
            {power.userId && (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onPromote(); }}
                className="h-8 px-2.5 text-[10px] font-black shadow-lg shadow-purple-500/20 active:scale-95 transition-all uppercase tracking-wider bg-amber-600 hover:bg-amber-700 border-none flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-3 h-3" /> Oficializar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-8 px-2.5 text-[10px] font-black active:scale-95 transition-all uppercase tracking-wider text-red-500 hover:text-red-600 border-red-500/20 hover:bg-red-500/5 dark:border-red-900/30 flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CardItemAdmin({
  item,
  onPromote,
  onDelete,
  onEdit,
  onVerResumo,
  onExport,
}: {
  item: ItemResponse;
  onPromote: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onVerResumo: () => void;
  onExport: () => void;
}) {
  const theme = getThemeByItemType(item.tipo);
  
  const tipoLabel: Record<ItemResponse['tipo'], string> = {
    weapon: 'Arma',
    'defensive-equipment': 'Equipam. Defensivo',
    consumable: 'Consumível',
    artifact: 'Artefato',
    accessory: 'Acessório',
    general: 'Geral',
    'upgrade-material': 'Mat. Upgrade',
  };

  return (
    <Card 
      hover 
      padding="none"
      className="flex flex-row overflow-hidden transition-all duration-300 border-l-4 border-blue-500/50 min-h-[180px] h-auto shadow-xl"
    >
      <div 
        className={`w-24 relative flex-shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br ${theme.bgGradient} bg-opacity-10 cursor-pointer group`}
        onClick={onVerResumo}
      >
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-0" />
        <PatternOverlay pattern={theme.pattern} />
        {item.icone ? (
          <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm shadow-2xl z-10 border border-white/20 overflow-hidden transition-transform group-hover:scale-110">
             <DynamicIcon name={item.icone} className="w-full h-full p-2 text-white" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center z-10 border border-white/20 shadow-2xl transition-transform group-hover:scale-110">
             <Sword className="w-8 h-8 text-white opacity-80" />
          </div>
        )}
      </div>

      <CardContent className="p-5 flex flex-col justify-between flex-1 min-w-0 relative">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onVerResumo}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-gray-950 dark:text-gray-50 truncate text-xl leading-tight">
              {item.nome}
            </h3>
            <Badge variant="secondary" size="sm" className="shrink-0 text-[10px] font-black bg-slate-100 dark:bg-slate-800">
               {item.precoVenda}R
            </Badge>
          </div>
          
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-900/10 dark:bg-white/10 ${theme.accentColor}`}>
                 {tipoLabel[item.tipo]} · NV {item.nivelItem}
              </span>
              {item.userName && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium italic">
                  por {item.userName}
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 max-h-[72px] overflow-hidden leading-relaxed">
            <MarkdownText>{item.descricao}</MarkdownText>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2.5 shrink-0">
             <div className="flex flex-col">
               <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Vínculos</span>
               <span className="text-sm font-black text-gray-700 dark:text-gray-300 leading-none">
                 {(item.powerIds || []).length + (item.powerArrayIds || []).length}
               </span>
             </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onExport(); }}
              className="h-8 px-2.5 text-[10px] font-black active:scale-95 transition-all uppercase tracking-wider text-green-500 hover:text-green-600 border-green-500/20 hover:bg-green-500/5 dark:border-green-900/30 flex items-center justify-center gap-1"
              title="Exportar JSON"
            >
              <Download className="w-3.5 h-3.5" /> Exportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-8 px-2.5 text-[10px] font-black active:scale-95 transition-all uppercase tracking-wider text-blue-500 hover:text-blue-600 border-blue-500/20 hover:bg-blue-500/5 dark:border-blue-900/30 flex items-center justify-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Editar
            </Button>
            {item.userId && (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onPromote(); }}
                className="h-8 px-2.5 text-[10px] font-black shadow-lg shadow-purple-500/20 active:scale-95 transition-all uppercase tracking-wider bg-amber-600 hover:bg-amber-700 border-none flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-3 h-3" /> Oficializar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-8 px-2.5 text-[10px] font-black active:scale-95 transition-all uppercase tracking-wider text-red-500 hover:text-red-600 border-red-500/20 hover:bg-red-500/5 dark:border-red-900/30 flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
function CardAcervoAdmin({
  array,
  onPromote,
  onDelete,
  onEdit,
  onVerResumo,
}: {
  array: AcervoResponse;
  onPromote: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onVerResumo: () => void;
}) {
  const theme = getThemeByDomain(array.dominio.name);

  return (
    <Card 
      hover 
      padding="none"
      className="flex flex-row overflow-hidden transition-all duration-300 border-l-4 border-indigo-500/50 min-h-[180px] h-auto shadow-xl"
    >
      <div 
        className={`w-24 relative flex-shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br ${theme.bgGradient} bg-opacity-10 cursor-pointer group`}
        onClick={onVerResumo}
      >
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-0" />
        <PatternOverlay pattern={theme.pattern} />
        {array.icone ? (
          <img
            src={array.icone}
            alt={array.nome}
            className="w-16 h-16 rounded-xl object-cover shadow-2xl z-10 border border-white/20 transition-transform group-hover:scale-110"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center z-10 border border-white/20 shadow-2xl transition-transform group-hover:scale-110">
             <Layers className="w-8 h-8 text-white opacity-80" />
          </div>
        )}
      </div>

      <CardContent className="p-5 flex flex-col justify-between flex-1 min-w-0 relative">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onVerResumo}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-gray-950 dark:text-gray-50 truncate text-xl leading-tight">
              {array.nome}
            </h3>
            <Badge variant="secondary" size="sm" className="shrink-0 text-[10px] font-black bg-slate-100 dark:bg-slate-800">
              {array.custoTotal.pda} PdA
            </Badge>
          </div>
          
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-900/10 dark:bg-white/10 ${theme.accentColor}`}>
                {array.dominio.name}
              </span>
              {array.userName && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium italic">
                  por {array.userName}
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 max-h-[72px] overflow-hidden leading-relaxed">
            <MarkdownText>{array.descricao}</MarkdownText>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2.5 shrink-0">
             <div className="flex flex-col">
               <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Poderes</span>
               <span className="text-sm font-black text-gray-700 dark:text-gray-300 leading-none">
                 {(array.powers || []).length}
               </span>
             </div>
             {array.custoTotal.pe > 0 && (
               <div className="flex flex-col border-l border-gray-100 dark:border-gray-800 pl-2.5">
                 <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Custo</span>
                 <span className="text-sm font-black text-purple-600 dark:text-purple-400 leading-none">{array.custoTotal.pe} PE</span>
               </div>
             )}
          </div>
          
          <div className="flex flex-wrap gap-1.5 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-8 px-2.5 text-[10px] font-black active:scale-95 transition-all uppercase tracking-wider text-blue-500 hover:text-blue-600 border-blue-500/20 hover:bg-blue-500/5 dark:border-blue-900/30 flex items-center justify-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Editar
            </Button>
            {array.userId && (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onPromote(); }}
                className="h-8 px-2.5 text-[10px] font-black shadow-lg shadow-purple-500/20 active:scale-95 transition-all uppercase tracking-wider bg-amber-600 hover:bg-amber-700 border-none flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-3 h-3" /> Oficializar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-8 px-2.5 text-[10px] font-black active:scale-95 transition-all uppercase tracking-wider text-red-500 hover:text-red-600 border-red-500/20 hover:bg-red-500/5 dark:border-red-900/30 flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
function CardPeculiarityAdmin({
  peculiarity,
  onPromote,
  onDelete,
  onEdit,
  onVerResumo,
}: {
  peculiarity: PeculiaridadeResponse;
  onPromote: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onVerResumo: () => void;
}) {
  return (
    <Card 
      hover 
      padding="none"
      className="flex flex-row overflow-hidden transition-all duration-300 border-l-4 border-emerald-500/50 min-h-[150px] h-auto shadow-xl"
    >
      <div 
        className="w-24 relative flex-shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-500/20 to-teal-500/20 cursor-pointer group"
        onClick={onVerResumo}
      >
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-0" />
        {peculiarity.icone ? (
          <DynamicIcon
            name={peculiarity.icone}
            className="w-10 h-10 text-emerald-600 dark:text-emerald-400 z-10 transition-transform group-hover:scale-110"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center z-10 border border-white/20 shadow-2xl transition-transform group-hover:scale-110">
             <Sparkles className="w-8 h-8 text-white opacity-80" />
          </div>
        )}
      </div>

      <CardContent className="p-5 flex flex-col justify-between flex-1 min-w-0 relative">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onVerResumo}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-gray-950 dark:text-gray-50 truncate text-xl leading-tight">
              {peculiarity.nome}
            </h3>
            <Badge variant="secondary" size="sm" className="shrink-0 text-[10px] font-black bg-slate-100 dark:bg-slate-800">
              {peculiarity.espiritual ? 'Espiritual' : 'Física'}
            </Badge>
          </div>
          
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex items-center gap-2">
              {peculiarity.userName && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium italic">
                  por {peculiarity.userName}
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 max-h-[72px] overflow-hidden leading-relaxed">
            <MarkdownText>{peculiarity.descricao}</MarkdownText>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2.5 shrink-0">
             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
               Peculiaridade
             </span>
          </div>
          
          <div className="flex flex-wrap gap-1.5 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-8 px-2.5 text-[10px] font-black active:scale-95 transition-all uppercase tracking-wider text-blue-500 hover:text-blue-600 border-blue-500/20 hover:bg-blue-500/5 dark:border-blue-900/30 flex items-center justify-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Editar
            </Button>
            {peculiarity.userId && (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onPromote(); }}
                className="h-8 px-2.5 text-[10px] font-black shadow-lg shadow-purple-500/20 active:scale-95 transition-all uppercase tracking-wider bg-amber-600 hover:bg-amber-700 border-none flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-3 h-3" /> Oficializar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-8 px-2.5 text-[10px] font-black active:scale-95 transition-all uppercase tracking-wider text-red-500 hover:text-red-600 border-red-500/20 hover:bg-red-500/5 dark:border-red-900/30 flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Excluir
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboardPage() {
  const { characters, isLoading: isLoadingChars, error: charError, deleteCharacter } = useAdminCharacters();
  const { powers, isLoading: isLoadingPowers, error: powerError, deletePower, promotePower, fetchPowers } = useAdminPowers();
  const { items, isLoading: isLoadingItems, error: itemError, deleteItem, promoteItem, fetchItems } = useAdminItems();
  const { powerArrays, isLoading: isLoadingArrays, error: arrayError, deletePowerArray, promotePowerArray, fetchPowerArrays } = useAdminPowerArrays();
  const { peculiarities, isLoading: isLoadingPeculiarities, error: peculiarityError, deletePeculiarity, promotePeculiarity, fetchPeculiarities } = useAdminPeculiarities();
  
  const { efeitos, modificacoes } = useCatalog();
  const [poderVisualizando, setPoderVisualizando] = useState<PoderResponse | null>(null);
  const [poderEditando, setPoderEditando] = useState<PoderResponse | null>(null);

  const [itemVisualizando, setItemVisualizando] = useState<ItemResponse | null>(null);
  const [itemEditando, setItemEditando] = useState<ItemResponse | null>(null);

  const [arrayVisualizando, setArrayVisualizando] = useState<AcervoResponse | null>(null);
  const [arrayEditando, setArrayEditando] = useState<AcervoResponse | null>(null);

  const [peculiarityVisualizando, setPeculiarityVisualizando] = useState<PeculiaridadeResponse | null>(null);
  const [peculiarityEditando, setPeculiarityEditando] = useState<PeculiaridadeResponse | null>(null);

  const poderVisualizandoConvertido = useMemo(() => {
    if (!poderVisualizando) return null;
    const p = poderResponseToPoder(poderVisualizando);
    const detalhes = calcularDetalhesPoder(p, efeitos, modificacoes);
    return { poder: p, detalhes };
  }, [poderVisualizando, efeitos, modificacoes]);

  const poderEditandoConvertido = useMemo(() => {
    if (!poderEditando) return undefined;
    return poderResponseToPoder(poderEditando);
  }, [poderEditando]);

  const arrayVisualizandoConvertido = useMemo(() => {
    if (!arrayVisualizando) return null;
    return acervoResponseToAcervo(arrayVisualizando);
  }, [arrayVisualizando]);

  const arrayEditandoConvertido = useMemo(() => {
    if (!arrayEditando) return undefined;
    return acervoResponseToAcervo(arrayEditando);
  }, [arrayEditando]);

  const [activeTab, setActiveTab] = useState<'characters' | 'powers' | 'items' | 'arrays' | 'peculiarities'>('characters');
  const [characterToDelete, setCharacterToDelete] = useState<string | null>(null);
  
  const [powerToDelete, setPowerToDelete] = useState<string | null>(null);
  const [powerToPromote, setPowerToPromote] = useState<string | null>(null);

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToPromote, setItemToPromote] = useState<string | null>(null);

  const [arrayToDelete, setArrayToDelete] = useState<string | null>(null);
  const [arrayToPromote, setArrayToPromote] = useState<string | null>(null);

  const [peculiarityToDelete, setPeculiarityToDelete] = useState<string | null>(null);
  const [peculiarityToPromote, setPeculiarityToPromote] = useState<string | null>(null);
  
  const [charSearch, setCharSearch] = useState('');
  const [powerSearch, setPowerSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [arraySearch, setArraySearch] = useState('');
  const [peculiaritySearch, setPeculiaritySearch] = useState('');

  const [itemPoderResumoId, setItemPoderResumoId] = useState<string | null>(null);

  const [vinculosExtras, setVinculosExtras] = useState<{ poderes: any[]; acervos: any[] }>({
    poderes: [],
    acervos: [],
  });
  const [loadingVinculos, setLoadingVinculos] = useState(false);

  const itemPoderesSelecionados = useMemo(() => {
    if (!itemVisualizando) return [];
    const publicos = powers.filter((p) => itemVisualizando.powerIds.includes(p.id));
    const extras = vinculosExtras.poderes.filter((p) => itemVisualizando.powerIds.includes(p.id));
    const ids = new Set(publicos.map(p => p.id));
    return [...publicos, ...extras.filter(p => !ids.has(p.id))];
  }, [itemVisualizando, powers, vinculosExtras.poderes]);

  const itemAcervosSelecionados = useMemo(() => {
    if (!itemVisualizando) return [];
    const extras = vinculosExtras.acervos.filter((a) => itemVisualizando.powerArrayIds.includes(a.id));
    return extras;
  }, [itemVisualizando, vinculosExtras.acervos]);

  useEffect(() => {
    if (!itemVisualizando) {
      setVinculosExtras({ poderes: [], acervos: [] });
      return;
    }

    const missingPowerIds = itemVisualizando.powerIds.filter(id => !powers.some(p => p.id === id));
    const missingAcervoIds = itemVisualizando.powerArrayIds;

    if (missingPowerIds.length === 0 && missingAcervoIds.length === 0) return;

    const carregarVinculosAusentes = async () => {
      setLoadingVinculos(true);
      try {
        const [novosPoderes, novosAcervos] = await Promise.all([
          Promise.all(missingPowerIds.map(id => getPowerById(id).catch(() => null))),
          Promise.all(missingAcervoIds.map(id => getPowerArrayById(id).catch(() => null)))
        ]);

        setVinculosExtras(prev => ({
          poderes: [...prev.poderes, ...novosPoderes.filter((p): p is any => p !== null)],
          acervos: [...prev.acervos, ...novosAcervos.filter((a): a is any => a !== null)],
        }));
      } catch (e) {
        console.error('Erro ao carregar vínculos ausentes no admin', e);
      } finally {
        setLoadingVinculos(false);
      }
    };

    carregarVinculosAusentes();
  }, [itemVisualizando, powers]);

  const itemPoderResumoSelecionado = useMemo(() => {
    if (!itemPoderResumoId) return undefined;
    return powers.find((p) => p.id === itemPoderResumoId) || vinculosExtras.poderes.find((p) => p.id === itemPoderResumoId);
  }, [itemPoderResumoId, powers, vinculosExtras.poderes]);
  
  const handleExportarPoder = (poder: PoderResponse) => {
    try {
      const blob = new Blob([JSON.stringify(poder, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${poder.nome.replace(/\s+/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`"${poder.nome}" exportado!`);
    } catch {
      toast.error('Erro ao exportar poder.');
    }
  };

  const handleExportarItem = async (item: ItemResponse) => {
    try {
      const sanitized = await exportItem(item.id);
      const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.nome.replace(/\s+/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`"${item.nome}" exportado!`);
    } catch (err) {
      toast.error('Erro ao exportar item.');
    }
  };

  const [exportandoTodosPoderes, setExportandoTodosPoderes] = useState(false);
  const [exportandoTodosItens, setExportandoTodosItens] = useState(false);

  const handleExportarTodosPoderes = () => {
    if (filteredPowers.length === 0) return;
    setExportandoTodosPoderes(true);
    try {
      const blob = new Blob([JSON.stringify(filteredPowers, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `biblioteca-poderes-admin-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${filteredPowers.length} poderes exportados!`);
    } catch {
      toast.error('Erro ao exportar poderes.');
    } finally {
      setExportandoTodosPoderes(false);
    }
  };

  const handleExportarTodosItens = async () => {
    if (filteredItems.length === 0) return;
    setExportandoTodosItens(true);
    try {
      const sanitizedList = await Promise.all(
        filteredItems.map(item => exportItem(item.id).catch(() => null))
      );
      const cleanList = sanitizedList.filter(Boolean);
      const blob = new Blob([JSON.stringify(cleanList, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `biblioteca-itens-admin-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${cleanList.length} itens exportados!`);
    } catch (err) {
      toast.error('Erro ao exportar itens.');
    } finally {
      setExportandoTodosItens(false);
    }
  };

  const navigate = useNavigate();

  const isLoading = isLoadingChars || isLoadingPowers || isLoadingItems || isLoadingArrays || isLoadingPeculiarities;
  const error = charError || powerError || itemError || arrayError || peculiarityError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 px-4 py-8">
        <EmptyState
          icon={<ShieldAlert className="w-16 h-16 text-red-500" />}
          title="Acesso Restrito"
          description={error}
          action={{
            label: 'Voltar ao Início',
            onClick: () => navigate('/'),
          }}
        />
      </div>
    );
  }

  const filteredCharacters = characters.filter((c) =>
    (c.narrative.name || '').toLowerCase().includes(charSearch.toLowerCase()) ||
    (c.narrative.identity || '').toLowerCase().includes(charSearch.toLowerCase())
  );

  const filteredPowers = powers.filter((p) =>
    p.nome.toLowerCase().includes(powerSearch.toLowerCase()) ||
    p.descricao.toLowerCase().includes(powerSearch.toLowerCase())
  );

  const filteredItems = items.filter((i) =>
    i.nome.toLowerCase().includes(itemSearch.toLowerCase()) ||
    i.descricao.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const filteredPowerArrays = powerArrays.filter((a) =>
    a.nome.toLowerCase().includes(arraySearch.toLowerCase()) ||
    a.descricao.toLowerCase().includes(arraySearch.toLowerCase())
  );

  const filteredPeculiarities = peculiarities.filter((p) =>
    p.nome.toLowerCase().includes(peculiaritySearch.toLowerCase()) ||
    p.descricao.toLowerCase().includes(peculiaritySearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-500 dark:from-red-400 dark:to-orange-400">
            Painel do Administrador
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestão integrada de fichas, biblioteca de poderes e configurações do servidor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10 h-8">
            Modo Administrador
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4 mb-6">
        <button
          onClick={() => setActiveTab('characters')}
          className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all px-1 cursor-pointer ${
            activeTab === 'characters'
              ? 'border-red-500 text-red-500 dark:text-red-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Fichas do Servidor ({characters.length})
        </button>
        <button
          onClick={() => setActiveTab('powers')}
          className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all px-1 cursor-pointer ${
            activeTab === 'powers'
              ? 'border-red-500 text-red-500 dark:text-red-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Biblioteca de Poderes ({powers.length})
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all px-1 cursor-pointer ${
            activeTab === 'items'
              ? 'border-red-500 text-red-500 dark:text-red-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Sword className="w-4 h-4" />
          Biblioteca de Itens ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('arrays')}
          className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all px-1 cursor-pointer ${
            activeTab === 'arrays'
              ? 'border-red-500 text-red-500 dark:text-red-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          Biblioteca de Acervos ({powerArrays.length})
        </button>
        <button
          onClick={() => setActiveTab('peculiarities')}
          className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all px-1 cursor-pointer ${
            activeTab === 'peculiarities'
              ? 'border-red-500 text-red-500 dark:text-red-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Biblioteca de Peculiaridades ({peculiarities.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'characters' && (
        <div className="space-y-6">
          <div className="max-w-md">
            <Input
              placeholder="Buscar ficha por nome ou identidade..."
              value={charSearch}
              onChange={(e) => setCharSearch(e.target.value)}
            />
          </div>

          {filteredCharacters.length === 0 ? (
            <EmptyState
              icon={<LayoutDashboard className="w-16 h-16 text-gray-400" />}
              title="Nenhum personagem encontrado"
              description={charSearch ? "Nenhum resultado corresponde à busca." : "Ainda não existem personagens criados."}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCharacters.map((character) => (
                <Card 
                  key={character.id} 
                  className="group relative h-96 flex flex-col overflow-hidden rounded-2xl border-0 ring-1 ring-red-500/20 cursor-pointer hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300"
                  onClick={() => navigate(`/personagens/${character.id}`)}
                >
                  {/* Arte de Fundo com Zoom */}
                  <div className="absolute inset-0 z-0 bg-black">
                    {character.art ? (
                      <CroppedImage 
                        src={character.art} 
                        alt={character.narrative.name || character.narrative.identity} 
                        className="w-full h-full opacity-60 dark:opacity-80 group-hover:opacity-75 transition-all duration-700" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-900 via-rose-900 to-slate-900 transition-transform duration-700 group-hover:scale-110 flex items-center justify-center">
                        <User className="w-24 h-24 text-white/5" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-950/60 to-transparent z-10" />
                  </div>

                  {/* Botões de Ação de Admin */}
                  <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="h-8 w-8 p-0 rounded-full bg-red-600/90 hover:bg-red-700 text-white backdrop-blur-sm border border-white/10 shadow-[0_0_15px_rgba(220,38,38,0.5)]" 
                      title="Apagar Ficha (Admin)"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCharacterToDelete(character.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Informações Principais */}
                  <div className="relative z-20 mt-auto p-5 md:p-6 flex flex-col justify-end">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="secondary" className="bg-red-500/20 hover:bg-red-500/30 text-rose-200 border-red-500/30 backdrop-blur-md text-[10px] px-2 py-0">
                        ID: {character.id.split('-')[0]}
                      </Badge>
                      <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md text-[10px] px-2 py-0">
                        Nível {character.level}
                      </Badge>
                      <Badge variant="secondary" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-500/30 backdrop-blur-md text-[10px] px-2 py-0">
                        {character.spiritualPrinciple.stage === 'DIVINE' ? 'Divino' : 'Mortal'}
                      </Badge>
                    </div>
                    
                    <h3 className="font-extrabold text-2xl md:text-3xl text-white tracking-tight line-clamp-1 drop-shadow-md mb-1">
                      {character.narrative.name || character.narrative.identity || "Personagem sem Nome"}
                    </h3>
                    <div className="text-sm text-gray-300 font-medium mb-4 drop-shadow-sm flex items-center gap-1.5 line-clamp-1">
                       <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
                       {character.narrative.identity || "Sem Identidade"}
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 bg-red-950/60 border border-red-500/30 rounded-xl p-2.5 backdrop-blur-md flex items-center justify-between shadow-lg">
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">PV</span>
                        <span className="text-sm font-black text-rose-100">
                          {character.health.currentPV} <span className="opacity-50 font-medium text-xs">/ {character.health.maxPV}</span>
                        </span>
                      </div>
                      <div className="flex-1 bg-blue-950/60 border border-blue-500/30 rounded-xl p-2.5 backdrop-blur-md flex items-center justify-between shadow-lg">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider">PE</span>
                        <span className="text-sm font-black text-cyan-100">
                          {character.energy.currentPE} <span className="opacity-50 font-medium text-xs">/ {character.energy.maxPE}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 border-t border-white/10 pt-4">
                      <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
                        Atualizado há pouco
                      </span>
                      <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 whitespace-nowrap">
                         <Sparkles className="w-3 h-3 shrink-0" />
                         {character.pda.total} PdA
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'powers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="max-w-md w-full">
              <Input
                placeholder="Buscar poder por nome ou descrição..."
                value={powerSearch}
                onChange={(e) => setPowerSearch(e.target.value)}
              />
            </div>
            {filteredPowers.length > 0 && (
              <Button
                variant="outline"
                onClick={handleExportarTodosPoderes}
                loading={exportandoTodosPoderes}
                className="flex items-center gap-2 text-xs font-bold shrink-0"
              >
                <Download className="w-4 h-4 text-green-500" /> Exportar Todos ({filteredPowers.length})
              </Button>
            )}
          </div>

          {filteredPowers.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-16 h-16 text-gray-400" />}
              title="Nenhum poder encontrado"
              description={powerSearch ? "Nenhum resultado corresponde à busca." : "Ainda não existem poderes na biblioteca."}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPowers.map((power) => (
                <CardPoderAdmin
                  key={power.id}
                  power={power}
                  onPromote={() => setPowerToPromote(power.id)}
                  onDelete={() => setPowerToDelete(power.id)}
                  onEdit={() => setPoderEditando(power)}
                  onVerResumo={() => setPoderVisualizando(power)}
                  onExport={() => handleExportarPoder(power)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'items' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="max-w-md w-full">
              <Input
                placeholder="Buscar item por nome ou descrição..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
              />
            </div>
            {filteredItems.length > 0 && (
              <Button
                variant="outline"
                onClick={handleExportarTodosItens}
                loading={exportandoTodosItens}
                className="flex items-center gap-2 text-xs font-bold shrink-0"
              >
                <Download className="w-4 h-4 text-green-500" /> Exportar Todos ({filteredItems.length})
              </Button>
            )}
          </div>

          {filteredItems.length === 0 ? (
            <EmptyState
              icon={<Sword className="w-16 h-16 text-gray-400" />}
              title="Nenhum item encontrado"
              description={itemSearch ? "Nenhum resultado corresponde à busca." : "Ainda não existem itens na biblioteca."}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredItems.map((item) => (
                <CardItemAdmin
                  key={item.id}
                  item={item}
                  onPromote={() => setItemToPromote(item.id)}
                  onDelete={() => setItemToDelete(item.id)}
                  onEdit={() => setItemEditando(item)}
                  onVerResumo={() => setItemVisualizando(item)}
                  onExport={() => handleExportarItem(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'arrays' && (
        <div className="space-y-6">
          <div className="max-w-md">
            <Input
              placeholder="Buscar acervo por nome ou descrição..."
              value={arraySearch}
              onChange={(e) => setArraySearch(e.target.value)}
            />
          </div>

          {filteredPowerArrays.length === 0 ? (
            <EmptyState
              icon={<Layers className="w-16 h-16 text-gray-400" />}
              title="Nenhum acervo encontrado"
              description={arraySearch ? "Nenhum resultado corresponde à busca." : "Ainda não existem acervos na biblioteca."}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPowerArrays.map((array) => (
                <CardAcervoAdmin
                  key={array.id}
                  array={array}
                  onPromote={() => setArrayToPromote(array.id)}
                  onDelete={() => setArrayToDelete(array.id)}
                  onEdit={() => setArrayEditando(array)}
                  onVerResumo={() => setArrayVisualizando(array)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'peculiarities' && (
        <div className="space-y-6">
          <div className="max-w-md">
            <Input
              placeholder="Buscar peculiaridade por nome ou descrição..."
              value={peculiaritySearch}
              onChange={(e) => setPeculiaritySearch(e.target.value)}
            />
          </div>

          {filteredPeculiarities.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="w-16 h-16 text-gray-400" />}
              title="Nenhuma peculiaridade encontrada"
              description={peculiaritySearch ? "Nenhum resultado corresponde à busca." : "Ainda não existem peculiaridades customizadas na biblioteca."}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPeculiarities.map((pec) => (
                <CardPeculiarityAdmin
                  key={pec.id}
                  peculiarity={pec}
                  onPromote={() => setPeculiarityToPromote(pec.id)}
                  onDelete={() => setPeculiarityToDelete(pec.id)}
                  onEdit={() => setPeculiarityEditando(pec)}
                  onVerResumo={() => setPeculiarityVisualizando(pec)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={!!characterToDelete}
        onClose={() => setCharacterToDelete(null)}
        title="Exclusão de Ficha (Administrador)"
        message="Você está prestes a excluir a ficha de um jogador definitivamente. Esta ação não pode ser desfeita. Continuar?"
        confirmText="Excluir Definitivamente"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={async () => {
          if (characterToDelete) {
            await deleteCharacter(characterToDelete);
            setCharacterToDelete(null);
          }
        }}
      />

      <ConfirmDialog
        isOpen={!!powerToDelete}
        onClose={() => setPowerToDelete(null)}
        title="Excluir Poder da Biblioteca"
        message="Esta ação apagará o poder do catálogo do servidor definitivamente. Personagens que possuam este poder associado continuarão com ele, mas novas cópias não poderão ser criadas. Continuar?"
        confirmText="Excluir Poder"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={async () => {
          if (powerToDelete) {
            await deletePower(powerToDelete);
            setPowerToDelete(null);
          }
        }}
      />

      <ConfirmDialog
        isOpen={!!powerToPromote}
        onClose={() => setPowerToPromote(null)}
        title="Oficializar Poder"
        message="Você está promovendo este poder customizado a oficial. O poder passará a pertencer ao sistema (userId: null) e ficará disponível publicamente para todos os jogadores do servidor como conteúdo padrão. Continuar?"
        confirmText="Oficializar Poder"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={async () => {
          if (powerToPromote) {
            await promotePower(powerToPromote);
            setPowerToPromote(null);
          }
        }}
      />

      {poderVisualizandoConvertido && (
        <ResumoPoder
          isOpen={!!poderVisualizando}
          onClose={() => setPoderVisualizando(null)}
          poder={poderVisualizandoConvertido.poder}
          detalhes={poderVisualizandoConvertido.detalhes}
        />
      )}

      {poderEditandoConvertido && (
        <CriadorDePoderModal
          isOpen={!!poderEditando}
          onClose={() => setPoderEditando(null)}
          poderParaEditar={poderEditandoConvertido}
          onSave={async () => {
            setPoderEditando(null);
            await fetchPowers();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Excluir Item da Biblioteca"
        message="Esta ação apagará o item do catálogo do servidor definitivamente. Personagens que possuam este item associado continuarão com ele, mas novas cópias não poderão ser criadas. Continuar?"
        confirmText="Excluir Item"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={async () => {
          if (itemToDelete) {
            await deleteItem(itemToDelete);
            setItemToDelete(null);
          }
        }}
      />

      <ConfirmDialog
        isOpen={!!itemToPromote}
        onClose={() => setItemToPromote(null)}
        title="Oficializar Item"
        message="Você está promovendo este item customizado a oficial. O item passará a pertencer ao sistema (userId: null) e ficará disponível publicamente para todos os jogadores do servidor como conteúdo padrão. Continuar?"
        confirmText="Oficializar Item"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={async () => {
          if (itemToPromote) {
            await promoteItem(itemToPromote);
            setItemToPromote(null);
          }
        }}
      />

      {itemVisualizando && (
        <ResumoItem
          isOpen={!!itemVisualizando}
          onClose={() => setItemVisualizando(null)}
          tipo={itemVisualizando.tipo}
          nome={itemVisualizando.nome}
          icone={itemVisualizando.icone ?? undefined}
          descricao={itemVisualizando.descricao}
          dominios={itemVisualizando.dominios?.map(d => ({
            name: d.name,
            areaConhecimento: d.areaConhecimento ?? undefined,
            peculiarId: d.peculiarId ?? undefined,
          }))}
          custoBase={itemVisualizando.custoBase}
          nivelCalculado={itemVisualizando.nivelItem}
          custoRealCalculado={itemVisualizando.valorBase}
          precoVendaCalculado={itemVisualizando.precoVenda}
          selectedPowers={itemPoderesSelecionados}
          selectedPowerArrays={itemAcervosSelecionados}
          onOpenPowerDetails={(powerId) => setItemPoderResumoId(powerId)}
          onOpenPowerArrayDetails={() => {}}
          itemData={itemVisualizando}
          isLoadingVinculos={loadingVinculos}
        />
      )}

      <ResumoVinculoModal
        isOpen={!!itemPoderResumoSelecionado}
        onClose={() => {
          setItemPoderResumoId(null);
        }}
        poder={itemPoderResumoSelecionado ?? undefined}
      />

      {itemEditando && (
        <CriadorDeItemModal
          isOpen={!!itemEditando}
          onClose={() => setItemEditando(null)}
          itemParaEditar={itemEditando}
          onSave={async () => {
            setItemEditando(null);
            await fetchItems();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!arrayToDelete}
        onClose={() => setArrayToDelete(null)}
        title="Excluir Acervo da Biblioteca"
        message="Esta ação apagará o acervo do catálogo do servidor definitivamente. Personagens que possuam este acervo associado continuarão com ele, mas novas cópias não poderão ser criadas. Continuar?"
        confirmText="Excluir Acervo"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={async () => {
          if (arrayToDelete) {
            await deletePowerArray(arrayToDelete);
            setArrayToDelete(null);
          }
        }}
      />

      <ConfirmDialog
        isOpen={!!arrayToPromote}
        onClose={() => setArrayToPromote(null)}
        title="Oficializar Acervo"
        message="Você está promovendo este acervo customizado a oficial. O acervo passará a pertencer ao sistema (userId: null) e ficará disponível publicamente para todos os jogadores do servidor como conteúdo padrão. Continuar?"
        confirmText="Oficializar Acervo"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={async () => {
          if (arrayToPromote) {
            await promotePowerArray(arrayToPromote);
            setArrayToPromote(null);
          }
        }}
      />

      {arrayVisualizandoConvertido && (
        <ResumoAcervo
          isOpen={!!arrayVisualizando}
          onClose={() => setArrayVisualizando(null)}
          acervo={arrayVisualizandoConvertido}
        />
      )}

      {arrayEditando && (
        <CriadorAcervo
          isOpen={!!arrayEditando}
          onClose={() => setArrayEditando(null)}
          acervoInicial={arrayEditandoConvertido}
          onSalvo={async () => {
            setArrayEditando(null);
            await fetchPowerArrays();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={!!peculiarityToDelete}
        onClose={() => setPeculiarityToDelete(null)}
        title="Excluir Peculiaridade da Biblioteca"
        message="Esta ação apagará a peculiaridade do catálogo do servidor definitivamente. Continuar?"
        confirmText="Excluir Peculiaridade"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={async () => {
          if (peculiarityToDelete) {
            await deletePeculiarity(peculiarityToDelete);
            setPeculiarityToDelete(null);
          }
        }}
      />

      <ConfirmDialog
        isOpen={!!peculiarityToPromote}
        onClose={() => setPeculiarityToPromote(null)}
        title="Oficializar Peculiaridade"
        message="Você está promovendo esta peculiaridade customizada a oficial. Ela passará a pertencer ao sistema (userId: null) e ficará disponível publicamente para todos os jogadores do servidor como conteúdo padrão. Continuar?"
        confirmText="Oficializar Peculiaridade"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={async () => {
          if (peculiarityToPromote) {
            await promotePeculiarity(peculiarityToPromote);
            setPeculiarityToPromote(null);
          }
        }}
      />

      {peculiarityVisualizando && (
        <ResumoPeculiaridade
          isOpen={!!peculiarityVisualizando}
          onClose={() => setPeculiarityVisualizando(null)}
          peculiaridade={peculiarityVisualizando}
        />
      )}

      {peculiarityEditando && (
        <FormPeculiaridadeCustomizada
          isOpen={!!peculiarityEditando}
          onClose={() => setPeculiarityEditando(null)}
          title="Editar Peculiaridade (Admin)"
          submitLabel="Salvar Peculiaridade"
          initialValues={{
            nome: peculiarityEditando.nome,
            descricao: peculiarityEditando.descricao,
            espiritual: peculiarityEditando.espiritual,
            icone: peculiarityEditando.icone ?? undefined,
          }}
          onSubmit={async (data) => {
            await updatePeculiarity(peculiarityEditando.id, data);
            setPeculiarityEditando(null);
            await fetchPeculiarities();
          }}
        />
      )}
    </div>
  );
}
