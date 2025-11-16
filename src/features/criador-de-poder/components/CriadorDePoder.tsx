import { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input, Textarea, Select, toast, HelpIcon, Tooltip, ConfirmDialog, InlineHelp, EmptyState } from '../../../shared/ui';
import { usePoderCalculator } from '../hooks/usePoderCalculator';
import { useBibliotecaPoderes } from '../hooks/useBibliotecaPoderes';
import { useKeyboardShortcuts } from '../../../shared/hooks/useKeyboardShortcuts';
import { ESCALAS } from '../../../data';
import { SeletorEfeito } from './SeletorEfeito';
import { CardEfeito } from './CardEfeito';
import { SeletorModificacao } from './SeletorModificacao';
import { ResumoPoder } from './ResumoPoder';
import { BibliotecaPoderes } from './BibliotecaPoderes';
import { ModalAtalhos } from './ModalAtalhos';
import { Poder } from '../regras/calculadoraCusto';

export function CriadorDePoder() {
  const {
    poder,
    detalhes,
    adicionarEfeito,
    removerEfeito,
    atualizarGrauEfeito,
    atualizarParametroPoder,
    atualizarInputCustomizado,
    atualizarConfiguracaoEfeito,
    adicionarModificacaoLocal,
    removerModificacaoLocal,
    adicionarModificacaoGlobal,
    removerModificacaoGlobal,
    atualizarInfoPoder,
    resetarPoder,
    carregarPoder,
  } = usePoderCalculator();

  const { salvarPoder, buscarPoder } = useBibliotecaPoderes();

  const [modalSeletorEfeito, setModalSeletorEfeito] = useState(false);
  const [modalSeletorModificacao, setModalSeletorModificacao] = useState(false);
  const [modalResumoAberto, setModalResumoAberto] = useState(false);
  const [modalBiblioteca, setModalBiblioteca] = useState(false);
  const [modalConfirmarReset, setModalConfirmarReset] = useState(false);
  const [mostrarAtalhos, setMostrarAtalhos] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [resetando, setResetando] = useState(false);

  const handleResetar = () => {
    if (poder.efeitos.length > 0) {
      setModalConfirmarReset(true);
    } else {
      resetarPoder();
    }
  };

  const confirmarReset = async () => {
    setResetando(true);
    // Simula um pequeno delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 300));
    resetarPoder();
    setResetando(false);
    toast.success('Poder resetado com sucesso! ✨');
  };

  const handleSalvar = async () => {
    if (!poder.nome || poder.nome === 'Novo Poder') {
      toast.warning('Por favor, dê um nome ao poder antes de salvar.');
      return;
    }
    if (poder.efeitos.length === 0) {
      toast.warning('Adicione pelo menos um efeito antes de salvar.');
      return;
    }
    
    setSalvando(true);
    // Simula um pequeno delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Verifica se já existe na biblioteca
    const poderExistente = buscarPoder(poder.id);
    salvarPoder(poder);
    
    setSalvando(false);
    
    if (poderExistente) {
      toast.success(`Poder "${poder.nome}" atualizado com sucesso! 💾`);
    } else {
      toast.success(`Poder "${poder.nome}" salvo com sucesso! 💾`);
    }
  };

  // Atalhos de teclado
  useKeyboardShortcuts([
    {
      key: 's',
      ctrl: true,
      callback: handleSalvar,
      description: 'Salvar poder'
    },
    {
      key: 'n',
      ctrl: true,
      callback: handleResetar,
      description: 'Novo poder'
    },
    {
      key: 'b',
      ctrl: true,
      callback: () => setModalBiblioteca(true),
      description: 'Abrir biblioteca'
    },
    {
      key: 'e',
      ctrl: true,
      callback: () => setModalSeletorEfeito(true),
      description: 'Adicionar efeito'
    },
    {
      key: 'm',
      ctrl: true,
      callback: () => setModalSeletorModificacao(true),
      description: 'Adicionar modificação'
    },
    {
      key: 'r',
      ctrl: true,
      callback: () => poder.efeitos.length > 0 && setModalResumoAberto(true),
      description: 'Ver resumo'
    },
    {
      key: '?',
      ctrl: false,
      callback: () => setMostrarAtalhos(true),
      description: 'Mostrar atalhos'
    }
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Dica de Auto-save */}
      {poder.efeitos.length > 0 && (
        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">💾</span>
            <span className="text-sm text-green-700 dark:text-green-300">
              Progresso salvo automaticamente
            </span>
          </div>
          <span className="text-xs text-green-600 dark:text-green-400" title="Seu trabalho é salvo automaticamente no navegador. Você pode fechar e voltar depois!">
            ℹ️
          </span>
        </div>
      )}

      {/* Dica de Boas-vindas */}
      {poder.efeitos.length === 0 && (
        <InlineHelp
          type="tip"
          text="Bem-vindo ao Criador de Poderes! Comece adicionando um efeito, depois ajuste seu grau e parâmetros. Use Ctrl+E para adicionar rapidamente!"
          dismissible={true}
          storageKey="welcome-tip"
        />
      )}

      {/* Header do Poder */}
      <Card className="rounded-lg sm:rounded-xl">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome do Poder
                  </label>
                  <HelpIcon tooltip="Dê um nome único e descritivo ao seu poder. Ex: Bola de Fogo, Escudo Protetor" />
                </div>
                <Input
                  value={poder.nome}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => atualizarInfoPoder(e.target.value, undefined)}
                  placeholder="Ex: Bola de Fogo"
                  className={poder.nome === 'Novo Poder' || !poder.nome ? 'border-yellow-300 dark:border-yellow-600' : ''}
                />
                {(poder.nome === 'Novo Poder' || !poder.nome) && poder.efeitos.length === 0 && (
                  <InlineHelp
                    type="example"
                    text="Exemplos de nomes: 'Lâmina de Gelo', 'Escudo Mental', 'Teleporte Dimensional'"
                    dismissible={true}
                    storageKey="nome-examples"
                  />
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descrição (opcional)
                  </label>
                  <HelpIcon tooltip="Descreva como o poder funciona, suas limitações e efeitos visuais" />
                </div>
                <Textarea
                  value={poder.descricao || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => atualizarInfoPoder(undefined, e.target.value)}
                  placeholder="Descreva o poder..."
                  rows={3}
                />
              </div>

              {/* Parâmetros do Poder (aplicados a todos os efeitos) */}
              {poder.efeitos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Parâmetros do Poder
                    </label>
                    <HelpIcon tooltip="Auto-calculados (pior parâmetro entre todos os efeitos). Modifique para forçar todos os efeitos a usar os mesmos valores." />
                  </div>
                  

                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Select
                        label="Ação"
                        value={poder.acao.toString()}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                          atualizarParametroPoder('acao', Number(e.target.value))
                        }
                        options={ESCALAS.acao.escala.map(esc => ({
                          value: esc.valor.toString(),
                          label: esc.nome,
                        }))}
                      />
                    </div>
                    
                    <div>
                      <Select
                        label="Alcance"
                        value={poder.alcance.toString()}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                          atualizarParametroPoder('alcance', Number(e.target.value))
                        }
                        options={ESCALAS.alcance.escala.map(esc => ({
                          value: esc.valor.toString(),
                          label: esc.nome,
                        }))}
                      />
                    </div>
                    
                    <div>
                      <Select
                        label="Duração"
                        value={poder.duracao.toString()}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                          atualizarParametroPoder('duracao', Number(e.target.value))
                        }
                        options={ESCALAS.duracao.escala.map(esc => ({
                          value: esc.valor.toString(),
                          label: esc.nome
                        }))}
                      />
                    </div>
                  </div>
                  
                  <InlineHelp
                    type="info"
                    text="💡 Deixe vazio para cada efeito usar seus próprios parâmetros. Selecione valores para forçar TODOS os efeitos a usarem os mesmos parâmetros (aplicará modificadores)."
                    dismissible={true}
                    storageKey="parametros-poder-tip"
                  />
                </div>
              )}
            </div>
            
            {/* Stats - Responsivo: stack em mobile, row em desktop */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="espirito" size="lg" className="text-lg sm:text-xl px-3 sm:px-4 py-1.5 sm:py-2">
                  {detalhes.custoPdATotal} PdA
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  {poder.efeitos.length} {poder.efeitos.length === 1 ? 'Efeito' : 'Efeitos'}
                </Badge>
                {poder.efeitos.length > 0 && (
                  <>
                    <Tooltip content="PE do efeito mais caro + 1 para cada outro efeito">
                      <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1 cursor-help">
                        {detalhes.peTotal} PE
                      </Badge>
                    </Tooltip>
                    <Tooltip content="Espaços do efeito mais caro + 1 para cada outro efeito">
                      <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1 cursor-help">
                        {detalhes.espacosTotal} Espaços
                      </Badge>
                    </Tooltip>
                  </>
                )}
              </div>
              
              {/* Botões - Grid em mobile, flex em desktop */}
              <div className="grid grid-cols-2 sm:flex gap-2">
                <Tooltip content="Acessar biblioteca de poderes salvos">
                  <Button variant="outline" size="sm" onClick={() => setModalBiblioteca(true)} className="w-full sm:w-auto">
                    📚<span className="hidden sm:inline ml-1">Biblioteca</span>
                  </Button>
                </Tooltip>
                {poder.efeitos.length > 0 && (
                  <>
                    <Tooltip content="Salvar poder na biblioteca local">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSalvar}
                        loading={salvando}
                        loadingText="Salvando..."
                        className="w-full sm:w-auto"
                      >
                        💾<span className="hidden sm:inline ml-1">Salvar</span>
                      </Button>
                    </Tooltip>
                    <Tooltip content="Ver resumo completo com descrição técnica">
                      <Button variant="outline" size="sm" onClick={() => setModalResumoAberto(true)} className="w-full sm:w-auto">
                        📋<span className="hidden sm:inline ml-1">Resumo</span>
                      </Button>
                    </Tooltip>
                  </>
                )}
                <Tooltip content="Limpar todos os dados e começar novamente">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResetar}
                    loading={resetando}
                    className="w-full sm:w-auto"
                  >
                    🔄<span className="hidden sm:inline ml-1">Resetar</span>
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Modificações Globais */}
      {poder.modificacoesGlobais.length > 0 && (
        <Card className="rounded-lg sm:rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Modificações Globais (aplicadas a todo o poder)</CardTitle>
              <HelpIcon tooltip="Modificações globais afetam todos os efeitos do poder simultaneamente" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {poder.modificacoesGlobais.map((mod) => (
                <Badge 
                  key={mod.id} 
                  variant="info"
                  className="flex items-center gap-2"
                >
                  {mod.modificacaoBaseId}
                  {mod.grauModificacao && (
                    <span className="text-xs font-bold">Grau {mod.grauModificacao}</span>
                  )}
                  {mod.parametros?.opcao && (
                    <span className="text-xs opacity-75">({mod.parametros.opcao})</span>
                  )}
                  <button
                    onClick={() => removerModificacaoGlobal(mod.id)}
                    className="hover:text-red-600"
                  >
                    ✕
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Efeitos */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Efeitos ({poder.efeitos.length})
          </h2>
        </div>

        {/* Dica após primeiro efeito */}
        {poder.efeitos.length === 1 && (
          <InlineHelp
            type="tip"
            text="Ótimo! Agora você pode ajustar o grau do efeito, adicionar modificações locais ou adicionar mais efeitos para criar combos poderosos!"
            dismissible={true}
            storageKey="first-effect-tip"
          />
        )}

        {/* Dica sobre modificações */}
        {poder.efeitos.length > 0 && poder.modificacoesGlobais.length === 0 && poder.efeitos.every(e => e.modificacoesLocais.length === 0) && (
          <InlineHelp
            type="info"
            text="Você pode adicionar modificações para ajustar alcance, área, duração e muito mais. Use Ctrl+M para modificações globais!"
            dismissible={true}
            storageKey="modifications-tip"
          />
        )}

        {poder.efeitos.length === 0 ? (
          <EmptyState
            icon="⚡"
            title="Comece criando seu poder!"
            description="Adicione um ou mais efeitos para começar. Você poderá ajustar graus, parâmetros e aplicar modificações depois."
            action={{
              label: 'Adicionar Primeiro Efeito',
              onClick: () => setModalSeletorEfeito(true),
              icon: '✨'
            }}
            secondaryAction={{
              label: 'Ver Biblioteca',
              onClick: () => setModalBiblioteca(true),
              icon: '📚'
            }}
            tips={[
              'Use Ctrl+E para adicionar efeitos rapidamente',
              'Combine múltiplos efeitos para criar poderes únicos',
              'Ajuste o grau para controlar o poder do efeito'
            ]}
          />
        ) : (
          <>
            {detalhes.efeitosDetalhados.map((efeitoDetalhado) => (
              <CardEfeito
                key={efeitoDetalhado?.efeito.id}
                efeitoDetalhado={efeitoDetalhado!}
                onRemover={removerEfeito}
                onAtualizarGrau={atualizarGrauEfeito}
                onAdicionarModificacao={adicionarModificacaoLocal}
                onRemoverModificacao={removerModificacaoLocal}
                onAtualizarInputCustomizado={atualizarInputCustomizado}
                onAtualizarConfiguracao={atualizarConfiguracaoEfeito}
              />
            ))}
            
            <Button 
              variant="outline" 
              fullWidth
              onClick={() => setModalSeletorEfeito(true)}
            >
              + Adicionar Outro Efeito
            </Button>
          </>
        )}
      </div>

      {/* Botões de Ação */}
      {poder.efeitos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button 
            variant="secondary" 
            fullWidth
            onClick={() => setModalSeletorModificacao(true)}
          >
            ⚡ Adicionar Modificação Global
          </Button>

        </div>
      )}

      {/* Modals */}
            <SeletorEfeito
        isOpen={modalSeletorEfeito}
        onClose={() => setModalSeletorEfeito(false)}
        onAdicionar={(efeitoId: string) => {
          adicionarEfeito(efeitoId);
          setModalSeletorEfeito(false);
        }}
      />

            <SeletorModificacao
        isOpen={modalSeletorModificacao}
        onClose={() => setModalSeletorModificacao(false)}
        onSelecionar={(modId: string, parametros?: Record<string, any>) => {
          adicionarModificacaoGlobal(modId, parametros);
          setModalSeletorModificacao(false);
        }}
      />

      <ResumoPoder
        isOpen={modalResumoAberto}
        onClose={() => setModalResumoAberto(false)}
        poder={poder}
        detalhes={detalhes}
      />

      <BibliotecaPoderes
        isOpen={modalBiblioteca}
        onClose={() => setModalBiblioteca(false)}
        onCarregar={(poderCarregado: Poder) => carregarPoder(poderCarregado)}
      />

      <ConfirmDialog
        isOpen={modalConfirmarReset}
        onClose={() => setModalConfirmarReset(false)}
        onConfirm={confirmarReset}
        title="Resetar Poder?"
        message="Tem certeza que deseja resetar? Todas as alterações não salvas serão perdidas."
        confirmText="Sim, Resetar"
        cancelText="Cancelar"
        variant="danger"
      />

      <ModalAtalhos
        isOpen={mostrarAtalhos}
        onClose={() => setMostrarAtalhos(false)}
      />
    </div>
  );
}
