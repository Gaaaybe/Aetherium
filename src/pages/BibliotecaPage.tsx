import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, toast, EmptyState } from '../shared/ui';
import { useBibliotecaPoderes } from '../features/criador-de-poder/hooks/useBibliotecaPoderes';
import { SwipeablePoderCard } from '../features/criador-de-poder/components/SwipeablePoderCard';
import { Poder } from '../features/criador-de-poder/regras/calculadoraCusto';
import { useNavigate } from 'react-router-dom';

export function BibliotecaPage() {
  const navigate = useNavigate();
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
    // Aqui você pode usar um estado global ou context para carregar o poder
    // Por enquanto, vamos apenas navegar e deixar o usuário carregar manualmente
    setCarregandoId(null);
    navigate('/');
    toast.success(`Navegue para o Criador para editar "${poder.nome}"`);
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
    await new Promise(resolve => setTimeout(resolve, 300));
    exportarPoder(id);
    setExportandoId(null);
    toast.success(`"${nome}" exportado!`);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportando(true);
    try {
      const text = await file.text();
      await new Promise(resolve => setTimeout(resolve, 400));
      const poderImportado = importarPoder(text);
      toast.success(`Poder "${poderImportado.nome}" importado com sucesso!`);
      
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

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

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
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>📚 Biblioteca de Poderes</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {poderes.length} {poderes.length === 1 ? 'poder salvo' : 'poderes salvos'}
              </p>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                loading={importando}
                loadingText="Importando..."
                aria-label="Importar poder de arquivo JSON"
              >
                📥 Importar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {poderes.length > 0 && (
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          )}
        </CardContent>
      </Card>

      {/* Área de drag and drop */}
      {poderes.length > 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            isDragging
              ? 'border-espirito-500 bg-espirito-50 dark:bg-espirito-900/20'
              : 'border-gray-300 dark:border-gray-700'
          }`}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isDragging ? '📂 Solte o arquivo aqui!' : '📂 Arraste um arquivo JSON para importar'}
          </p>
        </div>
      )}

      {/* Lista de poderes */}
      {poderesFiltrados.length === 0 ? (
        <EmptyState
          icon="📚"
          title={poderes.length === 0 ? "Nenhum poder salvo ainda" : "Nenhum poder encontrado"}
          description={
            poderes.length === 0
              ? "Crie seu primeiro poder e salve na biblioteca para acessá-lo aqui!"
              : "Tente buscar com outros termos"
          }
          action={{
            label: 'Criar Novo Poder',
            onClick: () => navigate('/'),
            icon: '✨'
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
  );
}
