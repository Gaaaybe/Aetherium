import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  EmptyState,
  toast,
  DynamicIcon,
  Dropdown,
} from '../shared/ui';
import { fetchPublicPowerArrays, copyPowerArray, getPowerArrayById } from '../services/powerArrays.service';
import { fetchPublicPeculiarities, copyPeculiarity } from '../services/peculiarities.service';
import { fetchPublicItems, copyPublicItem } from '../services/items.service';
import { fetchPublicPowers, getPowerById } from '../services/powers.service';
import { usePoderes } from '../features/criador-de-poder/hooks/usePoderes';
import { ResumoPoder } from '../features/criador-de-poder/components/ResumoPoder';
import { ResumoAcervo } from '../features/criador-de-poder/components/ResumoAcervo';
import { ResumoItem } from '../features/criador-de-item/components/ResumoItem';
import { ResumoVinculoModal } from '../features/criador-de-item/components/ResumoVinculoModal';
import { acervoResponseToAcervo, poderResponseToPoder } from '../features/criador-de-poder/utils/poderApiConverter';
import { calcularDetalhesPoder } from '../features/criador-de-poder/regras/calculadoraCusto';
import { useCatalog } from '../context/useCatalog';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import type { PoderResponse, AcervoResponse, PeculiaridadeResponse, ItemResponse } from '../services/types';
import { getThemeByDomain, getThemeByItemType, PatternOverlay } from '../shared/utils/summary-themes';
import { MarkdownText } from '../shared/components/MarkdownText';
import { ResumoPeculiaridade } from '../features/criador-de-poder/components/ResumoPeculiaridade';
import { DOMINIOS } from '@/data';
import {
  Globe,
  Zap,
  Package,
  Sparkles,
  Search,
  RefreshCw,
  AlertCircle,
  Copy,
  Lock,
  Sword,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function CardPoderPublico({
  poder,
  onCopiar,
  copiandoId,
  onVerResumo,
}: {
  poder: PoderResponse;
  onCopiar: (id: string) => void;
  copiandoId: string | null;
  onVerResumo: () => void;
}) {
  const theme = getThemeByDomain(poder.dominio.name);

  return (
    <Card 
      hover 
      padding="none"
      className={`flex flex-row overflow-hidden transition-all duration-300 border-l-4 border-purple-500/50 min-h-[180px] h-auto shadow-xl`}
    >
      <div 
        className={`w-24 relative flex-shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br ${theme.bgGradient} bg-opacity-10 cursor-pointer group`}
        onClick={onVerResumo}
      >
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-0" />
        <PatternOverlay pattern={theme.pattern} />
        {poder.icone ? (
          <img
            src={poder.icone}
            alt={poder.nome}
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
              {poder.nome}
            </h3>
            <Badge variant="secondary" size="sm" className="shrink-0 text-[10px] font-black bg-slate-100 dark:bg-slate-800">
              {poder.custoTotal.pda} PdA
            </Badge>
          </div>
          
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-900/10 dark:bg-white/10 ${theme.accentColor}`}>
                {poder.dominio.name}
              </span>
              {poder.userName && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium italic">
                  por {poder.userName}
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 max-h-[72px] overflow-hidden leading-relaxed">
            <MarkdownText>{poder.descricao}</MarkdownText>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2.5">
             <div className="flex flex-col">
               <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Efeitos</span>
               <span className="text-sm font-black text-gray-700 dark:text-gray-300 leading-none">{poder.effects.length}</span>
             </div>
             {poder.custoTotal.pe > 0 && (
               <div className="flex flex-col border-l border-gray-100 dark:border-gray-800 pl-2.5">
                 <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Custo</span>
                 <span className="text-sm font-black text-purple-600 dark:text-purple-400 leading-none">{poder.custoTotal.pe} PE</span>
               </div>
             )}
          </div>
          
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onCopiar(poder.id); }}
            loading={copiandoId === poder.id}
            disabled={copiandoId !== null}
            className={`h-9 px-5 text-[11px] font-black shadow-lg shadow-purple-500/20 active:scale-95 transition-all uppercase tracking-widest`}
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" /> COPIAR
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CardAcervoPublico({
  acervo,
  onCopiar,
  copiandoId,
  onVerResumo,
}: {
  acervo: AcervoResponse;
  onCopiar: (id: string) => void;
  copiandoId: string | null;
  onVerResumo: () => void;
}) {
  const theme = getThemeByDomain(acervo.dominio.name);

  return (
    <Card 
      hover 
      padding="none"
      className={`flex flex-row overflow-hidden transition-all duration-300 border-l-4 border-purple-500/50 min-h-[180px] h-auto shadow-xl`}
    >
      <div 
        className={`w-24 relative flex-shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br ${theme.bgGradient} bg-opacity-10 cursor-pointer group`}
        onClick={onVerResumo}
      >
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-0" />
        <PatternOverlay pattern={theme.pattern} />
        {acervo.icone ? (
          <img
            src={acervo.icone}
            alt={acervo.nome}
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
              {acervo.nome}
            </h3>
            <Badge variant="secondary" size="sm" className="shrink-0 text-[10px] font-black bg-slate-100 dark:bg-slate-800">
              {acervo.custoTotal.pda} PdA
            </Badge>
          </div>
          
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-900/10 dark:bg-white/10 ${theme.accentColor}`}>
                 ACERVO · {acervo.dominio.name}
              </span>
              {acervo.userName && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium italic">
                  por {acervo.userName}
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 max-h-[72px] overflow-hidden leading-relaxed">
            <MarkdownText>{acervo.descricao}</MarkdownText>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2.5">
             <div className="flex flex-col">
               <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Poderes</span>
               <span className="text-sm font-black text-gray-700 dark:text-gray-300 leading-none">{acervo.powers.length}</span>
             </div>
             {acervo.custoTotal.pe > 0 && (
               <div className="flex flex-col border-l border-gray-100 dark:border-gray-800 pl-2.5">
                 <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Custo</span>
                 <span className="text-sm font-black text-purple-600 dark:text-purple-400 leading-none">{acervo.custoTotal.pe} PE</span>
               </div>
             )}
          </div>
          
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onCopiar(acervo.id); }}
            loading={copiandoId === acervo.id}
            disabled={copiandoId !== null}
            className={`h-9 px-5 text-[11px] font-black shadow-lg shadow-purple-500/20 active:scale-95 transition-all uppercase tracking-widest`}
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" /> COPIAR
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CardItemPublico({
  item,
  onCopiar,
  copiandoId,
  onVerResumo,
}: {
  item: ItemResponse;
  onCopiar: (id: string) => void;
  copiandoId: string | null;
  onVerResumo: () => void;
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
      className={`flex flex-row overflow-hidden transition-all duration-300 border-l-4 border-blue-500/50 min-h-[180px] h-auto shadow-xl`}
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

        <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2.5">
             <div className="flex flex-col">
               <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Vínculos</span>
               <span className="text-sm font-black text-gray-700 dark:text-gray-300 leading-none">
                 {item.powerIds.length + item.powerArrayIds.length}
               </span>
             </div>
          </div>
          
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onCopiar(item.id); }}
            loading={copiandoId === item.id}
            disabled={copiandoId !== null}
            className={`h-9 px-5 text-[11px] font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest`}
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" /> COPIAR
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CardPeculiaridadePublica({
  peculiaridade,
  onCopiar,
  copiandoId,
  onVerResumo,
}: {
  peculiaridade: PeculiaridadeResponse;
  onCopiar: (id: string) => void;
  copiandoId: string | null;
  onVerResumo: () => void;
}) {
  const theme = getThemeByDomain('peculiar');

  return (
    <Card 
      hover 
      padding="none"
      className={`flex flex-row overflow-hidden transition-all duration-300 border-l-4 border-purple-500/50 min-h-[180px] h-auto shadow-xl`}
    >
      <div 
        className={`w-24 relative flex-shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br ${theme.bgGradient} bg-opacity-10 cursor-pointer group`}
        onClick={onVerResumo}
      >
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-0" />
        <PatternOverlay pattern={theme.pattern} />
        {peculiaridade.icone ? (
          <img
            src={peculiaridade.icone}
            alt={peculiaridade.nome}
            className="w-16 h-16 rounded-xl object-cover shadow-2xl z-10 border border-white/20 transition-transform group-hover:scale-110"
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
              {peculiaridade.nome}
            </h3>
            <Badge variant="secondary" size="sm" className="shrink-0 text-[10px] font-black bg-slate-100 dark:bg-slate-800">
               Peculiar
            </Badge>
          </div>
          
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-900/10 dark:bg-white/10 ${theme.accentColor}`}>
                 {peculiaridade.espiritual ? 'ESPIRITUAL' : 'FÍSICA'}
              </span>
              {peculiaridade.userName && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium italic">
                  por {peculiaridade.userName}
                </span>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 max-h-[72px] overflow-hidden leading-relaxed">
            <MarkdownText>{peculiaridade.descricao}</MarkdownText>
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 mt-2 border-t border-gray-100 dark:border-gray-800">
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onCopiar(peculiaridade.id); }}
            loading={copiandoId === peculiaridade.id}
            disabled={copiandoId !== null}
            className={`h-9 px-5 text-[11px] font-black shadow-lg shadow-purple-500/20 active:scale-95 transition-all uppercase tracking-widest`}
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" /> COPIAR
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ComunidadePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { copiar } = usePoderes();
  const { efeitos, modificacoes } = useCatalog();

  const [aba, setAba] = useState<'poderes' | 'itens' | 'acervos' | 'peculiaridades'>('poderes');
  const [buscaPoderes, setBuscaPoderes] = useState('');
  const [buscaItens, setBuscaItens] = useState('');
  const [buscaAcervos, setBuscaAcervos] = useState('');
  const [buscaPeculiaridades, setBuscaPeculiaridades] = useState('');
  const [poderVisualizando, setPoderVisualizando] = useState<PoderResponse | null>(null);
  const [itemVisualizando, setItemVisualizando] = useState<ItemResponse | null>(null);
  const [acervoVisualizando, setAcervoVisualizando] = useState<AcervoResponse | null>(null);
  const [peculiaridadeVisualizando, setPeculiaridadeVisualizando] = useState<PeculiaridadeResponse | null>(null);
  const [itemPoderResumoId, setItemPoderResumoId] = useState<string | null>(null);
  const [itemAcervoResumoId, setItemAcervoResumoId] = useState<string | null>(null);
  
  // Filtros e Ordenação
  const [filtroDominio, setFiltroDominio] = useState<string | null>(null);
  const [filtroTipoItem, setFiltroTipoItem] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<'novos' | 'nome' | 'pda-desc' | 'pda-asc' | 'preco-desc' | 'preco-asc'>('novos');
  
  const [vinculosExtras, setVinculosExtras] = useState<{ poderes: PoderResponse[], acervos: AcervoResponse[] }>({ poderes: [], acervos: [] });
  const [loadingVinculos, setLoadingVinculos] = useState(false);

  const [poderes, setPoderes] = useState<PoderResponse[]>([]);
  const [itens, setItens] = useState<ItemResponse[]>([]);
  const [acervos, setAcervos] = useState<AcervoResponse[]>([]);
  const [peculiaridades, setPeculiaridades] = useState<PeculiaridadeResponse[]>([]);
  const [loadingPoderes, setLoadingPoderes] = useState(true);
  const [loadingItens, setLoadingItens] = useState(true);
  const [loadingAcervos, setLoadingAcervos] = useState(true);
  const [loadingPeculiaridades, setLoadingPeculiaridades] = useState(true);
  const [erroPoderes, setErroPoderes] = useState<string | null>(null);
  const [erroItens, setErroItens] = useState<string | null>(null);
  const [erroAcervos, setErroAcervos] = useState<string | null>(null);
  const [erroPeculiaridades, setErroPeculiaridades] = useState<string | null>(null);
  const [copiandoId, setCopiandoId] = useState<string | null>(null);
  const [copiandoItemId, setCopiandoItemId] = useState<string | null>(null);
  const [copiandoAcervoId, setCopiandoAcervoId] = useState<string | null>(null);
  const [copiandoPeculiaridadeId, setCopiandoPeculiaridadeId] = useState<string | null>(null);

  const poderVisualizandoConvertido = useMemo(() => {
    if (!poderVisualizando) return null;
    const poder = poderResponseToPoder(poderVisualizando);
    const detalhes = calcularDetalhesPoder(poder, efeitos, modificacoes);
    return { poder, detalhes };
  }, [poderVisualizando, efeitos, modificacoes]);

  const acervoVisualizandoConvertido = useMemo(
    () => (acervoVisualizando ? acervoResponseToAcervo(acervoVisualizando) : null),
    [acervoVisualizando],
  );

  const itemPoderesSelecionados = useMemo(() => {
    if (!itemVisualizando) return [];
    const publicos = poderes.filter((p) => itemVisualizando.powerIds.includes(p.id));
    const extras = vinculosExtras.poderes.filter((p) => itemVisualizando.powerIds.includes(p.id));
    // Combinar e evitar duplicatas
    const ids = new Set(publicos.map(p => p.id));
    return [...publicos, ...extras.filter(p => !ids.has(p.id))];
  }, [itemVisualizando, poderes, vinculosExtras.poderes]);

  const itemAcervosSelecionados = useMemo(() => {
    if (!itemVisualizando) return [];
    const publicos = acervos.filter((a) => itemVisualizando.powerArrayIds.includes(a.id));
    const extras = vinculosExtras.acervos.filter((a) => itemVisualizando.powerArrayIds.includes(a.id));
    const ids = new Set(publicos.map(a => a.id));
    return [...publicos, ...extras.filter(a => !ids.has(a.id))];
  }, [itemVisualizando, acervos, vinculosExtras.acervos]);

  // Carregamento proativo de vínculos ausentes
  useEffect(() => {
    if (!itemVisualizando) {
      setVinculosExtras({ poderes: [], acervos: [] });
      return;
    }

    const missingPowerIds = itemVisualizando.powerIds.filter(id => !poderes.some(p => p.id === id));
    const missingAcervoIds = itemVisualizando.powerArrayIds.filter(id => !acervos.some(a => a.id === id));

    if (missingPowerIds.length === 0 && missingAcervoIds.length === 0) return;

    const carregarVinculosAusentes = async () => {
      setLoadingVinculos(true);
      try {
        const [novosPoderes, novosAcervos] = await Promise.all([
          Promise.all(missingPowerIds.map(id => getPowerById(id).catch(() => null))),
          Promise.all(missingAcervoIds.map(id => getPowerArrayById(id).catch(() => null)))
        ]);

        setVinculosExtras(prev => ({
          poderes: [...prev.poderes, ...(novosPoderes.filter(Boolean) as PoderResponse[])],
          acervos: [...prev.acervos, ...(novosAcervos.filter(Boolean) as AcervoResponse[])]
        }));
      } catch (err) {
        console.error("Erro ao carregar vínculos extras:", err);
      } finally {
        setLoadingVinculos(false);
      }
    };

    carregarVinculosAusentes();
  }, [itemVisualizando, poderes, acervos]);

  const itemPoderResumoSelecionado = useMemo(() => {
    if (!itemPoderResumoId) return undefined;
    return poderes.find((p) => p.id === itemPoderResumoId) || vinculosExtras.poderes.find((p) => p.id === itemPoderResumoId);
  }, [itemPoderResumoId, poderes, vinculosExtras.poderes]);

  const itemAcervoResumoSelecionado = useMemo(() => {
    if (!itemAcervoResumoId) return undefined;
    return acervos.find((a) => a.id === itemAcervoResumoId) || vinculosExtras.acervos.find((a) => a.id === itemAcervoResumoId);
  }, [itemAcervoResumoId, acervos, vinculosExtras.acervos]);

  const carregarPoderes = useCallback(async () => {
    setLoadingPoderes(true);
    setErroPoderes(null);
    try {
      const data = await fetchPublicPowers();
      setPoderes(data);
    } catch {
      setErroPoderes('Não foi possível carregar os poderes públicos.');
    } finally {
      setLoadingPoderes(false);
    }
  }, []);

  const carregarItens = useCallback(async () => {
    setLoadingItens(true);
    setErroItens(null);
    try {
      const data = await fetchPublicItems();
      setItens(data);
    } catch {
      setErroItens('Não foi possível carregar os itens públicos.');
    } finally {
      setLoadingItens(false);
    }
  }, []);

  const carregarAcervos = useCallback(async () => {
    setLoadingAcervos(true);
    setErroAcervos(null);
    try {
      const data = await fetchPublicPowerArrays();
      setAcervos(data);
    } catch {
      setErroAcervos('Não foi possível carregar os acervos públicos.');
    } finally {
      setLoadingAcervos(false);
    }
  }, []);

  const carregarPeculiaridades = useCallback(async () => {
    setLoadingPeculiaridades(true);
    setErroPeculiaridades(null);
    try {
      const data = await fetchPublicPeculiarities();
      setPeculiaridades(data);
    } catch {
      setErroPeculiaridades('Não foi possível carregar as peculiaridades públicas.');
    } finally {
      setLoadingPeculiaridades(false);
    }
  }, []);

  // Listas Filtradas e Ordenadas
  const poderesFiltrados = useMemo(() => {
    let lista = poderes.filter((p) => {
      const matchTexto = p.nome.toLowerCase().includes(buscaPoderes.toLowerCase()) || 
                         p.descricao.toLowerCase().includes(buscaPoderes.toLowerCase());
      const matchDominio = !filtroDominio || p.dominio.name === filtroDominio;
      return matchTexto && matchDominio;
    });

    return [...lista].sort((a, b) => {
      if (ordenacao === 'nome') return a.nome.localeCompare(b.nome);
      if (ordenacao === 'pda-desc') return b.custoTotal.pda - a.custoTotal.pda;
      if (ordenacao === 'pda-asc') return a.custoTotal.pda - b.custoTotal.pda;
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });
  }, [poderes, buscaPoderes, filtroDominio, ordenacao]);

  const itensFiltrados = useMemo(() => {
    let lista = itens.filter((i) => {
      const matchTexto = i.nome.toLowerCase().includes(buscaItens.toLowerCase()) || 
                         i.descricao.toLowerCase().includes(buscaItens.toLowerCase());
      const matchTipo = !filtroTipoItem || i.tipo === filtroTipoItem;
      return matchTexto && matchTipo;
    });

    return [...lista].sort((a, b) => {
      if (ordenacao === 'nome') return a.nome.localeCompare(b.nome);
      if (ordenacao === 'preco-desc') return b.precoVenda - a.precoVenda;
      if (ordenacao === 'preco-asc') return a.precoVenda - b.precoVenda;
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });
  }, [itens, buscaItens, filtroTipoItem, ordenacao]);

  const acervosFiltrados = useMemo(() => {
    let lista = acervos.filter((a) => {
      const matchTexto = a.nome.toLowerCase().includes(buscaAcervos.toLowerCase()) || 
                         a.descricao.toLowerCase().includes(buscaAcervos.toLowerCase());
      const matchDominio = !filtroDominio || a.dominio.name === filtroDominio;
      return matchTexto && matchDominio;
    });

    return [...lista].sort((a, b) => {
      if (ordenacao === 'nome') return a.nome.localeCompare(b.nome);
      if (ordenacao === 'pda-desc') return b.custoTotal.pda - a.custoTotal.pda;
      if (ordenacao === 'pda-asc') return a.custoTotal.pda - b.custoTotal.pda;
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });
  }, [acervos, buscaAcervos, filtroDominio, ordenacao]);

  const peculiaridadesFiltradas = useMemo(() => {
    return peculiaridades.filter((p) => 
      p.nome.toLowerCase().includes(buscaPeculiaridades.toLowerCase()) || 
      p.descricao.toLowerCase().includes(buscaPeculiaridades.toLowerCase())
    );
  }, [peculiaridades, buscaPeculiaridades]);

  useEffect(() => {
    carregarPoderes();
    carregarItens();
    carregarAcervos();
    carregarPeculiaridades();
  }, [carregarPoderes, carregarItens, carregarAcervos, carregarPeculiaridades]);

  const handleCopiar = async (powerId: string) => {
    if (!isAuthenticated) {
      toast.error('Faça login para copiar poderes.');
      navigate('/entrar');
      return;
    }
    setCopiandoId(powerId);
    try {
      const novo = await copiar(powerId);
      toast.success(`"${novo.nome}" copiado para sua biblioteca!`);
    } catch {
      toast.error('Erro ao copiar poder. Tente novamente.');
    } finally {
      setCopiandoId(null);
    }
  };

  const handleCopiarAcervo = async (acervoId: string) => {
    if (!isAuthenticated) {
      toast.error('Faça login para copiar acervos.');
      navigate('/entrar');
      return;
    }
    setCopiandoAcervoId(acervoId);
    try {
      const novo = await copyPowerArray(acervoId);
      toast.success(`"${novo.nome}" e seus poderes copiados para sua biblioteca!`);
    } catch {
      toast.error('Erro ao copiar acervo. Tente novamente.');
    } finally {
      setCopiandoAcervoId(null);
    }
  };

  const handleCopiarItem = async (itemId: string) => {
    if (!isAuthenticated) {
      toast.error('Faça login para copiar itens.');
      navigate('/entrar');
      return;
    }
    setCopiandoItemId(itemId);
    try {
      const novo = await copyPublicItem(itemId);
      toast.success(`"${novo.nome}" copiado para sua biblioteca!`);
    } catch {
      toast.error('Erro ao copiar item. Tente novamente.');
    } finally {
      setCopiandoItemId(null);
    }
  };

  const handleCopiarPeculiaridade = async (peculiarityId: string) => {
    if (!isAuthenticated) {
      toast.error('Faça login para copiar peculiaridades.');
      navigate('/entrar');
      return;
    }
    setCopiandoPeculiaridadeId(peculiarityId);
    try {
      const nova = await copyPeculiarity(peculiarityId);
      toast.success(`"${nova.nome}" copiada para seus itens customizados!`);
    } catch {
      toast.error('Erro ao copiar peculiaridade. Tente novamente.');
    } finally {
      setCopiandoPeculiaridadeId(null);
    }
  };

  const isLoading =
    aba === 'poderes'
      ? loadingPoderes
      : aba === 'itens'
        ? loadingItens
        : aba === 'acervos'
          ? loadingAcervos
          : loadingPeculiaridades;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-espirito-600 to-purple-700 dark:from-espirito-800 dark:to-purple-900 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-7 h-7 opacity-90" />
          <h1 className="text-2xl font-bold">Comunidade</h1>
        </div>
        <p className="text-espirito-100 dark:text-espirito-200 text-sm max-w-xl">
          Explore poderes e acervos compartilhados pela comunidade. Copie o que gostar para a sua
          biblioteca e adapte como quiser.
        </p>
        {!isAuthenticated && (
          <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-sm w-fit">
            <Lock className="w-4 h-4" />
            <span>
              <button className="underline font-medium" onClick={() => navigate('/entrar')}>
                Entre
              </button>{' '}
              para copiar conteúdo para sua biblioteca
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {(['poderes', 'itens', 'acervos', 'peculiaridades'] as const).map((tab) => {
          const labels = { poderes: 'Poderes', itens: 'Itens', acervos: 'Acervos', peculiaridades: 'Peculiaridades' };
          const icons = {
            poderes: <Zap className="w-4 h-4" />,
            itens: <Sword className="w-4 h-4" />,
            acervos: <Layers className="w-4 h-4" />,
            peculiaridades: <Sparkles className="w-4 h-4" />,
          };
          const counts = {
            poderes: poderesFiltrados.length,
            itens: itensFiltrados.length,
            acervos: acervosFiltrados.length,
            peculiaridades: peculiaridadesFiltradas.length,
          };
          return (
            <button
              key={tab}
              onClick={() => setAba(tab)}
              className={`px-4 py-3 font-bold transition-all border-b-2 flex items-center gap-2 text-sm uppercase tracking-tighter ${
                aba === tab
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {icons[tab]} {labels[tab]}
              {!isLoading && counts[tab] > 0 && (
                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full px-1.5 py-0.5 ml-1">
                  {counts[tab]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Barra de Ferramentas (Busca, Sort, Filtros) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-4">
        <div className="relative group flex-1 max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-purple-500 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <Input
            placeholder={
              aba === 'poderes'
                ? 'Buscar nas Habilidades...'
                : aba === 'itens'
                ? 'Buscar itens fabulosos...'
                : aba === 'acervos'
                ? 'Buscar acervos temáticos...'
                : 'Buscar peculiaridades...'
            }
            value={
              aba === 'poderes'
                ? buscaPoderes
                : aba === 'itens'
                ? buscaItens
                : aba === 'acervos'
                ? buscaAcervos
                : buscaPeculiaridades
            }
            onChange={(e) => {
              const v = e.target.value;
              if (aba === 'poderes') setBuscaPoderes(v);
              if (aba === 'itens') setBuscaItens(v);
              if (aba === 'acervos') setBuscaAcervos(v);
              if (aba === 'peculiaridades') setBuscaPeculiaridades(v);
            }}
            className="pl-12 h-14 w-full bg-white dark:bg-slate-900 border-none shadow-xl ring-1 ring-black/5 dark:ring-white/10 focus:ring-2 focus:ring-purple-500 rounded-2xl text-lg transition-all"
          />
        </div>

          <Dropdown
            value={ordenacao}
            onChange={(v) => setOrdenacao(v as any)}
            icon={<ArrowUpDown className="w-4 h-4" />}
            options={[
              { value: 'novos', label: 'Mais Recentes' },
              { value: 'nome', label: 'Nome (A-Z)' },
              ...(aba !== 'itens' 
                ? [
                    { value: 'pda-desc', label: 'Maior PdA' },
                    { value: 'pda-asc', label: 'Menor PdA' },
                  ]
                : [
                    { value: 'preco-desc', label: 'Maior Preço' },
                    { value: 'preco-asc', label: 'Menor Preço' },
                  ]
              ),
            ]}
          />
      </div>

      {/* Filtros de Categoria (Domínios / Tipos Item) */}
      {(aba === 'poderes' || aba === 'acervos' || aba === 'itens') && (
        <div className="flex flex-wrap items-center gap-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <button
            onClick={() => aba === 'itens' ? setFiltroTipoItem(null) : setFiltroDominio(null)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md ${
              (aba === 'itens' ? !filtroTipoItem : !filtroDominio)
                ? 'bg-purple-600 text-white shadow-purple-500/25 scale-105'
                : 'bg-white dark:bg-slate-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            TUDO
          </button>
          
          {aba === 'itens' ? (
            <>
              {[
                { id: 'weapon', label: 'Arma' },
                { id: 'defensive-equipment', label: 'Defesa' },
                { id: 'consumable', label: 'Consumível' },
                { id: 'artifact', label: 'Artefato' },
                { id: 'accessory', label: 'Acessório' },
                { id: 'general', label: 'Geral' },
                { id: 'upgrade-material', label: 'Material' },
              ].map((tipo) => (
                <button
                  key={tipo.id}
                  onClick={() => setFiltroTipoItem(tipo.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md ${
                    filtroTipoItem === tipo.id
                      ? 'bg-blue-600 text-white shadow-blue-500/25 scale-105'
                      : 'bg-white dark:bg-slate-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {tipo.label}
                </button>
              ))}
            </>
          ) : (
            DOMINIOS.map((dom) => (
              <button
                key={dom.id}
                onClick={() => setFiltroDominio(dom.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md ${
                  filtroDominio === dom.id
                    ? 'bg-purple-600 text-white shadow-purple-500/25 scale-105'
                    : 'bg-white dark:bg-slate-900 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                {dom.nome}
              </button>
            ))
          )}
        </div>
      )}

      {/* ── Aba Poderes ── */}
      {aba === 'poderes' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              {loadingPoderes ? 'Carregando…' : `${poderesFiltrados.length} Habilidades`}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={carregarPoderes}
              disabled={loadingPoderes}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${loadingPoderes ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {erroPoderes && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{erroPoderes}</span>
            </div>
          )}

          {!loadingPoderes && poderesFiltrados.length === 0 ? (
            <EmptyState
              icon={<Zap className="w-12 h-12 text-gray-400" />}
              title={buscaPoderes ? 'Nenhum resultado' : 'Nenhum poder público ainda'}
              description={
                buscaPoderes
                  ? `Nenhum poder corresponde a "${buscaPoderes}"`
                  : 'Seja o primeiro a publicar um poder na comunidade!'
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {poderesFiltrados.map((poder) => (
                <CardPoderPublico
                  key={poder.id}
                  poder={poder}
                  onCopiar={handleCopiar}
                  copiandoId={copiandoId}
                  onVerResumo={() => setPoderVisualizando(poder)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Aba Itens ── */}
      {aba === 'itens' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              {loadingItens ? 'Carregando…' : `${itensFiltrados.length} Itens`}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={carregarItens}
              disabled={loadingItens}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${loadingItens ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {erroItens && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{erroItens}</span>
            </div>
          )}

          {!loadingItens && itensFiltrados.length === 0 ? (
            <EmptyState
              icon={<Package className="w-12 h-12 text-gray-400" />}
              title={buscaItens ? 'Nenhum resultado' : 'Nenhum item público ainda'}
              description={
                buscaItens
                  ? `Nenhum item corresponde a "${buscaItens}"`
                  : 'Seja o primeiro a publicar um item na comunidade!'
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {itensFiltrados.map((item) => (
                <CardItemPublico
                  key={item.id}
                  item={item}
                  onCopiar={handleCopiarItem}
                  copiandoId={copiandoItemId}
                  onVerResumo={() => setItemVisualizando(item)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Aba Acervos ── */}
      {aba === 'acervos' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" />
              {loadingAcervos ? 'Carregando…' : `${acervosFiltrados.length} Acervos`}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={carregarAcervos}
              disabled={loadingAcervos}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${loadingAcervos ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {erroAcervos && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{erroAcervos}</span>
            </div>
          )}

          {!loadingAcervos && acervosFiltrados.length === 0 ? (
            <EmptyState
              icon={<Package className="w-12 h-12 text-gray-400" />}
              title={buscaAcervos ? 'Nenhum resultado' : 'Nenhum acervo público ainda'}
              description={
                buscaAcervos
                  ? `Nenhum acervo corresponde a "${buscaAcervos}"`
                  : 'Seja o primeiro a publicar um acervo na comunidade!'
              }
            />
          ) : (
            <div className="space-y-3">
              {acervosFiltrados.map((acervo) => (
                <CardAcervoPublico
                  key={acervo.id}
                  acervo={acervo}
                  onCopiar={handleCopiarAcervo}
                  copiandoId={copiandoAcervoId}
                  onVerResumo={() => setAcervoVisualizando(acervo)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Aba Peculiaridades ── */}
      {aba === 'peculiaridades' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              {loadingPeculiaridades ? 'Carregando…' : `${peculiaridadesFiltradas.length} Peculiaridades`}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={carregarPeculiaridades}
              disabled={loadingPeculiaridades}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${loadingPeculiaridades ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {erroPeculiaridades && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{erroPeculiaridades}</span>
            </div>
          )}

          {!loadingPeculiaridades && peculiaridadesFiltradas.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="w-12 h-12 text-gray-400" />}
              title={buscaPeculiaridades ? 'Nenhum resultado' : 'Nenhuma peculiaridade pública ainda'}
              description={
                buscaPeculiaridades
                  ? `Nenhuma peculiaridade corresponde a "${buscaPeculiaridades}"`
                  : 'Seja o primeiro a publicar uma peculiaridade na comunidade!'
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {peculiaridadesFiltradas.map((p) => (
                <CardPeculiaridadePublica
                  key={p.id}
                  peculiaridade={p}
                  onCopiar={handleCopiarPeculiaridade}
                  copiandoId={copiandoPeculiaridadeId}
                  onVerResumo={() => setPeculiaridadeVisualizando(p)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Resumo do Poder */}
      {poderVisualizandoConvertido && (
        <ResumoPoder
          isOpen={!!poderVisualizando}
          onClose={() => setPoderVisualizando(null)}
          poder={poderVisualizandoConvertido.poder}
          detalhes={poderVisualizandoConvertido.detalhes}
        />
      )}

      {acervoVisualizandoConvertido && (
        <ResumoAcervo
          isOpen={!!acervoVisualizando}
          onClose={() => setAcervoVisualizando(null)}
          acervo={acervoVisualizandoConvertido}
        />
      )}

      {itemVisualizando && (
        <ResumoItem
          isOpen={!!itemVisualizando}
          onClose={() => setItemVisualizando(null)}
          tipo={itemVisualizando.tipo}
          nome={itemVisualizando.nome}
          icone={itemVisualizando.icone ?? undefined}
          descricao={itemVisualizando.descricao}
          dominio={{
            name: itemVisualizando.dominio.name,
            areaConhecimento: itemVisualizando.dominio.areaConhecimento ?? undefined,
            peculiarId: itemVisualizando.dominio.peculiarId ?? undefined,
          }}
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
          onOpenPowerArrayDetails={(powerArrayId) => setItemAcervoResumoId(powerArrayId)}
          itemData={itemVisualizando}
          isLoadingVinculos={loadingVinculos}
        />
      )}

      <ResumoVinculoModal
        isOpen={!!itemPoderResumoSelecionado || !!itemAcervoResumoSelecionado}
        onClose={() => {
          setItemPoderResumoId(null);
          setItemAcervoResumoId(null);
        }}
        poder={itemPoderResumoSelecionado ?? undefined}
        acervo={itemAcervoResumoSelecionado ?? undefined}
      />

      {/* Resumo Modal Peculiaridade */}
      {peculiaridadeVisualizando && (
        <ResumoPeculiaridade
          isOpen={!!peculiaridadeVisualizando}
          onClose={() => setPeculiaridadeVisualizando(null)}
          peculiaridade={peculiaridadeVisualizando}
        />
      )}
    </div>
  );
}
