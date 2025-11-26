import { useState } from 'react';
import { Button, Card, Badge, ConfirmDialog, EmptyState } from '../../../shared/ui';
import { useCustomItems } from '../../../shared/hooks';
import { FormEfeitoCustomizado } from './FormEfeitoCustomizado';
import { FormModificacaoCustomizada } from './FormModificacaoCustomizada';
import type { Efeito, Modificacao } from '../../../data';

export function GerenciadorCustomizados() {
  const {
    customEfeitos,
    customModificacoes,
    updateCustomEfeito,
    deleteCustomEfeito,
    updateCustomModificacao,
    deleteCustomModificacao,
  } = useCustomItems();

  const [efeitoEditando, setEfeitoEditando] = useState<Efeito | null>(null);
  const [modificacaoEditando, setModificacaoEditando] = useState<Modificacao | null>(null);
  const [confirmDeleteEfeito, setConfirmDeleteEfeito] = useState<string | null>(null);
  const [confirmDeleteMod, setConfirmDeleteMod] = useState<string | null>(null);

  const handleEditEfeito = (efeito: Efeito) => {
    setEfeitoEditando(efeito);
  };

  const handleDeleteEfeito = (id: string) => {
    deleteCustomEfeito(id);
    setConfirmDeleteEfeito(null);
  };

  const handleEditModificacao = (mod: Modificacao) => {
    setModificacaoEditando(mod);
  };

  const handleDeleteModificacao = (id: string) => {
    deleteCustomModificacao(id);
    setConfirmDeleteMod(null);
  };

  const temCustomizados = customEfeitos.length > 0 || customModificacoes.length > 0;

  return (
    <div className="space-y-6">
      {/* Efeitos Customizados */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          ⚡ Efeitos Customizados
        </h2>
        {customEfeitos.length === 0 ? (
          <EmptyState
            icon="⚡"
            title="Nenhum efeito customizado"
            description="Crie seus próprios efeitos no Seletor de Efeitos"
          />
        ) : (
          <div className="grid gap-3">
            {customEfeitos.map((efeito) => (
              <Card key={efeito.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {efeito.nome}
                      </h3>
                      <Badge variant="success">Customizado</Badge>
                      <Badge>{efeito.custoBase} PdA</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {efeito.descricao}
                    </p>
                    {efeito.categorias.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {efeito.categorias.map((cat) => (
                          <span
                            key={cat}
                            className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 
                                     text-purple-700 dark:text-purple-300 rounded"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEditEfeito(efeito)}
                      aria-label={`Editar ${efeito.nome}`}
                    >
                      ✏️
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setConfirmDeleteEfeito(efeito.id)}
                      aria-label={`Deletar ${efeito.nome}`}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Modificações Customizadas */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          🔧 Modificações Customizadas
        </h2>
        {customModificacoes.length === 0 ? (
          <EmptyState
            icon="🔧"
            title="Nenhuma modificação customizada"
            description="Crie suas próprias modificações no Seletor de Modificações"
          />
        ) : (
          <div className="grid gap-3">
            {customModificacoes.map((mod) => (
              <Card key={mod.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {mod.nome}
                      </h3>
                      <Badge variant="success">Customizada</Badge>
                      <Badge variant={mod.tipo === 'extra' ? 'default' : 'warning'}>
                        {mod.tipo === 'extra' ? '➕ Extra' : '➖ Falha'}
                      </Badge>
                      {mod.custoFixo !== 0 && (
                        <Badge>
                          {mod.custoFixo > 0 ? '+' : ''}
                          {mod.custoFixo} PdA
                        </Badge>
                      )}
                      {mod.custoPorGrau !== 0 && (
                        <Badge>
                          {mod.custoPorGrau > 0 ? '+' : ''}
                          {mod.custoPorGrau} PdA/grau
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {mod.descricao}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {mod.categoria}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEditModificacao(mod)}
                      aria-label={`Editar ${mod.nome}`}
                    >
                      ✏️
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setConfirmDeleteMod(mod.id)}
                      aria-label={`Deletar ${mod.nome}`}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Modais de Edição */}
      {efeitoEditando && (
        <FormEfeitoCustomizado
          isOpen={true}
          onClose={() => setEfeitoEditando(null)}
          onSave={(efeito) => {
            updateCustomEfeito(efeitoEditando.id, efeito);
            setEfeitoEditando(null);
          }}
          efeitoInicial={efeitoEditando}
        />
      )}

      {modificacaoEditando && (
        <FormModificacaoCustomizada
          isOpen={true}
          onClose={() => setModificacaoEditando(null)}
          onSave={(mod) => {
            updateCustomModificacao(modificacaoEditando.id, mod);
            setModificacaoEditando(null);
          }}
          modificacaoInicial={modificacaoEditando}
        />
      )}

      {/* Diálogos de Confirmação */}
      {confirmDeleteEfeito && (
        <ConfirmDialog
          isOpen={true}
          title="Deletar Efeito Customizado"
          message="Tem certeza que deseja deletar este efeito? Esta ação não pode ser desfeita."
          onConfirm={() => handleDeleteEfeito(confirmDeleteEfeito)}
          onClose={() => setConfirmDeleteEfeito(null)}
          variant="danger"
          confirmText="Deletar"
        />
      )}

      {confirmDeleteMod && (
        <ConfirmDialog
          isOpen={true}
          title="Deletar Modificação Customizada"
          message="Tem certeza que deseja deletar esta modificação? Esta ação não pode ser desfeita."
          onConfirm={() => handleDeleteModificacao(confirmDeleteMod)}
          onClose={() => setConfirmDeleteMod(null)}
          variant="danger"
          confirmText="Deletar"
        />
      )}

      {!temCustomizados && (
        <EmptyState
          icon="✨"
          title="Nenhum item customizado ainda"
          description="Comece criando seus próprios efeitos e modificações nos seletores!"
        />
      )}
    </div>
  );
}
