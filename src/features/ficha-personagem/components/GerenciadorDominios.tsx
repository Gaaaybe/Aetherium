/**
 * Gerenciador de Domínios do Personagem
 * CRUD de domínios com seleção de maestria
 */

import { useState } from 'react';
import type { Domain } from '../types';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Select } from '../../../shared/ui/Select';
import { Badge } from '../../../shared/ui/Badge';
import { Modal } from '../../../shared/ui/Modal';

interface GerenciadorDominiosProps {
  dominios: Domain[];
  onAdicionarDominio: (nome: string, mastery: Domain['mastery'], descricao?: string) => void;
  onEditarDominio: (dominioId: string, updates: Partial<Omit<Domain, 'id'>>) => void;
  onRemoverDominio: (dominioId: string) => void;
  poderesVinculados?: Record<string, number>; // dominioId -> quantidade de poderes
}

export function GerenciadorDominios({
  dominios,
  onAdicionarDominio,
  onEditarDominio,
  onRemoverDominio,
  poderesVinculados = {},
}: GerenciadorDominiosProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Domain | null>(null);
  const [nome, setNome] = useState('');
  const [mastery, setMastery] = useState<Domain['mastery']>('Praticante');
  const [descricao, setDescricao] = useState('');

  const maestriaModificadores = {
    Iniciante: '+1 PdA/grau',
    Praticante: 'Normal',
    Mestre: '-1 PdA/grau',
  };

  const maestriaColors = {
    Iniciante: 'bg-red-100 text-red-800',
    Praticante: 'bg-blue-100 text-blue-800',
    Mestre: 'bg-green-100 text-green-800',
  };

  const handleAbrirModal = (dominio?: Domain) => {
    if (dominio) {
      setEditando(dominio);
      setNome(dominio.name);
      setMastery(dominio.mastery);
      setDescricao(dominio.description || '');
    } else {
      setEditando(null);
      setNome('');
      setMastery('Praticante');
      setDescricao('');
    }
    setModalAberto(true);
  };

  const handleSalvar = () => {
    if (!nome.trim()) return;

    if (editando) {
      onEditarDominio(editando.id, {
        name: nome,
        mastery,
        description: descricao || undefined,
      });
    } else {
      onAdicionarDominio(nome, mastery, descricao || undefined);
    }

    setModalAberto(false);
  };

  const handleRemover = (dominioId: string) => {
    const qtdPoderes = poderesVinculados[dominioId] || 0;
    
    if (qtdPoderes > 0) {
      alert(`Não é possível remover domínio com ${qtdPoderes} poder(es) vinculado(s)`);
      return;
    }

    if (confirm('Deseja realmente remover este domínio?')) {
      onRemoverDominio(dominioId);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Domínios</h3>
            <p className="text-sm text-gray-600 mt-1">
              Domínios afetam o custo dos poderes através da maestria
            </p>
          </div>
          <Button onClick={() => handleAbrirModal()}>
            + Novo Domínio
          </Button>
        </div>

        {/* Info de Maestria */}
        <div className="p-3 bg-blue-50 rounded text-sm space-y-1">
          <p className="font-semibold text-blue-900">Níveis de Maestria:</p>
          <p className="text-blue-800"><strong>Iniciante:</strong> Poderes custam +1 PdA por grau</p>
          <p className="text-blue-800"><strong>Praticante:</strong> Custo normal dos poderes</p>
          <p className="text-blue-800"><strong>Mestre:</strong> Poderes custam -1 PdA por grau</p>
        </div>

        {/* Lista de Domínios */}
        {dominios.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum domínio criado ainda</p>
            <p className="text-sm mt-1">Domínios agrupam poderes e aplicam maestria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dominios.map((dominio) => (
              <div
                key={dominio.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-lg">{dominio.name}</h4>
                      <Badge className={maestriaColors[dominio.mastery]}>
                        {dominio.mastery}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        {maestriaModificadores[dominio.mastery]}
                      </Badge>
                    </div>
                    
                    {dominio.description && (
                      <p className="text-sm text-gray-600 mb-2">{dominio.description}</p>
                    )}
                    
                    {poderesVinculados[dominio.id] > 0 && (
                      <p className="text-xs text-gray-500">
                        {poderesVinculados[dominio.id]} poder(es) vinculado(s)
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAbrirModal(dominio)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemover(dominio.id)}
                      disabled={poderesVinculados[dominio.id] > 0}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? 'Editar Domínio' : 'Novo Domínio'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Nome do Domínio *
            </label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Fogo, Gelo, Telepatia, Combate..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Nível de Maestria *
            </label>
            <Select
              value={mastery}
              onChange={(e) => setMastery(e.target.value as Domain['mastery'])}
              options={[
                { value: 'Iniciante', label: 'Iniciante (+1 PdA/grau)' },
                { value: 'Praticante', label: 'Praticante (Normal)' },
                { value: 'Mestre', label: 'Mestre (-1 PdA/grau)' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Descrição (Opcional)
            </label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o domínio..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSalvar} disabled={!nome.trim()} className="flex-1">
              {editando ? 'Salvar' : 'Criar'}
            </Button>
            <Button variant="secondary" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
