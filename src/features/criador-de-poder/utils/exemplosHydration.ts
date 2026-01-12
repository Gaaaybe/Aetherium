/**
 * Exemplo de uso do sistema de Hydration
 * 
 * Este arquivo demonstra como o sistema de hydration funciona na prática.
 */

import { hydratePoder, formatarMensagensHydration } from './poderHydration';
import type { PoderComVersion } from './poderHydration';

// ========== EXEMPLO 1: Poder antigo sem versão ==========
console.log('=== EXEMPLO 1: Poder sem versionamento ===\n');

const poderAntigo: PoderComVersion = {
  id: 'poder-antigo-1',
  nome: 'Rajada de Fogo',
  descricao: 'Um poder de fogo clássico',
  efeitos: [
    {
      id: 'efeito-1',
      efeitoBaseId: 'dano',
      grau: 5,
      modificacoesLocais: [],
    },
  ],
  modificacoesGlobais: [],
  acao: 1,
  alcance: 10,
  duracao: 0,
  // Nota: sem schemaVersion!
};

const resultado1 = hydratePoder(poderAntigo);
formatarMensagensHydration(resultado1);

console.log('Poder original:', JSON.stringify(poderAntigo, null, 2));
console.log('\nPoder após hydration:', JSON.stringify(resultado1.poder, null, 2));
console.log('\nMudanças aplicadas:');
resultado1.changes.forEach(c => console.log(`  - ${c}`));
console.log('\n');


// ========== EXEMPLO 2: Poder com modificações inválidas ==========
console.log('=== EXEMPLO 2: Poder com modificações removidas ===\n');

const poderComModInvalida: PoderComVersion = {
  id: 'poder-com-mod-invalida',
  nome: 'Teletransporte',
  descricao: '',
  efeitos: [
    {
      id: 'efeito-1',
      efeitoBaseId: 'teleporte',
      grau: 5,
      modificacoesLocais: [
        // Esta modificação não existe mais!
        {
          id: 'mod-local-1',
          modificacaoBaseId: 'modificacao-que-nao-existe-mais',
          escopo: 'local',
        },
      ],
    },
  ],
  modificacoesGlobais: [
    // Esta também não existe
    {
      id: 'mod-global-1',
      modificacaoBaseId: 'outra-modificacao-inexistente',
      escopo: 'global',
    },
  ],
  acao: 1,
  alcance: 1,
  duracao: 0,
  schemaVersion: '0.9.0',
};

const resultado2 = hydratePoder(poderComModInvalida);
const info2 = formatarMensagensHydration(resultado2);

console.log('Avisos:');
resultado2.warnings.forEach(w => console.log(`  ⚠️  ${w}`));
console.log('\nMudanças:');
resultado2.changes.forEach(c => console.log(`  ✅ ${c}`));
console.log('\nNível de severidade:', info2.severity);
console.log('\n');


// ========== EXEMPLO 3: Poder com graus inválidos ==========
console.log('=== EXEMPLO 3: Poder com graus inválidos ===\n');

const poderComGrausInvalidos: PoderComVersion = {
  id: 'poder-graus-invalidos',
  nome: 'Proteção Falha',
  descricao: '',
  efeitos: [
    {
      id: 'efeito-1',
      efeitoBaseId: 'protecao',
      grau: -10, // Grau negativo!
      modificacoesLocais: [],
    },
    {
      id: 'efeito-2',
      efeitoBaseId: 'dano',
      grau: NaN, // Grau inválido!
      modificacoesLocais: [],
    },
  ],
  modificacoesGlobais: [],
  acao: -5, // Ação negativa!
  alcance: 1000,
  duracao: NaN, // Duração inválida!
  schemaVersion: '1.0.0',
};

const resultado3 = hydratePoder(poderComGrausInvalidos);
formatarMensagensHydration(resultado3);

console.log('Efeitos corrigidos:');
resultado3.poder.efeitos.forEach(e => {
  console.log(`  - ${e.efeitoBaseId}: grau ${e.grau}`);
});
console.log('\nParâmetros corrigidos:');
console.log(`  - Ação: ${resultado3.poder.acao}`);
console.log(`  - Alcance: ${resultado3.poder.alcance}`);
console.log(`  - Duração: ${resultado3.poder.duracao}`);
console.log('\nMudanças aplicadas:');
resultado3.changes.forEach(c => console.log(`  - ${c}`));
console.log('\n');


// ========== EXEMPLO 4: Poder válido (sem mudanças) ==========
console.log('=== EXEMPLO 4: Poder já válido ===\n');

const poderValido: PoderComVersion = {
  id: 'poder-valido',
  nome: 'Bola de Fogo',
  descricao: 'Poder de fogo bem configurado',
  efeitos: [
    {
      id: 'efeito-1',
      efeitoBaseId: 'dano',
      grau: 10,
      modificacoesLocais: [
        {
          id: 'mod-local-1',
          modificacaoBaseId: 'area',
          escopo: 'local',
          grauModificacao: 2,
          parametros: { grau: 2 },
        },
      ],
    },
  ],
  modificacoesGlobais: [
    {
      id: 'mod-global-1',
      modificacaoBaseId: 'cansativo',
      escopo: 'global',
      grauModificacao: 1,
    },
  ],
  acao: 1,
  alcance: 10,
  duracao: 0,
  schemaVersion: '1.0.0',
};

const resultado4 = hydratePoder(poderValido);
const info4 = formatarMensagensHydration(resultado4);

console.log('Possui problemas?', info4.hasIssues);
console.log('Avisos:', resultado4.warnings.length);
console.log('Mudanças:', resultado4.changes.length);
console.log('✨ Poder está perfeito, nenhuma mudança necessária!\n');


// ========== EXEMPLO 5: Mensagem formatada para UI ==========
console.log('=== EXEMPLO 5: Mensagem formatada para Toast ===\n');

const poderProblematico: PoderComVersion = {
  id: 'poder-5',
  nome: 'Poder Problemático',
  descricao: '',
  efeitos: [
    {
      id: 'efeito-1',
      efeitoBaseId: 'efeito-inexistente',
      grau: 5,
      modificacoesLocais: [],
    },
    {
      id: 'efeito-2',
      efeitoBaseId: 'dano',
      grau: -3,
      modificacoesLocais: [],
    },
  ],
  modificacoesGlobais: [],
  acao: 1,
  alcance: 1,
  duracao: 0,
};

const resultado5 = hydratePoder(poderProblematico);
const info5 = formatarMensagensHydration(resultado5);

console.log('Mensagem para exibir no Toast:');
console.log('─'.repeat(50));
console.log(info5.message);
console.log('─'.repeat(50));
console.log('\nSeveridade:', info5.severity);
console.log('Cor sugerida:', info5.severity === 'warning' ? '🟡 Amarelo' : '🔵 Azul');


// ========== RESUMO ==========
console.log('\n\n' + '='.repeat(60));
console.log('RESUMO DO SISTEMA DE HYDRATION');
console.log('='.repeat(60));
console.log(`
O sistema de hydration garante que poderes salvos continuem funcionando
mesmo após mudanças no sistema:

✅ Remove efeitos/modificações que não existem mais
✅ Corrige graus negativos ou inválidos
✅ Ajusta parâmetros fora dos limites
✅ Adiciona campos faltantes com valores padrão
✅ Atualiza versão do schema automaticamente
✅ Fornece feedback detalhado sobre mudanças

Uso recomendado:
1. Sempre usar buscarPoderComHydration() ao carregar poderes
2. Exibir toast com info.message quando info.hasIssues === true
3. O poder já estará corrigido e salvo automaticamente
`);
