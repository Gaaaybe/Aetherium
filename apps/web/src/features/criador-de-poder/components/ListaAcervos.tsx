import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, EmptyState, toast, Badge, Select, ConfirmDialog } from '../../../shared/ui';
import { usePowerArrays } from '../hooks/usePowerArrays';
import { CriadorAcervo } from './CriadorAcervo';
import { ResumoAcervo } from './ResumoAcervo';
import { acervoResponseToAcervo } from '../utils/poderApiConverter';
import { SwipeableAcervoCard } from './SwipeableAcervoCard';
import { DOMINIO_VISUAL } from './SwipeablePoderCard';
import type { Acervo } from '../types/acervo.types';
import type { AcervoResponse } from '../../../services/types';
import { Package, Plus, Search, Library } from 'lucide-react';

export function ListaAcervos() {
  const { acervos, deletar, atualizar, carregar } = usePowerArrays();
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState<'nome' | 'quantidade' | 'recentes'>('recentes');
  const [modalCriar, setModalCriar] = useState(false);
  const [acervoEditando, setAcervoEditando] = useState<Acervo | null>(null);
  const [acervoVisualizando, setAcervoVisualizando] = useState<Acervo | null>(null);
  const [togglePublicId, setTogglePublicId] = useState<string | null>(null);
  const [confirmarDeletar, setConfirmarDeletar] = useState<AcervoResponse | null>(null);

  const acervosFiltrados = useMemo(() => {
    const filtrados = acervos.filter((a: AcervoResponse) =>
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.descricao.toLowerCase().includes(busca.toLowerCase()),
    );

    return [...filtrados].sort((a, b) => {
      if (ordenacao === 'nome') return a.nome.localeCompare(b.nome);
      if (ordenacao === 'quantidade') return (b.powers?.length || 0) - (a.powers?.length || 0);
      if (ordenacao === 'recentes') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
  }, [acervos, busca, ordenacao]);

  // Agrupar acervos por domínio
  const acervosAgrupados = useMemo(() => {
    const map: Record<string, { nome: string, items: AcervoResponse[] }> = {};
    
    acervosFiltrados.forEach(acervo => {
      const domId = acervo.dominio.name || 'natural';
      if (!map[domId]) {
        const nomes: Record<string, string> = {
          natural: 'Natural', sagrado: 'Sagrado', sacrilegio: 'Sacrilégio',
          psiquico: 'Psíquico', cientifico: 'Científico', peculiar: 'Peculiar',
          'arma-branca': 'Arma Branca', 'arma-fogo': 'Arma de Fogo',
          'arma-tensao': 'Arma de Tensão', 'arma-explosiva': 'Arma Explosiva',
          'arma-tecnologica': 'Arma Tecnológica', desarmado: 'Domínio Desarmado'
        };
        map[domId] = { nome: nomes[domId] || domId, items: [] };
      }
      map[domId].items.push(acervo);
    });

    return map;
  }, [acervosFiltrados]);

  const dominiosOrdenados = useMemo(() => {
    const ordem = ['natural', 'sagrado', 'sacrilegio', 'psiquico', 'cientifico', 'peculiar', 'arma-branca', 'arma-fogo', 'arma-tensao', 'arma-explosiva', 'arma-tecnologica', 'desarmado'];
    return Object.keys(acervosAgrupados).sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
  }, [acervosAgrupados]);

  const handleDeletarConfirmado = async () => {
    if (!confirmarDeletar) return;
    const { id, nome } = confirmarDeletar;
    try {
      await deletar(id);
      toast.success(`Acervo "${nome}" deletado.`);
      setConfirmarDeletar(null);
    } catch {
      toast.error(`Erro ao deletar acervo "${nome}".`);
    }
  };

  const handleTogglePublic = async (acervo: AcervoResponse) => {
    setTogglePublicId(acervo.id);
    try {
      await atualizar(acervo.id, { isPublic: !acervo.isPublic });
      toast.success(acervo.isPublic ? `"${acervo.nome}" agora é privado.` : `"${acervo.nome}" publicado!`);
    } catch {
      toast.error('Erro ao alterar visibilidade.');
    } finally {
      setTogglePublicId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Library className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Acervos de Poderes
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {acervos.length} {acervos.length === 1 ? 'acervo' : 'acervos'} salvos
              </p>
            </div>
            <div className="flex items-center">
              <Button
                variant="primary"
                size="md"
                onClick={() => setModalCriar(true)}
                className="flex items-center gap-2 shadow-lg shadow-purple-500/20"
              >
                <Plus className="w-5 h-5" /> Novo Acervo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {acervos.length > 0 && (
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={busca}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
                  placeholder="Buscar acervos..."
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 min-w-[300px]">
                <Select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value as any)}
                  options={[
                    { value: 'recentes', label: 'Mais Recentes' },
                    { value: 'quantidade', label: 'Mais Poderes' },
                    { value: 'nome', label: 'Nome (A-Z)' },
                  ]}
                />
                {(busca !== '' || ordenacao !== 'recentes') && (
                  <Button variant="ghost" size="sm" onClick={() => { setBusca(''); setOrdenacao('recentes'); }}>
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          )}

          {acervosFiltrados.length === 0 && busca ? (
            <EmptyState
              icon={<Search className="w-12 h-12 text-gray-400" />}
              title="Nenhum acervo encontrado"
              description={`Nenhum acervo corresponde à busca "${busca}"`}
            />
          ) : acervos.length === 0 ? (
            <EmptyState
              icon={<Package className="w-12 h-12 text-gray-400" />}
              title="Nenhum acervo criado"
              description="Acervos são conjuntos de poderes com descritor comum. Crie seu primeiro acervo!"
              action={{
                label: 'Criar Acervo',
                onClick: () => setModalCriar(true),
                icon: <Plus className="w-4 h-4" />

              }}
            />
          ) : (
            <div className="space-y-12 pb-12">
              {dominiosOrdenados.map(domId => {
                const { nome, items: itensDoGrupo } = acervosAgrupados[domId];
                if (itensDoGrupo.length === 0) return null;
                const visualHeader = DOMINIO_VISUAL[domId] || DOMINIO_VISUAL.natural;

                return (
                  <div key={domId} className="space-y-6">
                    {/* Cabeçalho do Domínio */}
                    <div className="flex items-center gap-4 p-2 rounded-r-xl bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-900/20">
                      <div className={`w-1.5 h-8 rounded-full ${visualHeader.borderColor.replace('border-', 'bg-')} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
                      <h3 className={`text-xl font-black uppercase tracking-tighter whitespace-nowrap ${visualHeader.color} drop-shadow-sm`}>
                        {nome}
                      </h3>
                      <div className="h-px bg-gray-200 dark:bg-gray-700 w-full opacity-30"></div>
                      <Badge variant="secondary" className={`${visualHeader.color.replace('text-', 'bg-').replace('600', '100').replace('400', '900/40')} border-none px-3 font-bold shadow-sm`}>
                        {itensDoGrupo.length}
                      </Badge>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {itensDoGrupo.map((acervo) => (
                        <SwipeableAcervoCard
                          key={acervo.id}
                          acervo={acervo}
                          onEditar={() => setAcervoEditando(acervoResponseToAcervo(acervo))}
                          onDeletar={() => setConfirmarDeletar(acervo)}
                          onTogglePublic={() => handleTogglePublic(acervo)}
                          onVerResumo={() => setAcervoVisualizando(acervoResponseToAcervo(acervo))}
                          togglePublicId={togglePublicId}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Criar/Editar */}
      <CriadorAcervo
        isOpen={modalCriar || !!acervoEditando}
        onClose={() => {
          setModalCriar(false);
          setAcervoEditando(null);
        }}
        acervoInicial={acervoEditando || undefined}
        onSalvo={carregar}
      />

      {/* Modal Resumo/Visualização */}
      <ResumoAcervo
        isOpen={!!acervoVisualizando}
        onClose={() => setAcervoVisualizando(null)}
        acervo={acervoVisualizando}
      />

      <ConfirmDialog
        isOpen={!!confirmarDeletar}
        onClose={() => setConfirmarDeletar(null)}
        onConfirm={handleDeletarConfirmado}
        title="Deletar Acervo"
        message={`Tem certeza que deseja deletar o acervo "${confirmarDeletar?.nome}"? Esta ação removerá o agrupamento, mas os poderes individuais permanecerão na sua biblioteca.`}
        variant="danger"
        confirmText="Deletar"
      />
    </div>
  );
}
