import { useState } from 'react';
import { Button, Card, Badge, ConfirmDialog, EmptyState } from '../../../shared/ui';
import { MarkdownText } from '../../../shared/components';
import { useCustomItems } from '../../../shared/hooks';
import { FormEfeitoCustomizado } from './FormEfeitoCustomizado';
import { FormModificacaoCustomizada } from './FormModificacaoCustomizada';
import { FormPeculiaridadeCustomizada } from './FormPeculiaridadeCustomizada';
import { Zap, Wrench, Edit2, Trash2, Sparkles, Plus, Minus } from 'lucide-react';
import type { Efeito, Modificacao } from '../../../data';
import type { Peculiaridade } from '../../../shared/hooks/useCustomItems';

export function GerenciadorCustomizados() {
  const {
    customEfeitos,
    customModificacoes,
    peculiaridades,
    updateCustomEfeito,
    deleteCustomEfeito,
    updateCustomModificacao,
    deleteCustomModificacao,
    updatePeculiaridade,
    deletePeculiaridade,
  } = useCustomItems();

  const [efeitoEditando, setEfeitoEditando] = useState<Efeito | null>(null);
  const [modificacaoEditando, setModificacaoEditando] = useState<Modificacao | null>(null);
  const [peculiaridadeEditando, setPeculiaridadeEditando] = useState<Peculiaridade | null>(null);
  const [confirmDeleteEfeito, setConfirmDeleteEfeito] = useState<string | null>(null);
  const [confirmDeleteMod, setConfirmDeleteMod] = useState<string | null>(null);
  const [confirmDeletePeculiar, setConfirmDeletePeculiar] = useState<string | null>(null);

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

  const handleEditPeculiaridade = (peculiar: Peculiaridade) => {
    setPeculiaridadeEditando(peculiar);
  };

  const handleDeletePeculiaridade = (id: string) => {
    deletePeculiaridade(id);
    setConfirmDeletePeculiar(null);
  };

  const temCustomizados = customEfeitos.length > 0 || customModificacoes.length > 0 || peculiaridades.length > 0;

  return (
    <div className="space-y-6">
      {/* Efeitos Customizados */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" /> Efeitos Customizados
        </h2>
        {customEfeitos.length === 0 ? (
          <EmptyState
            icon={<Zap className="w-12 h-12 text-gray-400" />}
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
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setConfirmDeleteEfeito(efeito.id)}
                      aria-label={`Deletar ${efeito.nome}`}
                    >
                      <Trash2 className="w-4 h-4" />
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
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Wrench className="w-6 h-6 text-blue-500" /> Modificações Customizadas
        </h2>
        {customModificacoes.length === 0 ? (
          <EmptyState
            icon={<Wrench className="w-12 h-12 text-gray-400" />}
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
                      <Badge variant={mod.tipo === 'extra' ? 'default' : 'warning'} className="flex items-center gap-1">
                        {mod.tipo === 'extra' ? <><Plus className="w-3 h-3" /> Extra</> : <><Minus className="w-3 h-3" /> Falha</>}
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
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setConfirmDeleteMod(mod.id)}
                      aria-label={`Deletar ${mod.nome}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Peculiaridades Customizadas */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" /> Peculiaridades Customizadas
        </h2>
        {peculiaridades.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-12 h-12 text-gray-400" />}
            title="Nenhuma peculiaridade customizada"
            description="Crie suas próprias peculiaridades no Criador de Poderes com domínio Peculiar"
          />
        ) : (
          <div className="grid gap-3">
            {peculiaridades.map((peculiar) => (
              <Card key={peculiar.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {peculiar.nome}
                      </h3>
                      <Badge variant="success">Customizado</Badge>
                      {peculiar.espiritual && <Badge variant="info">Espiritual</Badge>}
                    </div>
                    {peculiar.descricaoCurta && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {peculiar.descricaoCurta}
                      </p>
                    )}
                    <div className="space-y-2 text-xs">
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2">
                        <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">O que é:</p>
                        <div className="text-gray-700 dark:text-gray-300">
                          <MarkdownText>{peculiar.fundamento.oQueE}</MarkdownText>
                        </div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2">
                        <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">Como funciona:</p>
                        <div className="text-gray-700 dark:text-gray-300">
                          <MarkdownText>{peculiar.fundamento.comoFunciona}</MarkdownText>
                        </div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2">
                        <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">Regras internas:</p>
                        <div className="text-gray-700 dark:text-gray-300">
                          <MarkdownText>{peculiar.fundamento.regrasInternas}</MarkdownText>
                        </div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2">
                        <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">Requerimentos:</p>
                        <div className="text-gray-700 dark:text-gray-300">
                          <MarkdownText>{peculiar.fundamento.requerimentos}</MarkdownText>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEditPeculiaridade(peculiar)}
                      aria-label={`Editar ${peculiar.nome}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setConfirmDeletePeculiar(peculiar.id)}
                      aria-label={`Deletar ${peculiar.nome}`}
                    >
                      <Trash2 className="w-4 h-4" />
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

      {peculiaridadeEditando && (
        <FormPeculiaridadeCustomizada
          isOpen={true}
          onClose={() => setPeculiaridadeEditando(null)}
          onSubmit={(peculiar) => {
            updatePeculiaridade(peculiaridadeEditando.id, peculiar);
            setPeculiaridadeEditando(null);
          }}
          peculiaridadeInicial={peculiaridadeEditando}
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

      {confirmDeletePeculiar && (
        <ConfirmDialog
          isOpen={true}
          title="Deletar Peculiaridade Customizada"
          message="Tem certeza que deseja deletar esta peculiaridade? Esta ação não pode ser desfeita. Poderes que usam esta peculiaridade podem ser afetados."
          onConfirm={() => handleDeletePeculiaridade(confirmDeletePeculiar)}
          onClose={() => setConfirmDeletePeculiar(null)}
          variant="danger"
          confirmText="Deletar"
        />
      )}

      {!temCustomizados && (
        <EmptyState
          icon={<Sparkles className="w-12 h-12 text-gray-400" />}
          title="Nenhum item customizado ainda"
          description="Comece criando seus próprios efeitos e modificações nos seletores!"
        />
      )}
    </div>
  );
}
