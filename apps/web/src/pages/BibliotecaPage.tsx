import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, toast, EmptyState, Badge, Select, ConfirmDialog } from '../shared/ui';
import { usePoderes } from '../features/criador-de-poder/hooks/usePoderes';
import { SwipeablePoderCard, DOMINIO_VISUAL } from '../features/criador-de-poder/components/SwipeablePoderCard';
import { GerenciadorCustomizados } from '../features/criador-de-poder/components/GerenciadorCustomizados';
import { ListaAcervos } from '../features/criador-de-poder/components/ListaAcervos';
import { usePowerArrays } from '../features/criador-de-poder/hooks/usePowerArrays';
import { ResumoPoder } from '../features/criador-de-poder/components/ResumoPoder';
import { useItems } from '../features/criador-de-item/hooks/useItems';
import { ResumoItem } from '../features/criador-de-item/components/ResumoItem';
import { ResumoVinculoModal } from '../features/criador-de-item/components/ResumoVinculoModal';
import { SwipeableItemCard, TIPO_ITEM_VISUAL } from '../features/criador-de-item/components/SwipeableItemCard';
import { poderResponseToPoderSalvo, poderResponseToPoder, legacyPoderToCreatePayload } from '../features/criador-de-poder/utils/poderApiConverter';
import { calcularDetalhesPoder } from '../features/criador-de-poder/regras/calculadoraCusto';
import { useCatalog } from '../context/useCatalog';
import { useNavigate } from 'react-router-dom';
import { Library, Sparkles, Plus, Package, RefreshCw, AlertCircle, Download, Upload } from 'lucide-react';
import { getErrorMessage } from '../shared/utils/error-handler';
import type { PoderResponse, CreatePoderPayload, ItemResponse } from '../services/types';
import type { PoderSalvo } from '../features/criador-de-poder/types';
import { CriadorDePoderModal } from '../features/gerenciador-criaturas/components/CriadorDePoderModal';
import { updateLibraryItemPower } from '../services/items.service';
import { useAuth } from '../context/useAuth';
import { getPowerById } from '../services/powers.service';
import { canEditItemPower } from '../features/criador-de-item/utils/itemPowerPermissions';

