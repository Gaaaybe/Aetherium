import { useRef, useState } from 'react';
import { Button, ConfirmDialog, EmptyState } from '../../../shared/ui';
import { usePeculiaridades } from '../../../shared/hooks/usePeculiaridades';
import { toast } from '../../../shared/ui';
import { getErrorMessage } from '../../../shared/utils/error-handler';
import { FormPeculiaridadeCustomizada } from './FormPeculiaridadeCustomizada';
import { SwipeablePeculiaridadeCard } from './SwipeablePeculiaridadeCard';
import { ResumoPeculiaridade } from './ResumoPeculiaridade';
import { Sparkles, Plus, Upload } from 'lucide-react';
import type { PeculiaridadeResponse } from '../../../services/types';
import { createPeculiarityExport, parsePeculiarityImport, safePeculiarityFilename } from '../utils/peculiarityTransfer';
import { getPeculiarityById } from '@/services/peculiarities.service';

export function GerenciadorCustomizados() {
  const { peculiaridades, deletar: deletarPeculiaridadeApi, atualizar, criar } = usePeculiaridades();

  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [togglePublicId, setTogglePublicId] = useState<string | null>(null);
  const [resumoPeculiaridade, setResumoPeculiaridade] = useState<PeculiaridadeResponse | null>(null);
  const [modalCriar, setModalCriar] = useState(false);
  const [editando, setEditando] = useState<PeculiaridadeResponse | null>(null);
  const [importando, setImportando] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExportar = (peculiaridade: PeculiaridadeResponse) => {
    const blob = new Blob([JSON.stringify(createPeculiarityExport(peculiaridade), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = safePeculiarityFilename(peculiaridade.nome);
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`"${peculiaridade.nome}" exportada!`);
  };

  const handleImportar = async (file?: File) => {
    if (!file) return;
    setImportando(true);
    try {
      const parsed = parsePeculiarityImport(JSON.parse(await file.text()));
      let imported = 0;
      let reused = 0;
      const failures: string[] = [];
      for (const peculiarity of parsed.peculiarities) {
        try {
          if (peculiarity.sourceId) {
            try {
              await getPeculiarityById(peculiarity.sourceId);
              reused += 1;
              continue;
            } catch {
              // O ID é de outro banco ou foi removido; nesse caso restauramos como nova.
            }
          }
          const { sourceId: _sourceId, ...payload } = peculiarity;
          await criar(payload);
          imported += 1;
        } catch (error) {
          failures.push(`${peculiarity.nome}: ${getErrorMessage(error)}`);
        }
      }
      if (imported > 0) toast.success(`${imported} peculiaridade${imported === 1 ? '' : 's'} importada${imported === 1 ? '' : 's'}!`);
      if (reused > 0) toast.success(`${reused} peculiaridade${reused === 1 ? '' : 's'} já existente${reused === 1 ? '' : 's'} reutilizada${reused === 1 ? '' : 's'}.`);
      if (parsed.warnings.length || failures.length) {
        toast.warning([...parsed.warnings, ...failures].join(' '));
      }
    } catch (error) {
      toast.error(error instanceof SyntaxError ? 'O arquivo não contém um JSON válido.' : getErrorMessage(error));
    } finally {
      setImportando(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const handleDeletePeculiaridade = async (id: string) => {
    await deletarPeculiaridadeApi(id);
    setDeletandoId(null);
  };

  const handleConfirmDeletar = (id: string) => {
    setDeletandoId(id);
  };

  const handleTogglePublic = async (peculiar: { id: string; nome: string; isPublic: boolean }) => {
    setTogglePublicId(peculiar.id);
    try {
      await atualizar(peculiar.id, { isPublic: !peculiar.isPublic });
      toast.success(peculiar.isPublic ? `"${peculiar.nome}" agora é privada.` : `"${peculiar.nome}" publicada!`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglePublicId(null);
    }
  };

  const handleCriar = async (data: { nome: string; descricao: string; espiritual: boolean }) => {
    try {
      await criar(data);
      toast.success(`Peculiaridade "${data.nome}" criada!`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw new Error(); // re-throw para o modal não fechar
    }
  };

  const handleEditar = async (data: { nome: string; descricao: string; espiritual: boolean }) => {
    if (!editando) return;
    try {
      await atualizar(editando.id, data);
      toast.success(`"${data.nome}" atualizada!`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw new Error();
    }
  };

  return (
    <div className="space-y-6">

      {/* Peculiaridades (Antigos Itens Customizados) */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800/50">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-3 tracking-tight uppercase">
              <Sparkles className="w-7 h-7 text-purple-600 dark:text-purple-400" /> Peculiaridades
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Gerencie seus talentos, mutações e itens únicos do sistema.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => handleImportar(event.target.files?.[0])} />
            <Button variant="outline" size="md" onClick={() => importInputRef.current?.click()} loading={importando} className="flex items-center gap-2">
              <Upload className="w-5 h-5" /> Importar
            </Button>
            <Button variant="primary" size="md" onClick={() => setModalCriar(true)} className="flex items-center gap-2 shadow-lg shadow-purple-500/20">
              <Plus className="w-5 h-5" /> Nova Peculiaridade
            </Button>
          </div>
        </div>
        {peculiaridades.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-12 h-12 text-gray-400" />}
            title="Nenhuma peculiaridade customizada"
            description="Crie suas próprias peculiaridades aqui ou no Criador de Poderes com domínio Peculiar"
            action={{ label: 'Nova Peculiaridade', onClick: () => setModalCriar(true), icon: <Plus className="w-4 h-4" /> }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 pb-8">
            {peculiaridades.map((peculiar) => (
              <SwipeablePeculiaridadeCard
                key={peculiar.id}
                peculiaridade={peculiar}
                onEditar={() => setEditando(peculiar)}
                onDeletar={() => handleConfirmDeletar(peculiar.id)}
                onTogglePublic={() => handleTogglePublic(peculiar)}
                onExportar={() => handleExportar(peculiar)}
                onVerResumo={() => setResumoPeculiaridade(peculiar)}
                isDeletando={deletandoId === peculiar.id}
                togglePublicId={togglePublicId}
              />
            ))}
          </div>
        )}
      </section>

      {deletandoId && (
        <ConfirmDialog
          isOpen={true}
          title="Deletar Peculiaridade Customizada"
          message="Tem certeza que deseja deletar esta peculiaridade? Esta ação não pode ser desfeita. Poderes que usam esta peculiaridade podem ser afetados."
          onConfirm={() => handleDeletePeculiaridade(deletandoId)}
          onClose={() => setDeletandoId(null)}
          variant="danger"
          confirmText="Deletar"
        />
      )}

      {/* Modal de Resumo (XL para suportar tabelas/lore gigante) */}
      {resumoPeculiaridade && (
        <ResumoPeculiaridade
          isOpen={!!resumoPeculiaridade}
          onClose={() => setResumoPeculiaridade(null)}
          peculiaridade={resumoPeculiaridade}
        />
      )}

      {/* Modal Criar */}
      <FormPeculiaridadeCustomizada
        isOpen={modalCriar}
        onClose={() => setModalCriar(false)}
        onSubmit={handleCriar}
      />

      {/* Modal Editar */}
      <FormPeculiaridadeCustomizada
        isOpen={!!editando}
        onClose={() => setEditando(null)}
        onSubmit={handleEditar}
        initialValues={editando ? { nome: editando.nome, descricao: editando.descricao, espiritual: editando.espiritual, icone: editando.icone ?? undefined } : undefined}
        title="Editar Peculiaridade"
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}
