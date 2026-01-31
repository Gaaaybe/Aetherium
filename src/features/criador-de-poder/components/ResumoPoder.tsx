import { useMemo } from 'react';
import { Zap, Package, Globe, Sparkles, Copy, FileText, Clock, Ruler, Timer } from 'lucide-react';
import { Modal, ModalFooter, Button, Badge, Card, CardContent, toast } from '../../../shared/ui';
import { MarkdownText } from '../../../shared/components';
import { Poder, ModificacaoAplicada } from '../regras/calculadoraCusto';
import { MODIFICACOES, ESCALAS, Modificacao, DOMINIOS } from '../../../data';
import { useCustomItems } from '../../../shared/hooks';
import type { DetalhesPoder } from '../types';

interface ResumoPoderProps {
  isOpen: boolean;
  onClose: () => void;
  poder: Poder;
  detalhes: DetalhesPoder;
}

// Helper para obter nome da escala
function getNomeEscala(tipo: 'acao' | 'alcance' | 'duracao', valor: number): string {
  const escala = ESCALAS[tipo]?.escala.find((e: { valor: number }) => e.valor === valor);
  return escala?.nome || `Nível ${valor}`;
}

export function ResumoPoder({ isOpen, onClose, poder, detalhes }: ResumoPoderProps) {
  const { customModificacoes, getPeculiaridade } = useCustomItems();
  const todasModificacoes = useMemo(
    () => [...MODIFICACOES, ...customModificacoes],
    [customModificacoes]
  );

  const formatarModificacaoString = (mod: ModificacaoAplicada, modBase?: Modificacao) => {
    let modTexto = modBase?.nome || mod.modificacaoBaseId;
    
    // Calcular custo da modificação (incluindo configuração)
    const grauMod = mod.grauModificacao || 1;
    let custoPorGrauMod = modBase?.custoPorGrau || 0;
    let custoFixoMod = modBase?.custoFixo || 0;
    
    // Adiciona modificador de configuração se houver
    if (mod.parametros?.configuracaoSelecionada && modBase?.configuracoes) {
      const config = modBase.configuracoes.opcoes.find(c => c.id === mod.parametros?.configuracaoSelecionada);
      if (config) {
        if (config.modificadorCusto !== undefined) {
          custoPorGrauMod += config.modificadorCusto;
        }
        if (config.modificadorCustoFixo !== undefined) {
          custoFixoMod += config.modificadorCustoFixo;
        }
      }
    }
    
    const custoMod = custoFixoMod + (custoPorGrauMod * grauMod);
    
    if (mod.grauModificacao && mod.grauModificacao > 1) {
      modTexto += ` ${mod.grauModificacao}`;
    }

    if (custoMod !== 0) {
      modTexto += ` ${custoMod > 0 ? '+' : ''}${custoMod}`;
    }
    
    // Adiciona nome da configuração se houver
    if (mod.parametros?.configuracaoSelecionada && modBase?.configuracoes) {
      const config = modBase.configuracoes.opcoes.find(c => c.id === mod.parametros?.configuracaoSelecionada);
      if (config) {
        modTexto += ` (${config.nome})`;
      }
    }
    
    if (mod.parametros?.descricao) {
      modTexto += ` (${mod.parametros.descricao})`;
    }
    
    if (mod.parametros?.opcao) {
      modTexto += ` [${mod.parametros.opcao}]`;
    }
    
    return modTexto;
  };

  const gerarNotacaoCompacta = () => {
    const partes: string[] = [];
    
    // Para cada efeito
    detalhes.efeitosDetalhados.forEach((efDet) => {
      if (!efDet) return;
      const { efeito, efeitoBase, custoTotal } = efDet;
      
      let linha = `${efeitoBase.nome}`;
      
      // Grau
      linha += ` ${efeito.grau}`;
      
      // Input customizado (ex: Imunidade a Fogo)
      if (efeito.inputCustomizado) {
        linha += ` [${efeito.inputCustomizado}]`;
      }
      
      // Configuração (ex: Patamar 3)
      if (efeito.configuracaoSelecionada && efeitoBase.configuracoes) {
        const config = efeitoBase.configuracoes.opcoes.find(c => c.id === efeito.configuracaoSelecionada);
        if (config) {
          const modificadorCusto = config.modificadorCusto || 0;
          if (modificadorCusto !== 0) {
            linha += ` (${config.nome} ${modificadorCusto > 0 ? '+' : ''}${modificadorCusto})`;
          } else {
            linha += ` (${config.nome})`;
          }
        }
      }
      
      // Modificações locais
      if (efeito.modificacoesLocais.length > 0) {
        const mods = efeito.modificacoesLocais.map((mod) => {
          const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
          return formatarModificacaoString(mod, modBase);
        }).join(', ');
        
        linha += `. ${mods}`;
      }
      
      // Custo total do efeito
      linha += ` = ${custoTotal} PdA`;
      
      partes.push(linha);
    });
    
    // Modificações globais
    if (poder.modificacoesGlobais.length > 0) {
      const modsGlobais = poder.modificacoesGlobais.map(mod => {
        const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
        return formatarModificacaoString(mod, modBase);
      }).join(', ');
      
      partes.push(`[GLOBAL: ${modsGlobais}]`);
    }
    
    return partes.join('\n');
  };

  const gerarTextoResumo = () => {
    let texto = `=== ${poder.nome} ===\n\n`;
    
    if (poder.descricao) {
      texto += `${poder.descricao}\n\n`;
    }
    
    // Parâmetros do Poder
    texto += `PARÂMETROS:\n`;
    texto += `• Ação: ${getNomeEscala('acao', poder.acao)}\n`;
    texto += `• Alcance: ${getNomeEscala('alcance', poder.alcance)}\n`;
    texto += `• Duração: ${getNomeEscala('duracao', poder.duracao)}\n\n`;
    
    // Domínio
    const dominio = DOMINIOS.find(d => d.id === poder.dominioId);
    if (dominio) {
      // Peculiar customizado
      if (poder.dominioId === 'peculiar' && poder.dominioIdPeculiar) {
        const peculiaridade = getPeculiaridade(poder.dominioIdPeculiar);
        if (peculiaridade) {
          texto += `DOMÍNIO: Peculiar - ${peculiaridade.nome}`;
          texto += peculiaridade.espiritual ? ' (Espiritual)' : ' (Não Espiritual)';
          texto += `\n\n`;
          texto += `FUNDAMENTO DA PECULIARIDADE:\n`;
          texto += `O que é: ${peculiaridade.fundamento.oQueE}\n\n`;
          texto += `Como funciona: ${peculiaridade.fundamento.comoFunciona}\n\n`;
          texto += `Regras internas: ${peculiaridade.fundamento.regrasInternas}\n\n`;
          texto += `Requerimentos: ${peculiaridade.fundamento.requerimentos}\n`;
        }
      } else {
        texto += `DOMÍNIO: ${dominio.nome}`;
        if (dominio.espiritual !== null) {
          texto += dominio.espiritual ? ' (Espiritual)' : ' (Não Espiritual)';
        }
        // Área de conhecimento (Científico)
        if (poder.dominioId === 'cientifico' && poder.dominioAreaConhecimento) {
          texto += ` - ${poder.dominioAreaConhecimento}`;
        }
        texto += `\n`;
      }
    }
    
    texto += `CUSTO TOTAL: ${detalhes.custoPdATotal} PdA\n`;
    
    // Custo Alternativo
    if (poder.custoAlternativo && poder.custoAlternativo.tipo !== 'pe') {
      texto += `CUSTO DE ATIVAÇÃO: `;
      if (poder.custoAlternativo.tipo === 'pv') {
        texto += poder.custoAlternativo.descricao || `${detalhes.peTotal} ${detalhes.peTotal === 1 ? 'ponto' : 'pontos'} de PV`;
      } else if (poder.custoAlternativo.tipo === 'atributo') {
        texto += poder.custoAlternativo.descricao || `${detalhes.peTotal} ${detalhes.peTotal === 1 ? 'ponto' : 'pontos'} de atributo`;
      } else if (poder.custoAlternativo.tipo === 'item') {
        texto += `${poder.custoAlternativo.descricao || 'Item necessário'}`;
      } else if (poder.custoAlternativo.tipo === 'material') {
        texto += `${poder.custoAlternativo.descricao || 'Material'} (R ${poder.custoAlternativo.valorMaterial || 1000})`;
      }
      if (poder.custoAlternativo.usaEfeitoColateral) {
        texto += ` + Efeito Colateral`;
      }
      texto += ` (não gasta PE)\n`;
    } else {
      texto += `PE TOTAL: ${detalhes.peTotal} PE\n`;
    }
    
    texto += `ESPAÇOS TOTAIS: ${detalhes.espacosTotal} Espaços\n\n`;
    
    // Modificações Globais
    if (poder.modificacoesGlobais.length > 0) {
      texto += `MODIFICAÇÕES GLOBAIS:\n`;
      poder.modificacoesGlobais.forEach(mod => {
        const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
        const modTexto = formatarModificacaoString(mod, modBase);
        texto += `- ${modTexto}\n`;
      });
      texto += `\n`;
    }
    
    // Efeitos
    texto += `EFEITOS:\n`;
    detalhes.efeitosDetalhados.forEach((efDet) => {
      if (!efDet) return;
      const ef = efDet;
      
      texto += `\n${ef.efeitoBase.nome} - Grau ${ef.efeito.grau} (${ef.custoTotal} PdA)\n`;
      
      // Input customizado se houver
      if (ef.efeito.inputCustomizado) {
        texto += `  Especificação: ${ef.efeito.inputCustomizado}\n`;
      }
      
      // Configuração selecionada
      if (ef.efeito.configuracaoSelecionada && ef.efeitoBase.configuracoes) {
        const config = ef.efeitoBase.configuracoes.opcoes.find(c => c.id === ef.efeito.configuracaoSelecionada);
        if (config) {
          texto += `  Configuração: ${config.nome}\n`;
        }
      }

      if (ef.efeito.modificacoesLocais.length > 0) {
        texto += `  Modificações:\n`;
        ef.efeito.modificacoesLocais.forEach((mod) => {
          const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
          const modTexto = formatarModificacaoString(mod, modBase);
          texto += `    - ${modTexto}\n`;
        });
      }
    });
    
    return texto;
  };

  const copiarResumo = () => {
    const texto = gerarTextoResumo();
    navigator.clipboard.writeText(texto);
    toast.success('Resumo copiado para a área de transferência!');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Premium com Gradiente */}
        <div className="relative -mt-6 -mx-6 p-8 bg-gradient-to-br from-espirito-600 to-espirito-800 dark:from-espirito-700 dark:to-espirito-900 text-white rounded-t-lg overflow-hidden">
          {/* Padrão decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-8 h-8 text-yellow-300" />
                  <h2 className="text-3xl font-bold">{poder.nome}</h2>
                </div>
                {poder.descricao && (
                  <div className="text-espirito-100 text-lg max-w-2xl leading-relaxed">
                    <MarkdownText>{poder.descricao}</MarkdownText>
                  </div>
                )}
              </div>
              
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[120px]">
                <p className="text-espirito-200 text-sm mb-1">Custo Total</p>
                <p className="text-4xl font-bold text-yellow-300">{detalhes.custoPdATotal}</p>
                <p className="text-xs text-espirito-200">PdA</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <p className="text-espirito-200 text-xs mb-1">Efeitos</p>
                <p className="text-2xl font-bold">{poder.efeitos.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <p className="text-espirito-200 text-xs mb-1">Modificações</p>
                <p className="text-2xl font-bold">
                  {poder.modificacoesGlobais.length + poder.efeitos.reduce((acc, ef) => acc + ef.modificacoesLocais.length, 0)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <p className="text-espirito-200 text-xs mb-1 flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3" /> PE Total
                </p>
                <p className="text-2xl font-bold">{detalhes.peTotal}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <p className="text-espirito-200 text-xs mb-1 flex items-center justify-center gap-1">
                  <Package className="w-3 h-3" /> Espaços
                </p>
                <p className="text-2xl font-bold">{detalhes.espacosTotal}</p>
              </div>
            </div>

            {/* Custo Alternativo (se houver) */}
            {poder.custoAlternativo && poder.custoAlternativo.tipo !== 'pe' && (
              <div className="bg-yellow-400/20 backdrop-blur-sm rounded-lg p-4 mt-4 border border-yellow-400/50">
                <p className="text-espirito-100 text-xs font-semibold mb-2 uppercase">Custo de Ativação</p>
                {poder.custoAlternativo.tipo === 'pv' && (
                  <p className="text-lg font-bold text-yellow-300">
                    {poder.custoAlternativo.descricao || `${detalhes.peTotal} ${detalhes.peTotal === 1 ? 'ponto' : 'pontos'} de PV`}
                    {poder.custoAlternativo.usaEfeitoColateral ? ' + Efeito Colateral' : ''}
                  </p>
                )}
                {poder.custoAlternativo.tipo === 'atributo' && (
                  <p className="text-lg font-bold text-yellow-300">
                    {poder.custoAlternativo.descricao || `${detalhes.peTotal} ${detalhes.peTotal === 1 ? 'ponto' : 'pontos'} de atributo`}
                    {poder.custoAlternativo.usaEfeitoColateral ? ' + Efeito Colateral' : ''}
                  </p>
                )}
                {poder.custoAlternativo.tipo === 'item' && (
                  <p className="text-lg font-bold text-yellow-300">
                    {poder.custoAlternativo.descricao || 'Item necessário'}
                    {poder.custoAlternativo.usaEfeitoColateral ? ' + Efeito Colateral' : ''}
                  </p>
                )}
                {poder.custoAlternativo.tipo === 'material' && (
                  <p className="text-lg font-bold text-yellow-300">
                    {poder.custoAlternativo.descricao || 'Material'} (R {poder.custoAlternativo.valorMaterial || 1000})
                    {poder.custoAlternativo.usaEfeitoColateral ? ' + Efeito Colateral' : ''}
                  </p>
                )}
                <p className="text-espirito-200 text-xs mt-1">
                  (não gasta PE para ativar)
                </p>
              </div>
            )}

            {/* Domínio do Poder */}
            {(() => {
              const dominio = DOMINIOS.find(d => d.id === poder.dominioId);
              if (!dominio) return null;
              
              // Peculiar customizado
              if (poder.dominioId === 'peculiar' && poder.dominioIdPeculiar) {
                const peculiaridade = getPeculiaridade(poder.dominioIdPeculiar);
                if (!peculiaridade) return null;
                
                return (
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-lg p-4 mt-4 border border-purple-400/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-purple-200" />
                      <p className="text-purple-100 text-sm font-semibold uppercase">Peculiaridade</p>
                    </div>
                    <p className="text-lg font-bold text-purple-100">
                      {peculiaridade.nome}
                      <span className="text-sm font-normal text-purple-200 ml-2">
                        {peculiaridade.espiritual ? '(Espiritual)' : '(Não Espiritual)'}
                      </span>
                    </p>
                    
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="bg-white/10 rounded p-2">
                        <p className="font-semibold text-purple-100 mb-1">O que é:</p>
                        <div className="text-purple-200">
                          <MarkdownText>{peculiaridade.fundamento.oQueE}</MarkdownText>
                        </div>
                      </div>
                      <div className="bg-white/10 rounded p-2">
                        <p className="font-semibold text-purple-100 mb-1">Como funciona:</p>
                        <div className="text-purple-200">
                          <MarkdownText>{peculiaridade.fundamento.comoFunciona}</MarkdownText>
                        </div>
                      </div>
                      <div className="bg-white/10 rounded p-2">
                        <p className="font-semibold text-purple-100 mb-1">Regras internas:</p>
                        <div className="text-purple-200">
                          <MarkdownText>{peculiaridade.fundamento.regrasInternas}</MarkdownText>
                        </div>
                      </div>
                      <div className="bg-white/10 rounded p-2">
                        <p className="font-semibold text-purple-100 mb-1">Requerimentos:</p>
                        <div className="text-purple-200">
                          <MarkdownText>{peculiaridade.fundamento.requerimentos}</MarkdownText>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              
              // Domínios normais
              return (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4 border border-espirito-400/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-5 h-5 text-espirito-200" />
                    <p className="text-espirito-100 text-sm font-semibold uppercase">Domínio</p>
                  </div>
                  <p className="text-lg font-bold text-espirito-100">
                    {dominio.nome}
                    {dominio.espiritual !== null && (
                      <span className="text-sm font-normal text-espirito-200 ml-2">
                        {dominio.espiritual ? '(Espiritual)' : '(Não Espiritual)'}
                      </span>
                    )}
                  </p>
                  {/* Área de Conhecimento (Científico) */}
                  {poder.dominioId === 'cientifico' && poder.dominioAreaConhecimento && (
                    <p className="text-sm font-semibold text-espirito-100 mt-1">
                      Área: {poder.dominioAreaConhecimento}
                    </p>
                  )}
                  <p className="text-xs text-espirito-200 mt-1">
                    {dominio.descricao.substring(0, 150)}
                    {dominio.descricao.length > 150 ? '...' : ''}
                  </p>
                </div>
              );
            })()}

            {/* Parâmetros do Poder */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-espirito-200" />
                  <p className="text-espirito-200 text-xs">Ação</p>
                </div>
                <p className="text-sm font-semibold">{getNomeEscala('acao', poder.acao)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Ruler className="w-4 h-4 text-espirito-200" />
                  <p className="text-espirito-200 text-xs">Alcance</p>
                </div>
                <p className="text-sm font-semibold">{getNomeEscala('alcance', poder.alcance)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Timer className="w-4 h-4 text-espirito-200" />
                  <p className="text-espirito-200 text-xs">Duração</p>
                </div>
                <p className="text-sm font-semibold">{getNomeEscala('duracao', poder.duracao)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modificações Globais */}
        {poder.modificacoesGlobais.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                Modificações Globais
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {poder.modificacoesGlobais.map((mod) => {
                const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
                return (
                  <Badge key={mod.id} variant="info" size="lg" className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {formatarModificacaoString(mod, modBase)}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Notação Compacta */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30 rounded-lg p-4 border-l-4 border-slate-500">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
              Notação Compacta
            </h3>
            <Badge variant="secondary" size="sm">Build String</Badge>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
              {gerarNotacaoCompacta()}
            </pre>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(gerarNotacaoCompacta());
              toast.success('Notação compacta copiada!');
            }}
            className="mt-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1"
          >
            <Copy className="w-3 h-3" /> Copiar notação
          </button>
        </div>

        {/* Lista de Efeitos */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-espirito-600 dark:text-espirito-400" />
            Efeitos Detalhados
          </h3>
          
          {detalhes.efeitosDetalhados.map((efDet) => {
            if (!efDet) return null;
            const { efeito, efeitoBase, custoTotal } = efDet;

            return (
              <Card key={efeito.id} className="overflow-hidden border-l-4 border-l-espirito-500">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-lg text-espirito-700 dark:text-espirito-300">
                          {efeitoBase.nome}
                        </h4>
                        <Badge variant="secondary">Grau {efeito.grau}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {efeitoBase.descricao}
                      </p>
                      {efeito.inputCustomizado && (
                        <p className="text-sm font-medium text-espirito-600 dark:text-espirito-400 mt-1">
                          Especificação: {efeito.inputCustomizado}
                        </p>
                      )}
                      {efeito.configuracaoSelecionada && efeitoBase.configuracoes && (
                        <p className="text-sm font-medium text-espirito-600 dark:text-espirito-400 mt-1">
                          Configuração: {efeitoBase.configuracoes.opcoes.find(c => c.id === efeito.configuracaoSelecionada)?.nome}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-espirito-600 dark:text-espirito-400">
                        {custoTotal}
                      </span>
                      <span className="text-xs text-gray-500 block">PdA</span>
                    </div>
                  </div>

                  {/* Modificações Locais */}
                  {efeito.modificacoesLocais.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Modificações</p>
                      <div className="flex flex-wrap gap-2">
                        {efeito.modificacoesLocais.map((mod) => {
                          const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
                          return (
                            <Badge key={mod.id} variant="secondary" className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              {formatarModificacaoString(mod, modBase)}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={copiarResumo} className="w-full sm:w-auto">
          <Copy className="w-4 h-4 mr-2" />
          Copiar Resumo
        </Button>
        <Button onClick={onClose} className="w-full sm:w-auto">
          Fechar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
