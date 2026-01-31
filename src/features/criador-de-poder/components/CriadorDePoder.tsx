import { useState, useMemo } from 'react';
import { Save, Info, Sparkles, FileText, Zap, Library } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Input, Textarea, Select, toast, HelpIcon, Tooltip, ConfirmDialog, InlineHelp, EmptyState } from '../../../shared/ui';
import { usePoderCalculator } from '../hooks/usePoderCalculator';
import { usePoderValidation } from '../hooks/usePoderValidation';
import { useBibliotecaPoderes } from '../hooks/useBibliotecaPoderes';
import { useKeyboardShortcuts, useCustomItems } from '../../../shared/hooks';
import { ESCALAS, MODIFICACOES, DOMINIOS } from '../../../data';
import { formatarCustoModificacao } from '../utils/modificacaoFormatter';
import { SeletorEfeito } from './SeletorEfeito';
import { CardEfeito } from './CardEfeito';
import { SeletorModificacao } from './SeletorModificacao';
import { ResumoPoder } from './ResumoPoder';
import { ModalAtalhos } from './ModalAtalhos';
import { FormPeculiaridadeCustomizada } from './FormPeculiaridadeCustomizada';

export function CriadorDePoder() {
  const { customModificacoes, peculiaridades, addPeculiaridade } = useCustomItems();
  const todasModificacoes = useMemo(
    () => [...MODIFICACOES, ...customModificacoes],
    [customModificacoes]
  );
  
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
    atualizarCustoAlternativo,
    resetarPoder,
  } = usePoderCalculator();

  const { salvarPoder, buscarPoderComHydration } = useBibliotecaPoderes();
  const { validarParaSalvar, validarNome, getFirstError } = usePoderValidation();

  const [modalSeletorEfeito, setModalSeletorEfeito] = useState(false);
  const [modalSeletorModificacao, setModalSeletorModificacao] = useState(false);
  const [modalResumoAberto, setModalResumoAberto] = useState(false);
  const [modalConfirmarReset, setModalConfirmarReset] = useState(false);
  const [mostrarAtalhos, setMostrarAtalhos] = useState(false);
  const [modalFormPeculiaridade, setModalFormPeculiaridade] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [resetando, setResetando] = useState(false);
  const [erroNome, setErroNome] = useState<string>('');

  const handleNomeChange = (novoNome: string) => {
    atualizarInfoPoder(novoNome, undefined);
    
    // Validação em tempo real
    if (novoNome.length > 0) {
      const resultado = validarNome(novoNome);
      setErroNome(getFirstError(resultado) || '');
    } else {
      setErroNome('');
    }
  };

  const handleDominioChange = (novoDominioId: string) => {
    // Limpa campos específicos ao mudar domínio
    if (novoDominioId !== 'cientifico' && poder.dominioAreaConhecimento) {
      // Se não é científico, limpa área
      atualizarInfoPoder(undefined, undefined, novoDominioId, '');
    } else if (novoDominioId !== 'peculiar' && poder.dominioIdPeculiar) {
      // Se não é peculiar, limpa ID peculiar
      atualizarInfoPoder(undefined, undefined, novoDominioId, undefined, '');
    } else {
      // Só atualiza o domínio
      atualizarInfoPoder(undefined, undefined, novoDominioId);
    }
  };

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
    toast.success('Poder resetado com sucesso!');
  };

  const handleSalvar = async () => {
    // Validação usando Zod
    const resultado = validarParaSalvar(poder);
    
    if (!resultado.isValid) {
      // Mostra o primeiro erro encontrado
      const erro = getFirstError(resultado);
      if (erro) toast.error(erro);
      return;
    }
    
    setSalvando(true);
    const { poder: poderExistente, hydrationInfo } = buscarPoderComHydration(poder.id);
    
    // Exibir avisos de hydration se houver
    if (hydrationInfo?.hasIssues) {
      if (hydrationInfo.severity === 'warning') {
        toast.warning('Poder atualizado automaticamente');
      } else {
        toast.info('Poder validado');
      }
    }
    
    salvarPoder(poder);
    
    setSalvando(false);
    
    if (poderExistente) {
      toast.success(`Poder "${poder.nome}" atualizado com sucesso!`);
    } else {
      toast.success(`Poder "${poder.nome}" salvo com sucesso!`);
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
            <Save className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Progresso salvo automaticamente
            </span>
          </div>
          <Tooltip content="Seu trabalho é salvo automaticamente no navegador. Você pode fechar e voltar depois!">
            <Info className="w-4 h-4 text-green-600 dark:text-green-400 cursor-help" />
          </Tooltip>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNomeChange(e.target.value)}
                  placeholder="Ex: Bola de Fogo"
                  className={erroNome || poder.nome === 'Novo Poder' || !poder.nome ? 'border-yellow-300 dark:border-yellow-600' : ''}
                />
                {erroNome && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {erroNome}
                  </p>
                )}
                {(poder.nome === 'Novo Poder' || !poder.nome) && poder.efeitos.length === 0 && !erroNome && (
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
                  <HelpIcon tooltip="Descreva como o poder funciona. Suporta Markdown: **negrito**, *itálico*, - listas" />
                </div>
                <Textarea
                  value={poder.descricao || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => atualizarInfoPoder(undefined, e.target.value)}
                  placeholder="Descreva o poder... (suporta Markdown)"
                  rows={3}
                />
              </div>

              {/* Seleção de Domínio */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Domínio
                  </label>
                  <HelpIcon tooltip="Define a origem e natureza do poder. Cada domínio representa como o poder se manifesta no mundo." />
                </div>
                <Select
                  value={poder.dominioId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleDominioChange(e.target.value)}
                  options={[
                    { value: '__placeholder__', label: 'Selecione um domínio...' },
                    ...DOMINIOS.filter(d => d.categoria === 'espiritual').map(d => ({
                      value: d.id,
                      label: `${d.nome} ${d.espiritual ? '(Espiritual)' : ''}`,
                    })),
                    { value: '__separator-1__', label: '─────────' },
                    ...DOMINIOS.filter(d => d.categoria === 'especial').map(d => ({
                      value: d.id,
                      label: d.nome,
                    })),
                    { value: '__separator-2__', label: '─────────' },
                    ...DOMINIOS.filter(d => d.categoria === 'arma').map(d => ({
                      value: d.id,
                      label: d.nome,
                    })),
                  ]}
                />
                {poder.dominioId && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {DOMINIOS.find(d => d.id === poder.dominioId)?.descricao}
                  </p>
                )}
              </div>

              {/* Área de Conhecimento (Científico) */}
              {poder.dominioId === 'cientifico' && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Área de Conhecimento *
                    </label>
                    <HelpIcon tooltip="Especifique a área científica na qual este poder se baseia" />
                  </div>
                  <Select
                    value={poder.dominioAreaConhecimento || ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                      atualizarInfoPoder(undefined, undefined, undefined, e.target.value)
                    }
                    options={[
                      { value: '', label: 'Selecione uma área...' },
                      ...(DOMINIOS.find(d => d.id === 'cientifico')?.areasConhecimento || []).map(area => ({
                        value: area,
                        label: area,
                      })),
                    ]}
                  />
                </div>
              )}

              {/* Configuração Peculiar */}
              {poder.dominioId === 'peculiar' && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Peculiaridade *
                      </label>
                      <HelpIcon tooltip="Selecione uma peculiaridade existente ou crie uma nova" />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select
                          value={poder.dominioIdPeculiar || ''}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                            atualizarInfoPoder(undefined, undefined, undefined, undefined, e.target.value)
                          }
                          options={[
                            { value: '', label: 'Selecione uma peculiaridade...' },
                            ...peculiaridades.map(p => ({
                              value: p.id,
                              label: `${p.nome}${p.espiritual ? ' (Espiritual)' : ''}`,
                            })),
                          ]}
                        />
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setModalFormPeculiaridade(true)}
                        className="flex items-center gap-1"
                      >
                        <Sparkles className="w-4 h-4" />
                        Nova
                      </Button>
                    </div>
                  </div>
                  
                  {/* Exibe info da peculiaridade selecionada */}
                  {poder.dominioIdPeculiar && (() => {
                    const peculiar = peculiaridades.find(p => p.id === poder.dominioIdPeculiar);
                    if (!peculiar) return null;
                    
                    return (
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
                          {peculiar.nome} {peculiar.espiritual && <span className="text-xs opacity-75">(Espiritual)</span>}
                        </p>
                        {peculiar.descricaoCurta && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {peculiar.descricaoCurta}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

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
                    text="Deixe vazio para cada efeito usar seus próprios parâmetros. Selecione valores para forçar TODOS os efeitos a usarem os mesmos parâmetros (aplicará modificadores)."
                    dismissible={true}
                    storageKey="parametros-poder-tip"
                  />
                </div>
              )}

              {/* Configuração de Custo Alternativo */}
              {poder.efeitos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tipo de Custo de Ativação
                    </label>
                    <HelpIcon tooltip="Padrão: PE (Pontos de Energia). Você pode usar custo alternativo como PV, Atributos, Itens ou Material." />
                  </div>
                  
                  <Select
                    value={poder.custoAlternativo?.tipo || 'pe'}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const tipo = e.target.value as 'pe' | 'pv' | 'atributo' | 'item' | 'material';
                      if (tipo === 'pe') {
                        atualizarCustoAlternativo(undefined);
                      } else {
                        atualizarCustoAlternativo({
                          tipo,
                          usaEfeitoColateral: tipo !== 'material' && tipo !== 'item',
                          descricao: '',
                        });
                      }
                    }}
                    options={[
                      { value: 'pe', label: 'PE (Pontos de Energia) - Padrão' },
                      { value: 'pv', label: 'PV (Pontos de Vida)' },
                      { value: 'atributo', label: 'Atributo (Força, Destreza, etc)' },
                      { value: 'item', label: 'Item Consumível' },
                      { value: 'material', label: 'Material/Componente (R)' },
                    ]}
                  />

                  {poder.custoAlternativo && poder.custoAlternativo.tipo !== 'pe' && (
                    <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      {(poder.custoAlternativo.tipo === 'pv' || poder.custoAlternativo.tipo === 'atributo') && (
                        <>
                          <Input
                            label="Descrição do Custo"
                            placeholder={
                              poder.custoAlternativo.tipo === 'pv'
                                ? 'Ex: Sofre 1d6 de dano, Perde 10 PV'
                                : 'Ex: Perde 2 de Força, -1 Destreza temporário'
                            }
                            value={poder.custoAlternativo.descricao || ''}
                            onChange={(e) =>
                              atualizarCustoAlternativo({
                                ...poder.custoAlternativo!,
                                descricao: e.target.value,
                              })
                            }
                          />
                          <InlineHelp
                            type="warning"
                            text="Este custo usa Efeito Colateral 2 (sem desconto de -2 PdA). O efeito colateral é o custo pago ao ativar."
                          />
                        </>
                      )}

                      {poder.custoAlternativo.tipo === 'material' && (
                        <>
                          <Input
                            type="number"
                            label="Valor do Material (R)"
                            placeholder="Base: 1000R"
                            value={poder.custoAlternativo.valorMaterial || 1000}
                            onChange={(e) =>
                              atualizarCustoAlternativo({
                                ...poder.custoAlternativo!,
                                valorMaterial: Number(e.target.value) || 1000,
                              })
                            }
                            min={1}
                          />
                          <Input
                            label="Descrição do Material"
                            placeholder="Ex: Pó de diamante, Ervas raras, Componente arcano"
                            value={poder.custoAlternativo.descricao || ''}
                            onChange={(e) =>
                              atualizarCustoAlternativo({
                                ...poder.custoAlternativo!,
                                descricao: e.target.value,
                              })
                            }
                          />
                        </>
                      )}

                      {poder.custoAlternativo.tipo === 'item' && (
                        <>
                          <Input
                            label="Descrição do Item"
                            placeholder="Ex: Pergaminho consumível, Poção, Munição especial"
                            value={poder.custoAlternativo.descricao || ''}
                            onChange={(e) =>
                              atualizarCustoAlternativo({
                                ...poder.custoAlternativo!,
                                descricao: e.target.value,
                              })
                            }
                          />
                          <InlineHelp
                            type="info"
                            text="O item é consumido ao usar o efeito. Útil para pergaminhos, poções ou munição especial."
                          />
                        </>
                      )}
                    </div>
                  )}
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
                <Tooltip content="Ver biblioteca de poderes salvos">
                  <Link to="/criador/biblioteca" className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" aria-label="Ir para biblioteca" className="w-full flex items-center gap-2">
                      <Library className="w-4 h-4" /><span className="hidden sm:inline">Biblioteca</span>
                    </Button>
                  </Link>
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
                        aria-label="Salvar poder na biblioteca"
                        className="w-full sm:w-auto"
                      >
                        <Save className="w-4 h-4" /><span className="hidden sm:inline ml-2">Salvar</span>
                      </Button>
                    </Tooltip>
                    <Tooltip content="Ver resumo completo com descrição técnica">
                      <Button variant="outline" size="sm" onClick={() => setModalResumoAberto(true)} aria-label="Ver resumo do poder" className="w-full sm:w-auto flex items-center gap-2">
                        <FileText className="w-4 h-4" /><span className="hidden sm:inline">Resumo</span>
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
                    aria-label="Resetar poder e começar novo"
                    className="w-full sm:w-auto"
                  >
                    <span className="hidden sm:inline">Resetar</span>
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
              {poder.modificacoesGlobais.map((mod) => {
                const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
                if (!modBase) return null;
                const custoTexto = formatarCustoModificacao(mod, modBase);
                
                const descricaoParam = mod.parametros?.descricao as string | undefined;
                const opcaoParam = mod.parametros?.opcao as string | undefined;
                
                return (
                  <Badge 
                    key={mod.id} 
                    variant={modBase.tipo === 'extra' ? 'success' : 'warning'}
                    className="flex items-center gap-2"
                  >
                    <span>
                      {modBase.nome}
                      {mod.grauModificacao && ` ${mod.grauModificacao}`}
                      <span className="font-bold ml-1">{custoTexto}</span>
                    </span>
                    {descricaoParam && (
                      <span className="text-xs opacity-75">: {descricaoParam}</span>
                    )}
                    {opcaoParam && (
                      <span className="text-xs opacity-75">({opcaoParam})</span>
                    )}
                    <button
                      onClick={() => removerModificacaoGlobal(mod.id)}
                      className="hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                );
              })}
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
            icon={<Zap className="w-12 h-12 text-espirito-500" />}
            title="Comece criando seu poder!"
            description="Adicione um ou mais efeitos para começar. Você poderá ajustar graus, parâmetros e aplicar modificações depois."
            action={{
              label: 'Adicionar Primeiro Efeito',
              onClick: () => setModalSeletorEfeito(true),
              icon: <Sparkles className="w-4 h-4" />
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
        <Button 
          variant="secondary"
          fullWidth
          onClick={() => setModalSeletorModificacao(true)}
          aria-label="Adicionar modificação global ao poder"
        >
          Adicionar Modificação Global
        </Button>
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

      <FormPeculiaridadeCustomizada
        isOpen={modalFormPeculiaridade}
        onClose={() => setModalFormPeculiaridade(false)}
        onSubmit={(peculiaridade) => {
          addPeculiaridade(peculiaridade);
          atualizarInfoPoder(undefined, undefined, undefined, undefined, peculiaridade.id);
          setModalFormPeculiaridade(false);
          toast.success(`Peculiaridade "${peculiaridade.nome}" criada com sucesso!`);
        }}
      />
    </div>
  );
}
