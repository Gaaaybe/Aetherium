import { Modal, ModalFooter, Button, Input, toast, EmptyState } from '../../../shared/ui';
import { useBibliotecaPoderes } from '../hooks/useBibliotecaPoderes';
import { SwipeablePoderCard } from './SwipeablePoderCard';
import { Poder } from '../regras/calculadoraCusto';
import { useState, useRef } from 'react';

interface BibliotecaPoderesProps {
  isOpen: boolean;
  onClose: () => void;
  onCarregar: (poder: Poder) => void;
}

export function BibliotecaPoderes({ isOpen, onClose, onCarregar }: BibliotecaPoderesProps) {
  const { poderes, deletarPoder, duplicarPoder, exportarPoder, importarPoder } = useBibliotecaPoderes();
  const [busca, setBusca] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [importando, setImportando] = useState(false);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [duplicandoId, setDuplicandoId] = useState<string | null>(null);
  const [exportandoId, setExportandoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const poderesFiltrados = poderes.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.descricao && p.descricao.toLowerCase().includes(busca.toLowerCase()))
  );

  const handleCarregar = async (poder: Poder) => {
    setCarregandoId(poder.id);
    await new Promise(resolve => setTimeout(resolve, 300));
    onCarregar(poder);
    setCarregandoId(null);
    onClose();
    toast.success(`Poder "${poder.nome}" carregado com sucesso!`);
  };

  const handleDeletar = async (id: string, nome: string) => {
    setDeletandoId(id);
    await new Promise(resolve => setTimeout(resolve, 300));
    deletarPoder(id);
    setDeletandoId(null);
    toast.success(`Poder "${nome}" deletado.`);
  };

  const handleDuplicar = async (id: string, nome: string) => {
    setDuplicandoId(id);
    await new Promise(resolve => setTimeout(resolve, 300));
    duplicarPoder(id);
    setDuplicandoId(null);
    toast.success(`Cópia de "${nome}" criada.`);
  };

  const handleExportar = async (id: string, nome: string) => {
    setExportandoId(id);
    await new Promise(resolve => setTimeout(resolve, 400));
    exportarPoder(id);
    setExportandoId(null);
    toast.success(`Poder "${nome}" exportado.`);
  };

  const handleImportar = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportando(true);
    try {
      const text = await file.text();
      await new Promise(resolve => setTimeout(resolve, 400));
      const poderImportado = importarPoder(text);
      toast.success(`Poder "${poderImportado.nome}" importado com sucesso!`);
      
      // Limpar o input para permitir importar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (_error) {
      toast.error('Erro ao importar arquivo. Verifique se é um JSON válido.');
    } finally {
      setImportando(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Por favor, arraste apenas arquivos .json');
      return;
    }

    setImportando(true);
    try {
      const text = await file.text();
      await new Promise(resolve => setTimeout(resolve, 400));
      const poderImportado = importarPoder(text);
      toast.success(`Poder "${poderImportado.nome}" importado com sucesso!`);
    } catch (_error) {
      toast.error('Erro ao importar arquivo. Verifique se é um JSON válido.');
    } finally {
      setImportando(false);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Biblioteca de Poderes"
      size="xl"
    >
      <div className="space-y-4">
        {/* Input de arquivo escondido */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Barra de ações */}
        <div className="flex gap-2">
          <Input
            placeholder="Buscar poderes..."
            value={busca}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={handleImportar}
            className="whitespace-nowrap"
            loading={importando}
            loadingText="Importando..."
          >
            📥 Importar JSON
          </Button>
        </div>

        {/* Lista de Poderes */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`transition-all ${isDragging ? 'ring-2 ring-espirito-500 ring-opacity-50 bg-espirito-50 dark:bg-espirito-900/20' : ''}`}
        >
          {poderesFiltrados.length === 0 ? (
            poderes.length === 0 ? (
              <EmptyState
                icon={isDragging ? '📥' : '📚'}
                title="Sua biblioteca está vazia"
                description={isDragging ? 'Solte o arquivo JSON aqui para importar' : 'Comece criando e salvando seus poderes personalizados!'}
                action={!isDragging ? {
                  label: 'Criar Primeiro Poder',
                  onClick: onClose,
                  icon: '✨'
                } : undefined}
                secondaryAction={!isDragging ? {
                  label: 'Importar de JSON',
                  onClick: handleImportar,
                  icon: '📥'
                } : undefined}
                tips={[
                  'Use Ctrl+S para salvar rapidamente seus poderes',
                  'Arraste arquivos .json diretamente para importar',
                  'Export e compartilhe seus poderes com outros jogadores'
                ]}
              />
            ) : (
              <EmptyState
                icon="🔍"
                title="Nenhum poder encontrado"
                description={`Nenhum poder corresponde à busca "${busca}". Tente outro termo.`}
                action={{
                  label: 'Limpar Busca',
                  onClick: () => setBusca(''),
                  icon: '✕'
                }}
              />
            )
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {poderesFiltrados.map((poder) => (
                <SwipeablePoderCard
                  key={poder.id}
                  poder={poder}
                  onCarregar={() => handleCarregar(poder)}
                  onDuplicar={() => handleDuplicar(poder.id, poder.nome)}
                  onExportar={() => handleExportar(poder.id, poder.nome)}
                  onDeletar={() => handleDeletar(poder.id, poder.nome)}
                  formatarData={formatarData}
                  carregandoId={carregandoId}
                  deletandoId={deletandoId}
                  duplicandoId={duplicandoId}
                  exportandoId={exportandoId}
                />
            ))}
          </div>
        )}
        </div>
      </div>

      <ModalFooter>
        <div className="flex items-center gap-3 mr-auto">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            📚 {poderes.length} {poderes.length === 1 ? 'poder salvo' : 'poderes salvos'}
          </p>
          {poderesFiltrados.length !== poderes.length && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              ({poderesFiltrados.length} {poderesFiltrados.length === 1 ? 'exibido' : 'exibidos'})
            </p>
          )}
        </div>
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
