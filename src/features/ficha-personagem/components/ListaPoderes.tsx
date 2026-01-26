/**
 * Lista de Poderes do Personagem
 * Cards com ações: ativar/desativar, trocar domínio, remover, ver detalhes
 */

import { useState } from 'react';
import type { PersonagemPoder, Domain } from '../types';
import { Card } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Badge } from '../../../shared/ui/Badge';
import { Select } from '../../../shared/ui/Select';
import { Modal } from '../../../shared/ui/Modal';

interface ListaPoderesProps {
  poderes: PersonagemPoder[];
  dominios: Domain[];
  onAlternarAtivo: (poderId: string) => void;
  onTrocarDominio: (poderId: string, novoDominioId: string) => void;
  onRemover: (poderId: string) => void;
}

export function ListaPoderes({
  poderes,
  dominios,
  onAlternarAtivo,
  onTrocarDominio,
  onRemover,
}: ListaPoderesProps) {
  const [detalhesPoderAberto, setDetalhesPoderAberto] = useState<PersonagemPoder | null>(null);
  const [trocarDominioAberto, setTrocarDominioAberto] = useState<PersonagemPoder | null>(null);
  const [novoDominioId, setNovoDominioId] = useState('');

  const getDominioNome = (dominioId: string) => {
    return dominios.find(d => d.id === dominioId)?.name || 'Desconhecido';
  };

  const getDominioMaestria = (dominioId: string) => {
    return dominios.find(d => d.id === dominioId)?.mastery || 'Praticante';
  };

  const handleAbrirTrocarDominio = (poder: PersonagemPoder) => {
    setTrocarDominioAberto(poder);
    setNovoDominioId(poder.dominioId);
  };

  const handleConfirmarTrocaDominio = () => {
    if (trocarDominioAberto && novoDominioId !== trocarDominioAberto.dominioId) {
      onTrocarDominio(trocarDominioAberto.id, novoDominioId);
    }
    setTrocarDominioAberto(null);
  };

  const handleRemover = (poder: PersonagemPoder) => {
    if (confirm(`Deseja realmente remover o poder "${poder.poder.nome}"?`)) {
      onRemover(poder.id);
    }
  };

  if (poderes.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg">Nenhum poder adicionado ainda</p>
          <p className="text-sm mt-1">
            Clique em "Adicionar Poder" para vincular poderes da biblioteca
          </p>
        </div>
      </Card>
    );
  }

  // Agrupar por domínio
  const poderesPorDominio = poderes.reduce((acc, poder) => {
    const dominio = poder.dominioId;
    if (!acc[dominio]) acc[dominio] = [];
    acc[dominio].push(poder);
    return acc;
  }, {} as Record<string, PersonagemPoder[]>);

  return (
    <div className="space-y-4">
      {Object.entries(poderesPorDominio).map(([dominioId, poderesDoDominio]) => (
        <Card key={dominioId} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-lg">Domínio: {getDominioNome(dominioId)}</h4>
              <Badge variant="secondary" size="sm">
                {getDominioMaestria(dominioId)}
              </Badge>
            </div>
            <span className="text-sm text-gray-600">
              {poderesDoDominio.length} poder(es)
            </span>
          </div>

          <div className="space-y-2">
            {poderesDoDominio.map((poder) => (
              <div
                key={poder.id}
                className={`p-3 border rounded-lg transition-all ${
                  poder.ativo
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Nome e Status */}
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-bold truncate">{poder.poder.nome}</h5>
                      {poder.ativo ? (
                        <Badge variant="success" size="sm">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary" size="sm">Inativo</Badge>
                      )}
                    </div>

                    {/* Descrição */}
                    {poder.poder.descricao && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {poder.poder.descricao}
                      </p>
                    )}

                    {/* Estatísticas */}
                    <div className="flex flex-wrap gap-3 text-xs">
                      <div>
                        <span className="text-gray-600">PdA:</span>
                        <span className="ml-1 font-semibold">{poder.pdaCost}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Espaços:</span>
                        <span className="ml-1 font-semibold">{poder.espacosOccupied}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Efeitos:</span>
                        <span className="ml-1 font-semibold">{poder.poder.efeitos.length}</span>
                      </div>
                      {poder.usosRestantes !== undefined && (
                        <div>
                          <span className="text-gray-600">Usos:</span>
                          <span className="ml-1 font-semibold">{poder.usosRestantes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant={poder.ativo ? 'secondary' : 'primary'}
                      onClick={() => onAlternarAtivo(poder.id)}
                    >
                      {poder.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDetalhesPoderAberto(poder)}
                    >
                      Detalhes
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAbrirTrocarDominio(poder)}
                    >
                      Domínio
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemover(poder)}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Modal de Detalhes */}
      {detalhesPoderAberto && (
        <Modal
          isOpen={true}
          onClose={() => setDetalhesPoderAberto(null)}
          title={`Detalhes: ${detalhesPoderAberto.poder.nome}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-gray-100 rounded space-y-1 text-sm">
              <p><strong>Domínio:</strong> {getDominioNome(detalhesPoderAberto.dominioId)}</p>
              <p><strong>Maestria:</strong> {getDominioMaestria(detalhesPoderAberto.dominioId)}</p>
              <p><strong>Status:</strong> {detalhesPoderAberto.ativo ? 'Ativo' : 'Inativo'}</p>
              <p><strong>Custo PdA:</strong> {detalhesPoderAberto.pdaCost}</p>
              <p><strong>Espaços:</strong> {detalhesPoderAberto.espacosOccupied}</p>
            </div>

            {/* Detalhes do Poder */}
            <div className="space-y-3">
              {detalhesPoderAberto.poder.descricao && (
                <div>
                  <h4 className="font-bold mb-1">Descrição</h4>
                  <p className="text-sm text-gray-600">{detalhesPoderAberto.poder.descricao}</p>
                </div>
              )}

              <div>
                <h4 className="font-bold mb-2">Efeitos ({detalhesPoderAberto.poder.efeitos.length})</h4>
                <div className="space-y-2">
                  {detalhesPoderAberto.poder.efeitos.map((efeito, idx) => (
                    <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                      <p className="font-semibold">{efeito.efeitoBaseId}</p>
                      <p className="text-xs text-gray-600">Grau: {efeito.grau}</p>
                    </div>
                  ))}
                </div>
              </div>

              {detalhesPoderAberto.poder.modificacoesGlobais.length > 0 && (
                <div>
                  <h4 className="font-bold mb-2">Modificações Globais</h4>
                  <div className="space-y-1">
                    {detalhesPoderAberto.poder.modificacoesGlobais.map((mod, idx) => (
                      <div key={idx} className="text-sm p-2 bg-blue-50 rounded">
                        {mod.modificacaoBaseId}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Trocar Domínio */}
      {trocarDominioAberto && (
        <Modal
          isOpen={true}
          onClose={() => setTrocarDominioAberto(null)}
          title="Trocar Domínio"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Alterar o domínio recalculará o custo do poder com base na maestria do novo domínio.
            </p>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Poder: <strong>{trocarDominioAberto.poder.nome}</strong>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                Novo Domínio
              </label>
              <Select
                value={novoDominioId}
                onChange={(e) => setNovoDominioId(e.target.value)}
                options={dominios.map(d => ({
                  value: d.id,
                  label: `${d.name} (${d.mastery})`,
                }))}
              />
            </div>

            {novoDominioId !== trocarDominioAberto.dominioId && (
              <div className="p-3 bg-yellow-50 border border-yellow-300 rounded text-sm">
                ⚠️ O custo do poder será recalculado com a maestria do novo domínio.
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleConfirmarTrocaDominio}
                disabled={novoDominioId === trocarDominioAberto.dominioId}
                className="flex-1"
              >
                Confirmar
              </Button>
              <Button
                variant="secondary"
                onClick={() => setTrocarDominioAberto(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