export function BibliotecaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { poderes, loading, error, deletar, criar, atualizar, carregar: recarregar } = usePoderes();
  const { acervos } = usePowerArrays();
  const {
    items,
    loading: loadingItens,
    error: erroItens,
    atualizar: atualizarItem,
    deletar: deletarItem,
    copiar: copiarItem,
    carregar: recarregarItens,
    exportar: exportarItem,
    importar: importarItem,
  } = useItems();
  const { efeitos, modificacoes } = useCatalog();
  const [poderVisualizando, setPoderVisualizando] = useState<PoderResponse | null>(null);
  const [itemVisualizando, setItemVisualizando] = useState<ItemResponse | null>(null);
  const [itemPoderResumoId, setItemPoderResumoId] = useState<string | null>(null);
  const [itemAcervoResumoId, setItemAcervoResumoId] = useState<string | null>(null);
  const [itemPowerEditing, setItemPowerEditing] = useState<PoderResponse | null>(null);
  const [itemPowerDetails, setItemPowerDetails] = useState<Record<string, PoderResponse>>({});

  const poderVisualizandoConvertido = useMemo(() => {
    if (!poderVisualizando) return null;
    const poder = poderResponseToPoder(poderVisualizando);
    const detalhes = calcularDetalhesPoder(poder, efeitos, modificacoes);
    return { poder, detalhes };
  }, [poderVisualizando, efeitos, modificacoes]);

  const itemPoderesSelecionados = useMemo(() => {
    if (!itemVisualizando) return [];
    return itemVisualizando.powerIds
      .map((id) => itemPowerDetails[id] ?? poderes.find((poder) => poder.id === id))
      .filter((power): power is PoderResponse => !!power);
  }, [itemVisualizando, itemPowerDetails, poderes]);

  const itemAcervosSelecionados = useMemo(
    () => (itemVisualizando ? acervos.filter((acervo) => itemVisualizando.powerArrayIds.includes(acervo.id)) : []),
    [itemVisualizando, acervos],
  );

  const itemPoderResumoSelecionado = useMemo(
    () => (itemPoderResumoId
      ? itemPowerDetails[itemPoderResumoId] ?? poderes.find((poder) => poder.id === itemPoderResumoId)
      : undefined),
    [itemPoderResumoId, itemPowerDetails, poderes],
  );

  useEffect(() => {
    if (!itemVisualizando?.powerIds.length) return;
    let cancelled = false;
    Promise.all(itemVisualizando.powerIds.map((id) => getPowerById(id)))
      .then((details) => {
        if (!cancelled) {
          setItemPowerDetails((previous) => ({
            ...previous,
            ...Object.fromEntries(details.map((power) => [power.id, power])),
          }));
        }
      })
      .catch(() => {
        if (!cancelled) toast.error('Não foi possível carregar os poderes internos do item.');
      });
    return () => { cancelled = true; };
  }, [itemVisualizando?.id, itemVisualizando?.powerIds]);

  const itemAcervoResumoSelecionado = useMemo(
    () => (itemAcervoResumoId ? acervos.find((acervo) => acervo.id === itemAcervoResumoId) : undefined),
    [itemAcervoResumoId, acervos],
  );

  const [busca, setBusca] = useState('');
  const [carregandoId, setCarregandoId] = useState<string | null>(null);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [duplicandoId, setDuplicandoId] = useState<string | null>(null);
  const [exportandoId, setExportandoId] = useState<string | null>(null);
  const [exportandoTodos, setExportandoTodos] = useState(false);
  const [togglePublicId, setTogglePublicId] = useState<string | null>(null);
  const [buscaItens, setBuscaItens] = useState('');
  const [importando, setImportando] = useState(false);
  const [filtroDominio, setFiltroDominio] = useState<string>('todos');
  const [ordemItens, setOrdemItens] = useState<'nome' | 'nivel' | 'preco' | 'recentes'>('recentes');
  const [carregandoItemId, setCarregandoItemId] = useState<string | null>(null);
  const [deletandoItemId, setDeletandoItemId] = useState<string | null>(null);
  const [togglePublicItemId, setTogglePublicItemId] = useState<string | null>(null);
  const [exportandoItemId, setExportandoItemId] = useState<string | null>(null);
  const [importandoItem, setImportandoItem] = useState(false);
  
  const [confirmarDeletarPoder, setConfirmarDeletarPoder] = useState<PoderResponse | null>(null);
  const [confirmarDeletarItem, setConfirmarDeletarItem] = useState<ItemResponse | null>(null);

  const importInputRef = useRef<HTMLInputElement>(null);
  const importItemInputRef = useRef<HTMLInputElement>(null);
  const [abaAtiva, setAbaAtiva] = useState<'poderes' | 'itens' | 'acervos' | 'peculiaridades'>(() => {
    const saved = localStorage.getItem('biblioteca-aba-ativa');
    return (saved as 'poderes' | 'itens' | 'acervos' | 'peculiaridades') || 'poderes';
  });

  // Persistir aba ativa
  useEffect(() => {
    localStorage.setItem('biblioteca-aba-ativa', abaAtiva);
  }, [abaAtiva]);

  // Converte PoderResponse[] → PoderSalvo[] para exibição no SwipeablePoderCard
  const poderesSalvos = useMemo(() => poderes.map(poderResponseToPoderSalvo), [poderes]);

  const poderesFiltrados = useMemo(() => {
    return poderesSalvos.filter((p) => {
      const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || 
                        (p.descricao && p.descricao.toLowerCase().includes(busca.toLowerCase()));
      const matchDominio = filtroDominio === 'todos' || p.dominioId === filtroDominio;
      // Para o patamar, precisaríamos dos detalhes do poder (não estão em PoderSalvo diretamente)
      // Se necessário, faríamos uma filtragem mais profunda aqui
      return matchBusca && matchDominio;
    });
  }, [poderesSalvos, busca, filtroDominio]);

  const itensFiltrados = useMemo(() => {
    const filtrados = items.filter((item) => {
      const matchBusca = item.nome.toLowerCase().includes(buscaItens.toLowerCase()) || 
                        item.descricao.toLowerCase().includes(buscaItens.toLowerCase());
      const matchDominio = filtroDominio === 'todos' || item.dominio.name === filtroDominio;
      return matchBusca && matchDominio;
    });

    return [...filtrados].sort((a, b) => {
      if (ordemItens === 'nome') return a.nome.localeCompare(b.nome);
      if (ordemItens === 'nivel') return (b.nivelItem || 0) - (a.nivelItem || 0);
      if (ordemItens === 'preco') return (b.valorBase || 0) - (a.valorBase || 0);
      if (ordemItens === 'recentes') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
  }, [items, buscaItens, filtroDominio, ordemItens]);
  
  // Agrupar poderes por domínio para exibição organizada
  const dominiosMap = useMemo(() => {
    const map: Record<string, { nome: string, poderes: PoderSalvo[] }> = {};
    
    // Obter nomes reais dos domínios do contexto/data (simulado aqui ou importado)
    // Para simplificar, usamos um mapeamento estático baseado nos IDs conhecidos
    const nomesDominiios: Record<string, string> = {
      natural: 'Domínio Natural',
      sagrado: 'Domínio Sagrado',
      sacrilegio: 'Domínio Sacrilégio',
      psiquico: 'Domínio Psíquico',
      cientifico: 'Domínio Científico',
      peculiar: 'Domínio Peculiar',
      'arma-branca': 'Armas Brancas',
      'arma-fogo': 'Armas de Fogo',
      'arma-tensao': 'Armas de Tensão',
      'arma-explosiva': 'Armas Explosivas',
      'arma-tecnologica': 'Armas Tecnológicas',
      desarmado: 'Domínio Desarmado',
    };

    poderesFiltrados.forEach(p => {
      const domId = p.dominioId || 'natural';
      if (!map[domId]) {
        map[domId] = { 
          nome: nomesDominiios[domId] || `Domínio: ${domId}`, 
          poderes: [] 
        };
      }
      map[domId].poderes.push(p);
    });

    return map;
  }, [poderesFiltrados]);

  // Agrupar itens por tipo
  const itensAgrupados = useMemo(() => {
    const map: Record<string, { nome: string, items: ItemResponse[] }> = {};
    
    itensFiltrados.forEach(item => {
      const tipo = item.tipo;
      if (!map[tipo]) {
        const labels: Record<string, string> = {
          weapon: 'Armas',
          'defensive-equipment': 'Equipamentos Defensivos',
          consumable: 'Consumíveis',
          artifact: 'Artefatos',
          accessory: 'Acessórios',
          general: 'Itens Gerais',
          'upgrade-material': 'Materiais de Upgrade'
        };
        map[tipo] = { nome: labels[tipo] || tipo, items: [] };
      }
      map[tipo].items.push(item);
    });

    return map;
  }, [itensFiltrados]);

  const tiposOrdenados = useMemo(() => {
    const ordem = ['weapon', 'defensive-equipment', 'consumable', 'artifact', 'accessory', 'general', 'upgrade-material'];
    return Object.keys(itensAgrupados).sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
  }, [itensAgrupados]);

  // Lista de IDs de domínios ordenados alfabeticamente ou por importância
  const dominiosOrdenados = useMemo(() => {
    return Object.keys(dominiosMap).sort((a, b) => {
      // Prioridade para domínios espirituais, depois Armas
      const prioridade = ['natural', 'sagrado', 'sacrilegio', 'psiquico', 'cientifico', 'peculiar'];
      const idxA = prioridade.indexOf(a);
      const idxB = prioridade.indexOf(b);
      
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [dominiosMap]);

  // ─── Ações ────────────────────────────────────────────────────────────────────

  /**
   * Carrega poder no editor via localStorage (bridge com usePoderPersistence).
   */
  const handleCarregar = (poderResp: PoderResponse) => {
    setCarregandoId(poderResp.id);
    try {
      const poderSalvo = poderResponseToPoderSalvo(poderResp);
      localStorage.setItem('criador-de-poder-carregar', JSON.stringify(poderSalvo));
      localStorage.setItem('criador-aba-ativa', JSON.stringify('poderes'));
      navigate('/criador');
      toast.success(`Poder "${poderResp.nome}" carregado!`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCarregandoId(null);
    }
  };

  const handleDeletarPoderConfirmado = async () => {
    if (!confirmarDeletarPoder) return;
    const { id, nome } = confirmarDeletarPoder;
    setDeletandoId(id);
    try {
      await deletar(id);
      toast.success(`Poder "${nome}" deletado.`);
      setConfirmarDeletarPoder(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletandoId(null);
    }
  };

  const handleDuplicar = async (poder: PoderResponse, nome: string) => {
    setDuplicandoId(poder.id);
    try {
      const payload: CreatePoderPayload = {
        nome: `Cópia de ${poder.nome}`,
        descricao: poder.descricao,
        dominio: {
          name: poder.dominio.name,
          areaConhecimento: poder.dominio.areaConhecimento ?? undefined,
          peculiarId: poder.dominio.peculiarId ?? undefined,
        },
        parametros: { ...poder.parametros },
        effects: poder.effects.map((e) => ({
          effectBaseId: e.effectBaseId,
          grau: e.grau,
          configuracaoId: e.configuracaoId ?? undefined,
          inputValue: e.inputValue ?? undefined,
          modifications: e.modifications.map((m) => ({
            modificationBaseId: m.modificationBaseId,
            scope: m.scope,
            grau: m.grau ?? undefined,
            parametros: m.parametros ?? undefined,
            nota: m.nota ?? undefined,
          })),
          nota: e.nota ?? undefined,
        })),
        globalModifications: poder.globalModifications.map((m) => ({
          modificationBaseId: m.modificationBaseId,
          scope: m.scope,
          grau: m.grau ?? undefined,
          parametros: m.parametros ?? undefined,
          nota: m.nota ?? undefined,
        })),
        isPublic: false,
        notas: poder.notas ?? undefined,
      };
      await criar(payload);
      toast.success(`Cópia de "${nome}" criada.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDuplicandoId(null);
    }
  };

  const handleTogglePublic = async (poder: PoderResponse) => {
    setTogglePublicId(poder.id);
    try {
      await atualizar(poder.id, { isPublic: !poder.isPublic });
      toast.success(poder.isPublic ? `"${poder.nome}" agora é privado.` : `"${poder.nome}" publicado!`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglePublicId(null);
    }
  };

  const handleCarregarItem = (item: ItemResponse) => {
    setCarregandoItemId(item.id);
    try {
      localStorage.setItem('criador-de-item-carregar', JSON.stringify(item));
      localStorage.setItem('criador-aba-ativa', JSON.stringify('itens'));
      navigate('/criador');
      toast.success(`Item "${item.nome}" carregado no criador.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCarregandoItemId(null);
    }
  };

  const handleDeletarItemConfirmado = async () => {
    if (!confirmarDeletarItem) return;
    const { id, nome } = confirmarDeletarItem;
    setDeletandoItemId(id);
    try {
      await deletarItem(id);
      toast.success(`Item "${nome}" deletado.`);
      setConfirmarDeletarItem(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletandoItemId(null);
    }
  };

  const handleTogglePublicItem = async (item: ItemResponse) => {
    setTogglePublicItemId(item.id);
    try {
      await atualizarItem(item.id, {
        tipo: item.tipo,
        isPublic: !item.isPublic,
      });
      toast.success(item.isPublic ? `"${item.nome}" agora é privado.` : `"${item.nome}" publicado!`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglePublicItemId(null);
    }
  };

  const handleDuplicarItem = async (item: ItemResponse) => {
    setCarregandoItemId(item.id); 
    try {
      await copiarItem(item.id);
      toast.success(`Cópia de "${item.nome}" criada.`);
      recarregarItens();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCarregandoItemId(null);
    }
  };

  const handleUsarComoTemplate = (item: ItemResponse) => {
    setCarregandoItemId(item.id);
    try {
      localStorage.setItem('criador-de-item-template', JSON.stringify(item));
      localStorage.setItem('criador-aba-ativa', JSON.stringify('itens'));
      navigate('/criador');
      toast.success(`Usando "${item.nome}" como base para novo item.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCarregandoItemId(null);
    }
  };

  const handleExportarItem = async (item: ItemResponse) => {
    setExportandoItemId(item.id);
    try {
      const sanitized = await exportarItem(item.id);
      const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.nome.replace(/\s+/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`"${item.nome}" exportado!`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExportandoItemId(null);
    }
  };

  const handleImportarItem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportandoItem(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const wrappedItems = parsed?.items ?? parsed?.itens;
      const lista = Array.isArray(parsed)
        ? parsed
        : Array.isArray(wrappedItems)
          ? wrappedItems
          : [parsed];
      let ok = 0;
      let falhou = 0;
      const avisos: string[] = [];
      for (const rawItem of lista) {
        try {
          const imported = await importarItem(rawItem);
          avisos.push(...(imported.importWarnings ?? []));
          ok++;
        } catch (err) {
          console.error(err);
          falhou++;
        }
      }
      if (ok > 0) {
        toast.success(`Sucesso! ${ok} item(ns) importado(s) e salvo(s) na biblioteca.`);
        recarregarItens();
      }
      if (falhou > 0) toast.error(`${falhou} item(ns) falhou na importação devido a erros de validação.`);
      if (avisos.length > 0) {
        toast.info(`Importação recuperada com ${avisos.length} ajuste(s) de compatibilidade.`);
        console.info('Ajustes realizados durante a importação:', avisos);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Arquivo inválido. Certifique-se de usar um JSON exportado pelo Aetherium.');
    } finally {
      setImportandoItem(false);
    }
  };

  const handleExportarTodos = () => {
    if (poderes.length === 0) return;
    setExportandoTodos(true);
    try {
      const blob = new Blob([JSON.stringify(poderes, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `biblioteca-poderes-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${poderes.length} poderes exportados!`);
    } catch {
      toast.error('Erro ao exportar poderes.');
    } finally {
      setExportandoTodos(false);
    }
  };

  const handleImportar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportando(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      
      // Suporte para wrapper {"poderes": [...]} comum em backups manuais
      let rawLista = parsed;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray((parsed as any).poderes)) {
        rawLista = (parsed as any).poderes;
      }

      const lista = Array.isArray(rawLista) ? rawLista : [rawLista];
      let ok = 0;
      let falhou = 0;
      for (const item of lista) {
        try {
          const payload = legacyPoderToCreatePayload(item);
          await criar(payload);
          ok++;
        } catch {
          falhou++;
        }
      }
      if (ok > 0) toast.success(`Sucesso! ${ok} poder${ok > 1 ? 'es' : ''} importado${ok > 1 ? 's' : ''} e salvo${ok > 1 ? 's' : ''} na biblioteca.`);
      if (falhou > 0) toast.error(`${falhou} poder${falhou > 1 ? 'es' : ''} falhou na importação devido a erros de formato.`);
    } catch (err: any) {
      toast.error(err?.message || 'Arquivo inválido. Certifique-se de usar um JSON exportado pelo Aetherium.');
    } finally {
      setImportando(false);
    }
  };

  const handleExportar = (poder: PoderResponse, nome: string) => {
    setExportandoId(poder.id);
    try {
      const blob = new Blob([JSON.stringify(poder, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nome.replace(/\s+/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`"${nome}" exportado!`);
    } catch {
      toast.error('Erro ao exportar poder.');
    } finally {
      setExportandoId(null);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Abas de navegação */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['poderes', 'itens', 'acervos', 'peculiaridades'] as const).map((aba) => {
          const labels = {
            poderes: 'Poderes Salvos',
            itens: 'Itens Salvos',
            acervos: 'Acervos',
            peculiaridades: 'Peculiaridades',
          };
          const icons = {
            poderes: <Library className="w-4 h-4" />,
            itens: <Package className="w-4 h-4" />,
            acervos: <Package className="w-4 h-4" />,
            peculiaridades: <Sparkles className="w-4 h-4" />,
          };
          return (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                abaAtiva === aba
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {icons[aba]} {labels[aba]}
            </button>
          );
        })}
      </div>

      {/* ── Aba Poderes ── */}
      {abaAtiva === 'poderes' && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Library className="w-5 h-5" /> Biblioteca de Poderes
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {loading
                      ? 'Carregando…'
                      : `${poderes.length} ${poderes.length === 1 ? 'poder salvo' : 'poderes salvos'}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => recarregar()}
                    disabled={loading}
                    className="flex items-center gap-2"
                    aria-label="Recarregar poderes"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportarTodos}
                    disabled={loading || exportandoTodos || poderes.length === 0}
                    className="flex items-center gap-2"
                    aria-label="Exportar todos os poderes"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => importInputRef.current?.click()}
                    disabled={importando}
                    className="flex items-center gap-2"
                    aria-label="Importar poderes de arquivo JSON"
                  >
                    <Upload className="w-4 h-4" />
                    {importando ? 'Importando…' : 'Importar JSON'}
                  </Button>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportar}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {poderes.length > 0 && !loading && (
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              )}
            </CardContent>
          </Card>

          {/* Estado de erro */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Lista de poderes */}
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={abaAtiva === 'poderes' ? busca : buscaItens}
                onChange={(e) => (abaAtiva === 'poderes' ? setBusca(e.target.value) : setBuscaItens(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 min-w-[200px]">
              <Select
                value={filtroDominio}
                onChange={(e) => setFiltroDominio(e.target.value)}
                options={[
                  { value: 'todos', label: 'Todos os Domínios' },
                  ...Object.keys(DOMINIO_VISUAL).map(id => {
                    const nomes: Record<string, string> = {
                      natural: 'Natural', sagrado: 'Sagrado', sacrilegio: 'Sacrilégio',
                      psiquico: 'Psíquico', cientifico: 'Científico', peculiar: 'Peculiar',
                      'arma-branca': 'Arma Branca', 'arma-fogo': 'Arma de Fogo',
                      'arma-tensao': 'Arma de Tensão', 'arma-explosiva': 'Arma Explosiva',
                      'arma-tecnologica': 'Arma Tecnológica', desarmado: 'Domínio Desarmado'
                    };
                    return { value: id, label: nomes[id] || id };
                  })
                ]}
              />
              {(filtroDominio !== 'todos' || busca !== '' || buscaItens !== '') && (
                <Button variant="ghost" size="sm" onClick={() => { setFiltroDominio('todos'); setBusca(''); setBuscaItens(''); }}>
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {!loading && poderesFiltrados.length === 0 ? (
            <EmptyState
              icon={<Library className="w-12 h-12 text-gray-400" />}
              title={poderes.length === 0 ? 'Nenhum poder salvo ainda' : 'Nenhum poder encontrado'}
              description={
                poderes.length === 0
                  ? 'Crie seu primeiro poder e salve na biblioteca para acessá-lo aqui!'
                  : 'Tente buscar com outros termos'
              }
              action={{
                label: 'Criar Novo Poder',
                onClick: () => navigate('/'),
                icon: <Plus className="w-4 h-4" />,
              }}
            />
          ) : (
            <div className="space-y-12">
              {dominiosOrdenados.map(domId => {
                const { nome, poderes: poderesDoGrupo } = dominiosMap[domId];
                if (poderesDoGrupo.length === 0) return null;
                const visualHeader = DOMINIO_VISUAL[domId] || DOMINIO_VISUAL.natural;

                return (
                  <div key={domId} className="space-y-6">
                    <div className="flex items-center gap-4 p-2 rounded-r-xl bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-900/20">
                      <div className={`w-1.5 h-8 rounded-full ${visualHeader.borderColor.replace('border-', 'bg-')} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
                      <h3 className={`text-xl font-black uppercase tracking-tighter whitespace-nowrap ${visualHeader.color} drop-shadow-sm`}>
                        {nome}
                      </h3>
                      <div className="h-px bg-gray-200 dark:bg-gray-700 w-full opacity-30"></div>
                      <Badge variant="secondary" className={`${visualHeader.color.replace('text-', 'bg-').replace('600', '100').replace('400', '900/40')} border-none px-3 font-bold shadow-sm`}>
                        {poderesDoGrupo.length}
                      </Badge>
                    </div>
                    
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {poderesDoGrupo.map((poderSalvo) => {
                        const poderResp = poderes.find((p) => p.id === poderSalvo.id)!;
                        return (
                          <SwipeablePoderCard
                            key={poderSalvo.id}
                            poder={poderSalvo}
                            isPublic={poderResp.isPublic}
                            onCarregar={() => handleCarregar(poderResp)}
                            onDuplicar={() => handleDuplicar(poderResp, poderSalvo.nome)}
                            onExportar={() => handleExportar(poderResp, poderSalvo.nome)}
                            onDeletar={() => setConfirmarDeletarPoder(poderResp)}
                            onTogglePublic={() => handleTogglePublic(poderResp)}
                            onVerResumo={() => setPoderVisualizando(poderResp)}
                            formatarData={formatarData}
                            carregandoId={carregandoId}
                            deletandoId={deletandoId}
                            duplicandoId={duplicandoId}
                            exportandoId={exportandoId}
                            togglePublicId={togglePublicId}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Aba Itens ── */}
      {abaAtiva === 'itens' && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" /> Biblioteca de Itens
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {loadingItens
                      ? 'Carregando…'
                      : `${items.length} ${items.length === 1 ? 'item salvo' : 'itens salvos'}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => recarregarItens()}
                    disabled={loadingItens}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingItens ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => importItemInputRef.current?.click()}
                    disabled={importandoItem}
                    className="flex items-center gap-2"
                    aria-label="Importar itens de arquivo JSON"
                  >
                    <Upload className="w-4 h-4" />
                    {importandoItem ? 'Importando…' : 'Importar JSON'}
                  </Button>
                  <input
                    ref={importItemInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportarItem}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {items.length > 0 && !loadingItens && (
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar por nome ou descrição..."
                      value={buscaItens}
                      onChange={(e) => setBuscaItens(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 min-w-[300px]">
                    <Select
                      value={filtroDominio}
                      onChange={(e) => setFiltroDominio(e.target.value)}
                      options={[
                        { value: 'todos', label: 'Todos os Domínios' },
                        ...Object.keys(DOMINIO_VISUAL).map(id => {
                          const nomes: Record<string, string> = {
                            natural: 'Natural', sagrado: 'Sagrado', sacrilegio: 'Sacrilégio',
                            psiquico: 'Psíquico', cientifico: 'Científico', peculiar: 'Peculiar',
                            'arma-branca': 'Arma Branca', 'arma-fogo': 'Arma de Fogo',
                            'arma-tensao': 'Arma de Tensão', 'arma-explosiva': 'Arma Explosiva',
                            'arma-tecnologica': 'Arma Tecnológica', desarmado: 'Domínio Desarmado'
                          };
                          return { value: id, label: nomes[id] || id };
                        })
                      ]}
                    />
                    <Select
                      value={ordemItens}
                      onChange={(e) => setOrdemItens(e.target.value as any)}
                      options={[
                        { value: 'recentes', label: 'Mais Recentes' },
                        { value: 'preco', label: 'Preço (Maior)' },
                        { value: 'nivel', label: 'Nível (Maior)' },
                        { value: 'nome', label: 'Nome (A-Z)' },
                      ]}
                    />
                    {(filtroDominio !== 'todos' || buscaItens !== '') && (
                      <Button variant="ghost" size="sm" onClick={() => { setFiltroDominio('todos'); setBuscaItens(''); }}>
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {erroItens && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{erroItens}</span>
            </div>
          )}

          {!loadingItens && itensFiltrados.length === 0 ? (
            <EmptyState
              icon={<Package className="w-12 h-12 text-gray-400" />}
              title={items.length === 0 ? 'Nenhum item salvo ainda' : 'Nenhum item encontrado'}
              description={
                items.length === 0
                  ? 'Crie seu primeiro item para gerenciar por aqui.'
                  : 'Tente buscar com outros termos.'
              }
              action={{
                label: 'Criar Novo Item',
                onClick: () => {
                  localStorage.setItem('criador-aba-ativa', JSON.stringify('itens'));
                  navigate('/criador');
                },
                icon: <Plus className="w-4 h-4" />,
              }}
            />
          ) : (
            <div className="space-y-12 pb-12">
              {tiposOrdenados.map(tipoId => {
                const { nome, items: itensDoGrupo } = itensAgrupados[tipoId];
                if (itensDoGrupo.length === 0) return null;
                const visualHeader = TIPO_ITEM_VISUAL[tipoId] || TIPO_ITEM_VISUAL.general;

                return (
                  <div key={tipoId} className="space-y-6">
                    <div className="flex items-center gap-4 p-2 rounded-r-xl bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-900/20">
                      <div className={`w-1.5 h-8 rounded-full ${visualHeader.border.replace('border-', 'bg-')} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
                      <h3 className={`text-xl font-black uppercase tracking-tighter whitespace-nowrap ${visualHeader.color} drop-shadow-sm`}>
                        {nome}
                      </h3>
                      <div className="h-px bg-gray-200 dark:bg-gray-700 w-full opacity-30"></div>
                      <Badge variant="secondary" className={`${visualHeader.color.replace('text-', 'bg-').replace('600', '100').replace('400', '900/40')} border-none px-3 font-bold shadow-sm`}>
                        {itensDoGrupo.length}
                      </Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {itensDoGrupo.map((item) => (
                        <SwipeableItemCard
                          key={item.id}
                          item={item}
                          onCarregar={() => handleCarregarItem(item)}
                          onDuplicar={() => handleDuplicarItem(item)}
                          onDeletar={() => setConfirmarDeletarItem(item)}
                          onTogglePublic={() => handleTogglePublicItem(item)}
                          onVerResumo={() => setItemVisualizando(item)}
                          onUsarComoTemplate={() => handleUsarComoTemplate(item)}
                          onExportar={() => handleExportarItem(item)}
                          formatarData={formatarData}
                          carregandoId={carregandoItemId}
                          duplicandoId={carregandoItemId}
                          deletandoId={deletandoItemId}
                          togglePublicId={togglePublicItemId}
                          exportandoId={exportandoItemId}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Aba Acervos ── */}
      {abaAtiva === 'acervos' && <ListaAcervos />}

      {/* ── Aba Peculiaridades ── */}
      {abaAtiva === 'peculiaridades' && <GerenciadorCustomizados />}

      {/* Modal Resumo do Poder */}
      {poderVisualizandoConvertido && (
        <ResumoPoder
          isOpen={!!poderVisualizando}
          onClose={() => setPoderVisualizando(null)}
          poder={poderVisualizandoConvertido.poder}
          detalhes={poderVisualizandoConvertido.detalhes}
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
        />
      )}

      <ResumoVinculoModal
        isOpen={!!itemPoderResumoSelecionado || !!itemAcervoResumoSelecionado}
        onClose={() => {
          setItemPoderResumoId(null);
          setItemAcervoResumoId(null);
        }}
        poder={itemPoderResumoSelecionado}
        acervo={itemAcervoResumoSelecionado}
        onEditPower={itemPoderResumoSelecionado && itemVisualizando && canEditItemPower({
          currentUserId: user?.id,
          isAdmin: user?.isAdmin,
          itemUserId: itemVisualizando.userId,
          powerUserId: itemPoderResumoSelecionado.userId,
        }) ? () => {
          setItemPowerEditing(itemPoderResumoSelecionado);
          setItemPoderResumoId(null);
        } : undefined}
      />

      {itemPowerEditing && itemVisualizando && (
        <CriadorDePoderModal
          isOpen
          onClose={() => setItemPowerEditing(null)}
          poderParaEditar={poderResponseToPoder(itemPowerEditing) as any}
          onUpdateRequest={async (powerId, payload) => {
            const result = await updateLibraryItemPower(
              itemVisualizando.id,
              powerId,
              payload,
              itemPowerEditing.updatedAt,
            );
            setItemVisualizando(result.item);
            setItemPowerDetails((previous) => {
              const next = { ...previous };
              delete next[powerId];
              next[result.power.id] = result.power;
              return next;
            });
            await Promise.all([recarregar(), recarregarItens()]);
            return result.power;
          }}
          onSave={() => setItemPowerEditing(null)}
        />
      )}

      {/* Modais de Confirmação */}
      <ConfirmDialog
        isOpen={!!confirmarDeletarPoder}
        onClose={() => setConfirmarDeletarPoder(null)}
        onConfirm={handleDeletarPoderConfirmado}
        title="Deletar Poder"
        message={`Tem certeza que deseja deletar o poder "${confirmarDeletarPoder?.nome}" da sua biblioteca? Esta ação não pode ser desfeita.`}
        variant="danger"
        confirmText="Deletar"
      />

      <ConfirmDialog
        isOpen={!!confirmarDeletarItem}
        onClose={() => setConfirmarDeletarItem(null)}
        onConfirm={handleDeletarItemConfirmado}
        title="Deletar Item"
        message={`Tem certeza que deseja deletar o item "${confirmarDeletarItem?.nome}" da sua biblioteca? Esta ação não pode ser desfeita.`}
        variant="danger"
        confirmText="Deletar"
      />
    </div>
  );
}
