/**
 * Componente de Biblioteca de Personagens
 * Lista, busca e gerencia personagens salvos
 */

import { useState } from 'react';
import { useBibliotecaPersonagens } from '../hooks/useBibliotecaPersonagens';
import { calcularRankCalamidade } from '../regras/calculadoraPersonagem';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog';
import { Badge } from '../../../shared/ui/Badge';

interface BibliotecaPersonagensProps {
  onEdit: (id: string) => void;
  onCreateNew: () => void;
}

export function BibliotecaPersonagens({ onEdit, onCreateNew }: BibliotecaPersonagensProps) {
  const {
    personagens,
    buscarPersonagem,
    deletarPersonagem,
    duplicarPersonagem,
  } = useBibliotecaPersonagens();

  console.log('Personagens na biblioteca:', personagens);

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filtrar personagens por nome
  const personagensFiltrados = personagens.filter((p) =>
    p.header.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await deletarPersonagem(id);
    setDeleteConfirm(null);
  };

  const handleDuplicate = async (id: string) => {
    await duplicarPersonagem(id);
  };

  const handleExport = (id: string) => {
    const personagem = buscarPersonagem(id);
    if (personagem) {
      const json = JSON.stringify(personagem, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${personagem.header.name.replace(/\s+/g, '_')}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header com busca e criar novo */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Buscar personagem..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={onCreateNew} variant="primary">
          + Novo Personagem
        </Button>
      </div>

      {/* Lista de personagens */}
      {personagensFiltrados.length === 0 ? (
        <EmptyState
          title={searchTerm ? 'Nenhum personagem encontrado' : 'Nenhum personagem criado'}
          description={
            searchTerm
              ? 'Tente buscar com outro termo'
              : 'Crie seu primeiro personagem para começar'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personagensFiltrados.map((personagem) => (
            <Card key={personagem.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                {/* Nome e nível */}
                <div>
                  <h3 className="text-lg font-bold">{personagem.header.name}</h3>
                  <div className="flex gap-2 items-center text-sm text-gray-600">
                    <Badge variant="info">Nível {personagem.header.level}</Badge>
                    <Badge variant="secondary">{calcularRankCalamidade(personagem.header.level)}</Badge>
                  </div>
                </div>

                {/* Identidade e Origem */}
                {personagem.header.identity && (
                  <p className="text-sm text-gray-700 italic">{personagem.header.identity}</p>
                )}
                {personagem.header.origin && (
                  <p className="text-xs text-gray-500">Origem: {personagem.header.origin}</p>
                )}

                {/* Stats rápidos */}
                <div className="flex gap-3 text-xs text-gray-600">
                  <span>PdA: {personagem.pdaTotal}</span>
                  <span>Poderes: {personagem.poderes.length}</span>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    onClick={() => onEdit(personagem.id)}
                    variant="primary"
                    size="sm"
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() => handleDuplicate(personagem.id)}
                    variant="secondary"
                    size="sm"
                  >
                    Duplicar
                  </Button>
                  <Button
                    onClick={() => handleExport(personagem.id)}
                    variant="secondary"
                    size="sm"
                  >
                    Exportar
                  </Button>
                  <Button
                    onClick={() => setDeleteConfirm(personagem.id)}
                    variant="danger"
                    size="sm"
                  >
                    Deletar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de confirmação de exclusão */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar exclusão"
        message={deleteConfirm ? `Tem certeza que deseja deletar "${
          buscarPersonagem(deleteConfirm)?.header.name
        }"? Esta ação não pode ser desfeita.` : ''}
        onConfirm={() => {
          if (deleteConfirm) handleDelete(deleteConfirm);
        }}
        confirmText="Deletar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
