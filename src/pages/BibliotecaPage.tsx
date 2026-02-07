import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, toast, EmptyState } from '../shared/ui';
import { useBibliotecaPoderes } from '../features/criador-de-poder/hooks/useBibliotecaPoderes';
import { SwipeablePoderCard } from '../features/criador-de-poder/components/SwipeablePoderCard';
import { GerenciadorCustomizados } from '../features/criador-de-poder/components/GerenciadorCustomizados';
import { ListaAcervos } from '../features/criador-de-poder/components/ListaAcervos';
import { Poder } from '../features/criador-de-poder/regras/calculadoraCusto';
import { useNavigate } from 'react-router-dom';
import { Library, Sparkles, Upload, Plus, Download, Package } from 'lucide-react';

export function BibliotecaPage() {
  const navigate = useNavigate();
  const { 
    poderes, 
    deletarPoder, 
    duplicarPoder, 
    exportarPoder, 
    importarPoder,
    exportarBiblioteca,
    importarBiblioteca,
    buscarPoderComHydration,
  } = useBibliotecaPoderes();
  const [busca, setBusca] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [importando, setImportando] = useState(false);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [duplicandoId, setDuplicandoId] = useState<string | null>(null);
  const [exportandoId, setExportandoId] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'poderes' | 'acervos' | 'customizados'>(() => {
    const saved = localStorage.getItem('biblioteca-aba-ativa');
    return (saved as 'poderes' | 'acervos' | 'customizados') || 'poderes';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistir aba ativa
  useEffect(() => {
    localStorage.setItem('biblioteca-aba-ativa', abaAtiva);
  }, [abaAtiva]);

  const poderesFiltrados = poderes.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.descricao && p.descricao.toLowerCase().includes(busca.toLowerCase()))
  );

  const handleCarregar = async (poder: Poder) => {
    setCarregandoId(poder.id);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Salva o poder no localStorage para ser carregado pelo usePoderCalculator
    try {
      // Busca com hydration para garantir que está atualizado
      const { poder: poderAtualizado, hydrationInfo } = buscarPoderComHydration(poder.id);
      const poderParaCarregar = poderAtualizado || poder;
      
      localStorage.setItem('criador-de-poder-carregar', JSON.stringify(poderParaCarregar));
      setCarregandoId(null);
      navigate('/criador');
      
      if (hydrationInfo?.hasIssues) {
        toast.info(`Poder "${poderParaCarregar.nome}" carregado e atualizado`);
      } else {
        toast.success(`Poder "${poderParaCarregar.nome}" carregado!`);
      }
    } catch (error) {
      console.error('Erro ao carregar poder:', error);
      setCarregandoId(null);
      toast.error('Erro ao carregar poder');
    }
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
      const { poder: poderImportado, hydrationInfo } = importarPoder(text);
      
      // Exibir avisos de hydration se houver
      if (hydrationInfo?.hasIssues) {
        if (hydrationInfo.severity === 'warning') {
          toast.warning('Poder importado com avisos - verifique as alterações');
        } else {
          toast.info('Poder importado e validado');
        }
      }
      
      toast.success(`Poder "${poderImportado.nome}" importado com sucesso!`);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {
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
      const { poder: poderImportado, hydrationInfo } = importarPoder(text);
      
      // Exibir avisos de hydration se houver
      if (hydrationInfo?.hasIssues) {
        if (hydrationInfo.severity === 'warning') {
          toast.warning(`Poder importado com avisos: ${hydrationInfo.message.split('\n')[1] || 'dados atualizados'}`);
        } else {
          toast.info('Poder importado e validado');
        }
      }
      
      toast.success(`Poder "${poderImportado.nome}" importado com sucesso!`);
    } catch {
      toast.error('Erro ao importar arquivo. Verifique se é um JSON válido.');
    } finally {
      setImportando(false);
    }
  };

  const handleExportarBiblioteca = () => {
    try {
      exportarBiblioteca();
      toast.success('Biblioteca exportada com sucesso!');
    } catch {
      toast.error('Erro ao exportar biblioteca');
    }
  };

  const handleImportarBiblioteca = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportando(true);
    try {
      await importarBiblioteca(file);
      await new Promise(resolve => setTimeout(resolve, 400));
      toast.success('Biblioteca importada com sucesso!');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {
      toast.error('Erro ao importar biblioteca. Verifique se é um JSON válido.');
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
      {/* Abas de navegação */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setAbaAtiva('poderes')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
            abaAtiva === 'poderes'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Library className="w-4 h-4" /> Poderes Salvos
        </button>
        <button
          onClick={() => setAbaAtiva('acervos')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
            abaAtiva === 'acervos'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Package className="w-4 h-4" /> Acervos
        </button>
        <button
          onClick={() => setAbaAtiva('customizados')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
            abaAtiva === 'customizados'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Itens Customizados
        </button>
      </div>

      {abaAtiva === 'poderes' ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2"><Library className="w-5 h-5" /> Biblioteca de Poderes</CardTitle>
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
                    id="import-poder-individual"
                  />
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportarBiblioteca}
                    className="hidden"
                    id="import-biblioteca"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportarBiblioteca}
                    disabled={poderes.length === 0}
                    aria-label="Exportar biblioteca completa"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Exportar Tudo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('import-biblioteca')?.click()}
                    loading={importando}
                    loadingText="Importando..."
                    aria-label="Importar biblioteca completa"
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Importar Tudo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    loading={importando}
                    loadingText="Importando..."
                    aria-label="Importar poder individual de arquivo JSON"
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Importar Poder
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
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" /> {isDragging ? 'Solte o arquivo aqui!' : 'Arraste um arquivo JSON para importar'}
              </p>
            </div>
          )}

          {/* Lista de poderes */}
          {poderesFiltrados.length === 0 ? (
            <EmptyState
              icon={<Library className="w-12 h-12 text-gray-400" />}
              title={poderes.length === 0 ? "Nenhum poder salvo ainda" : "Nenhum poder encontrado"}
              description={
                poderes.length === 0
                  ? "Crie seu primeiro poder e salve na biblioteca para acessá-lo aqui!"
                  : "Tente buscar com outros termos"
              }
              action={{
                label: 'Criar Novo Poder',
                onClick: () => navigate('/'),
                icon: <Plus className="w-4 h-4" />
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
        </>
      ) : abaAtiva === 'acervos' ? (
        <ListaAcervos />
      ) : (
        <GerenciadorCustomizados />
      )}
    </div>
  );
}
