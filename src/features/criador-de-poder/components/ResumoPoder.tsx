import { useMemo } from 'react';
import { Modal, ModalFooter, Button, Badge, Card, CardContent, toast } from '../../../shared/ui';
import { Poder } from '../regras/calculadoraCusto';
import { MODIFICACOES, obterNomeParametro, buscarGrauNaTabela } from '../../../data';
import { useCustomItems } from '../../../shared/hooks';
import type { DetalhesPoder } from '../types';

interface ResumoPoderProps {
  isOpen: boolean;
  onClose: () => void;
  poder: Poder;
  detalhes: DetalhesPoder;
}

export function ResumoPoder({ isOpen, onClose, poder, detalhes }: ResumoPoderProps) {
  const { customModificacoes } = useCustomItems();
  const todasModificacoes = useMemo(
    () => [...MODIFICACOES, ...customModificacoes],
    [customModificacoes]
  );
  
  const copiarResumo = () => {
    const texto = gerarTextoResumo();
    navigator.clipboard.writeText(texto);
    toast.success('Resumo copiado para a área de transferência!');
  };

  const gerarNotacaoCompacta = () => {
    const partes: string[] = [];
    
    // Para cada efeito
    detalhes.efeitosDetalhados.forEach((ef: any) => {
      let linha = `${ef.efeitoBase.nome}`;
      
      // Grau
      linha += ` ${ef.efeito.grau}`;
      
      // Input customizado (ex: Imunidade a Fogo)
      if (ef.efeito.inputCustomizado) {
        linha += ` [${ef.efeito.inputCustomizado}]`;
      }
      
      // Configuração (ex: Patamar 3)
      if (ef.efeito.configuracaoSelecionada && ef.efeitoBase.configuracoes) {
        const config = ef.efeitoBase.configuracoes.opcoes.find((c: any) => c.id === ef.efeito.configuracaoSelecionada);
        if (config && config.modificadorCusto !== 0) {
          linha += ` (${config.nome} ${config.modificadorCusto > 0 ? '+' : ''}${config.modificadorCusto})`;
        } else if (config) {
          linha += ` (${config.nome})`;
        }
      }
      
      // Modificações locais
      if (ef.efeito.modificacoesLocais.length > 0) {
        const mods = ef.efeito.modificacoesLocais.map((mod: any) => {
          const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
          let modTexto = modBase?.nome || mod.modificacaoBaseId;
          
          if (mod.grauModificacao && mod.grauModificacao > 1) {
            modTexto += ` ${mod.grauModificacao}`;
          }
          
          // Calcular custo da modificação
          const grauMod = mod.grauModificacao || 1;
          const custoMod = modBase ? (modBase.custoFixo + modBase.custoPorGrau * grauMod) : 0;
          
          if (custoMod !== 0) {
            modTexto += ` ${custoMod > 0 ? '+' : ''}${custoMod}`;
          }
          
          if (mod.parametros?.descricao) {
            modTexto += ` (${mod.parametros.descricao})`;
          }
          
          return modTexto;
        }).join(', ');
        
        linha += `. ${mods}`;
      }
      
      // Custo total do efeito
      linha += ` = ${ef.custoTotal} PdA`;
      
      partes.push(linha);
    });
    
    // Modificações globais
    if (poder.modificacoesGlobais.length > 0) {
      const modsGlobais = poder.modificacoesGlobais.map(mod => {
        const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
        let modTexto = modBase?.nome || mod.modificacaoBaseId;
        
        if (mod.grauModificacao && mod.grauModificacao > 1) {
          modTexto += ` ${mod.grauModificacao}`;
        }
        
        const grauMod = mod.grauModificacao || 1;
        const custoMod = modBase ? (modBase.custoFixo + modBase.custoPorGrau * grauMod) : 0;
        
        if (custoMod !== 0) {
          modTexto += ` ${custoMod > 0 ? '+' : ''}${custoMod}`;
        }
        
        if (mod.parametros?.descricao) {
          modTexto += ` (${mod.parametros.descricao})`;
        }
        
        if (mod.parametros?.opcao) {
          modTexto += ` [${mod.parametros.opcao}]`;
        }
        
        return modTexto;
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
    
    texto += `CUSTO TOTAL: ${detalhes.custoPdATotal} PdA\n`;
    texto += `PE TOTAL: ${detalhes.peTotal} PE\n`;
    texto += `ESPAÇOS TOTAIS: ${detalhes.espacosTotal} Espaços\n\n`;
    
    // Modificações Globais
    if (poder.modificacoesGlobais.length > 0) {
      texto += `MODIFICAÇÕES GLOBAIS:\n`;
      poder.modificacoesGlobais.forEach(mod => {
        const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
        let linha = `- ${modBase?.nome || mod.modificacaoBaseId}`;
        if (mod.grauModificacao) {
          linha += ` (Grau ${mod.grauModificacao})`;
        }
        texto += linha + '\n';
        if (mod.parametros?.descricao) {
          texto += `  ${mod.parametros.descricao}\n`;
        }
        if (mod.parametros?.opcao) {
          texto += `  Opção: ${mod.parametros.opcao}\n`;
        }
      });
      texto += `\n`;
    }
    
    // Efeitos
    texto += `EFEITOS:\n`;
    detalhes.efeitosDetalhados.forEach((ef: any) => {
      const dadosGrau = buscarGrauNaTabela(ef.efeito.grau);
      
      texto += `\n${ef.efeitoBase.nome} - Grau ${ef.efeito.grau} (${ef.custoTotal} PdA)\n`;
      
      // Input customizado se houver
      if (ef.efeito.inputCustomizado) {
        texto += `  Especificação: ${ef.efeito.inputCustomizado}\n`;
      }
      
      // Configuração selecionada (ex: Imunidade Patamar 2)
      if (ef.efeito.configuracaoSelecionada && ef.efeitoBase.configuracoes) {
        const config = ef.efeitoBase.configuracoes.opcoes.find((c: any) => c.id === ef.efeito.configuracaoSelecionada);
        if (config) {
          texto += `  ${ef.efeitoBase.configuracoes.label}: ${config.nome} (+${config.modificadorCusto} custo)\n`;
        }
      }
      
      // Parâmetros agora são do PODER, não do efeito individual
      // (Removido: parâmetros individuais não existem mais)
      
      if (dadosGrau) {
        texto += `  Tabela Universal (Grau ${ef.efeito.grau}):\n`;
        texto += `    💥 Dano/Cura: ${dadosGrau.dano}\n`;
        texto += `    📏 Distância: ${dadosGrau.distancia}\n`;
        texto += `    ⚡ PE: ${dadosGrau.pe}\n`;
        texto += `    📦 Espaços: ${dadosGrau.espacos}\n`;
        texto += `    ⚖️ Massa: ${dadosGrau.massa}\n`;
        texto += `    ⏱️ Tempo: ${dadosGrau.tempo}\n`;
        texto += `    🚀 Velocidade: ${dadosGrau.velocidade}\n`;
        texto += `    🏃 Deslocamento: ${dadosGrau.deslocamento}\n`;
      }
      
      if (ef.efeito.modificacoesLocais.length > 0) {
        texto += `  Modificações:\n`;
        ef.efeito.modificacoesLocais.forEach((mod: any) => {
          const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
          let linha = `    - ${modBase?.nome || mod.modificacaoBaseId}`;
          if (mod.grauModificacao) {
            linha += ` (Grau ${mod.grauModificacao})`;
          }
          texto += linha + '\n';
        });
      }
    });
    
    return texto;
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
                  <span className="text-4xl">⚡</span>
                  <h2 className="text-3xl font-bold">{poder.nome}</h2>
                </div>
                {poder.descricao && (
                  <p className="text-espirito-100 text-lg max-w-2xl leading-relaxed">
                    {poder.descricao}
                  </p>
                )}
              </div>
              
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[120px]">
                <p className="text-espirito-200 text-sm font-medium mb-1">Custo Total</p>
                <p className="text-5xl font-bold text-white">
                  {detalhes.custoPdATotal}
                </p>
                <p className="text-espirito-200 text-sm font-medium mt-1">PdA</p>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
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
                <p className="text-espirito-200 text-xs mb-1">⚡ PE Total</p>
                <p className="text-2xl font-bold">{detalhes.peTotal}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <p className="text-espirito-200 text-xs mb-1">📦 Espaços</p>
                <p className="text-2xl font-bold">{detalhes.espacosTotal}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <p className="text-espirito-200 text-xs mb-1">Custo Médio</p>
                <p className="text-2xl font-bold">
                  {poder.efeitos.length > 0 ? Math.round(detalhes.custoPdATotal / poder.efeitos.length) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modificações Globais */}
        {poder.modificacoesGlobais.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🌐</span>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                Modificações Globais
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {poder.modificacoesGlobais.map((mod) => {
                const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
                return (
                  <Badge key={mod.id} variant="info" size="lg">
                    ✨ {modBase?.nome || mod.modificacaoBaseId}
                    {mod.grauModificacao && ` - Grau ${mod.grauModificacao}`}
                    {mod.parametros?.opcao && ` (${mod.parametros.opcao})`}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Parâmetros do Poder */}
        <div className="bg-gradient-to-r from-espirito-50 to-purple-50 dark:from-espirito-900/20 dark:to-purple-900/20 rounded-lg p-4 border-l-4 border-espirito-500">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">⚙️</span>
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
              Parâmetros do Poder
            </h3>
            <Badge variant="info" size="sm">Aplicado a todos os efeitos</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">⚡ Ação</p>
              <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {obterNomeParametro('acao', poder.acao)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">🎯 Alcance</p>
              <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {obterNomeParametro('alcance', poder.alcance)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-200 dark:border-green-700">
              <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">⏱️ Duração</p>
              <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {obterNomeParametro('duracao', poder.duracao)}
              </p>
            </div>
          </div>
        </div>

        {/* Notação Compacta */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30 rounded-lg p-4 border-l-4 border-slate-500">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📝</span>
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
            📋 Copiar notação
          </button>
        </div>

        {/* Lista de Efeitos com visual aprimorado */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⚡</span>
            <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100">
              Efeitos Detalhados
            </h3>
          </div>
          
          {detalhes.efeitosDetalhados.map((ef: any, index: number) => {
            const dadosGrau = buscarGrauNaTabela(ef.efeito.grau);
            
            return (
              <Card key={ef.efeito.id} className="border-l-4 border-espirito-500 hover:shadow-lg transition-shadow">
                <CardContent className="space-y-4">
                  {/* Header do Efeito */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-espirito-100 dark:bg-espirito-900 text-espirito-700 dark:text-espirito-300 font-bold text-lg">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {ef.efeitoBase.nome}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Grau {ef.efeito.grau} • {ef.efeitoBase.tipo}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="espirito" size="lg" className="text-lg px-4 py-2">
                        {ef.custoTotal} PdA
                      </Badge>
                      {ef.custoBase !== ef.custoTotal && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Base: {ef.custoBase} PdA
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Descrição do efeito */}
                  {ef.efeitoBase.descricao && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      "{ef.efeitoBase.descricao}"
                    </p>
                  )}

                  {/* Input customizado se houver */}
                  {ef.efeito.inputCustomizado && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-3 rounded-lg">
                      <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                        📝 {ef.efeitoBase.labelInput || 'Especificação'}
                      </p>
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {ef.efeito.inputCustomizado}
                      </p>
                    </div>
                  )}

                  {/* Configuração selecionada (ex: Imunidade Patamar 2) */}
                  {ef.efeito.configuracaoSelecionada && ef.efeitoBase.configuracoes && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 p-3 rounded-lg">
                      <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">
                        ⚙️ {ef.efeitoBase.configuracoes.label}
                      </p>
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {ef.efeitoBase.configuracoes.opcoes.find((c: any) => c.id === ef.efeito.configuracaoSelecionada)?.nome}
                        {' '}
                        <span className="text-purple-600 dark:text-purple-400">
                          (+{ef.efeitoBase.configuracoes.opcoes.find((c: any) => c.id === ef.efeito.configuracaoSelecionada)?.modificadorCusto} custo)
                        </span>
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        {ef.efeitoBase.configuracoes.opcoes.find((c: any) => c.id === ef.efeito.configuracaoSelecionada)?.descricao}
                      </p>
                    </div>
                  )}

                  {/* Parâmetros removidos - agora são do Poder, não dos efeitos individuais */}

                  {/* Estatísticas do Grau */}
                  {dadosGrau && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      {/* Campos Principais - Sempre Visíveis */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">💥 Dano/Cura</p>
                          <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.dano}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">� Distância</p>
                          <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.distancia}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">⚡ PE</p>
                          <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.pe}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">� Espaços</p>
                          <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.espacos}</p>
                        </div>
                      </div>

                      {/* Botão para Expandir/Colapsar */}
                      <button
                        onClick={() => {
                          const detalhes = document.getElementById(`detalhes-tabela-resumo-${ef.efeito.id}`);
                          const icone = document.getElementById(`icone-toggle-resumo-${ef.efeito.id}`);
                          if (detalhes && icone) {
                            detalhes.classList.toggle('hidden');
                            icone.textContent = detalhes.classList.contains('hidden') ? '▼' : '▲';
                          }
                        }}
                        className="w-full mt-3 text-xs text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium flex items-center justify-center gap-1 transition-colors"
                      >
                        <span id={`icone-toggle-resumo-${ef.efeito.id}`}>▼</span>
                        <span>Mais detalhes da Tabela Universal</span>
                      </button>

                      {/* Campos Adicionais - Colapsáveis */}
                      <div id={`detalhes-tabela-resumo-${ef.efeito.id}`} className="hidden mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">⚖️ Massa</p>
                            <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.massa}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">⏱️ Tempo</p>
                            <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.tempo}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">� Velocidade</p>
                            <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.velocidade}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">🏃 Deslocamento</p>
                            <p className="font-bold text-blue-900 dark:text-blue-300">{dadosGrau.deslocamento}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modificações Locais */}
                  {ef.efeito.modificacoesLocais.length > 0 && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">🔧 Modificações:</p>
                      <div className="flex flex-wrap gap-2">
                        {ef.efeito.modificacoesLocais.map((mod: any) => {
                          const modBase = todasModificacoes.find(m => m.id === mod.modificacaoBaseId);
                          const isExtra = modBase?.tipo === 'extra';
                          return (
                            <Badge 
                              key={mod.id} 
                              variant={isExtra ? 'success' : 'warning'}
                              size="md"
                              className="font-medium"
                            >
                              {isExtra ? '➕' : '➖'} {modBase?.nome || mod.modificacaoBaseId}
                              {mod.grauModificacao && ` - Grau ${mod.grauModificacao}`}
                              {mod.parametros?.opcao && ` (${mod.parametros.opcao})`}
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

      <ModalFooter className="bg-gray-50 dark:bg-gray-900/50">
        <Button variant="secondary" onClick={copiarResumo} className="gap-2">
          📋 Copiar Resumo
        </Button>
        <Button variant="primary" onClick={onClose}>
          ✨ Fechar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
