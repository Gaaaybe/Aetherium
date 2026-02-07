import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, EmptyState, toast } from '../../../shared/ui';
import { useAcervos } from '../hooks/useAcervos';
import { CriadorAcervo } from './CriadorAcervo';
import { ResumoAcervo } from './ResumoAcervo';
import type { Acervo } from '../types/acervo.types';
import { Package, Plus, Search } from 'lucide-react';

export function ListaAcervos() {
  const { acervos, deletarAcervo } = useAcervos();
  const [busca, setBusca] = useState('');
  const [modalCriar, setModalCriar] = useState(false);
  const [acervoEditando, setAcervoEditando] = useState<Acervo | null>(null);
  const [acervoVisualizando, setAcervoVisualizando] = useState<Acervo | null>(null);

  const acervosFiltrados = acervos.filter(a => 
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.descritor.toLowerCase().includes(busca.toLowerCase())
  );

  const handleDeletar = (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja deletar o acervo "${nome}"?`)) {
      deletarAcervo(id);
      toast.success(`Acervo "${nome}" deletado.`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" /> Acervos de Poderes
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {acervos.length} {acervos.length === 1 ? 'acervo' : 'acervos'}
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setModalCriar(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Novo Acervo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {acervos.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={busca}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
                  placeholder="Buscar acervos..."
                  className="pl-10"
                />
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
            <div className="space-y-3">
              {acervosFiltrados.map((acervo) => (
                <Card 
                  key={acervo.id} 
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setAcervoVisualizando(acervo)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {acervo.nome}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="font-medium">Descritor:</span> {acervo.descritor}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {acervo.poderes.length} {acervo.poderes.length === 1 ? 'poder' : 'poderes'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setAcervoEditando(acervo)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeletar(acervo.id, acervo.nome)}
                      >
                        Deletar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
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
      />

      {/* Modal Resumo/Visualização */}
      <ResumoAcervo
        isOpen={!!acervoVisualizando}
        onClose={() => setAcervoVisualizando(null)}
        acervo={acervoVisualizando}
      />
    </div>
  );
}
