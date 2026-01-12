# Sistema de Hydration e Compatibilidade de Poderes

## O Problema

Durante o playtest, o sistema de dados (efeitos, modificações) e a lógica de cálculo mudam frequentemente. Isso causa problemas:

- Poderes salvos ficam com custo desatualizado
- Modificações podem referenciar IDs que não existem mais
- Parâmetros podem ter valores inválidos
- Usuários precisam recriar poderes manualmente

## A Solução

O **Sistema de Hydration** valida e atualiza automaticamente poderes ao serem carregados, garantindo compatibilidade mesmo após mudanças no sistema.

## Como Funciona

### 1. Versionamento

Cada poder salvo agora tem um campo `schemaVersion` indicando a versão do sistema.

```typescript
{
  id: "123",
  nome: "Rajada de Fogo",
  schemaVersion: "1.0.0",  // ← Nova propriedade
  efeitos: [...],
  // ...
}
```

### 2. Validação Automática

Ao carregar um poder, o sistema automaticamente:

- ✅ Remove efeitos com IDs inexistentes
- ✅ Remove modificações com IDs inexistentes  
- ✅ Corrige graus inválidos
- ✅ Remove configurações inválidas
- ✅ Valida parâmetros (ação, alcance, duração)
- ✅ Adiciona campos faltantes com valores padrão

### 3. Recálculo Transparente

Os custos são sempre recalculados com a lógica atual - não confia nos valores salvos.

### 4. Feedback ao Usuário

Se houver mudanças, o sistema informa o que foi ajustado:

```
⚠️ Alguns itens foram removidos porque não existem mais no sistema:
• Modificação removida de efeito Dano: "velho-id" não existe mais

ℹ️ Atualizações aplicadas:
• Poder atualizado para o schema atual
• Grau inválido corrigido para 1 no efeito Dano
```

## Como Usar

### Carregar Poder com Validação Automática

```typescript
import { useBibliotecaPoderes } from '../hooks/useBibliotecaPoderes';
import { toast } from '../../../shared/ui';

function MeuComponente() {
  const { buscarPoderComHydration } = useBibliotecaPoderes();
  
  const carregarPoder = (id: string) => {
    const { poder, hydrationInfo } = buscarPoderComHydration(id);
    
    if (!poder) {
      toast.error('Poder não encontrado');
      return;
    }
    
    // Mostrar avisos se houve mudanças
    if (hydrationInfo?.hasIssues) {
      if (hydrationInfo.severity === 'warning') {
        toast.warning(hydrationInfo.message);
      } else {
        toast.info(hydrationInfo.message);
      }
    }
    
    // Usar o poder validado e atualizado
    carregarPoderNoEditor(poder);
  };
  
  // ...
}
```

### Importar Poder com Validação

A importação de JSON já aplica hydration automaticamente:

```typescript
const { importarPoder } = useBibliotecaPoderes();

const handleImportar = async (jsonString: string) => {
  try {
    const { poder, hydrationInfo } = importarPoder(jsonString);
    
    toast.success('Poder importado com sucesso!');
    
    if (hydrationInfo?.hasIssues) {
      toast.info(hydrationInfo.message);
    }
  } catch (error) {
    toast.error('Erro ao importar poder');
  }
};
```

### Salvar Poder

Ao salvar, a versão é automaticamente adicionada:

```typescript
const { salvarPoder } = useBibliotecaPoderes();

const poder = {
  nome: "Meu Poder",
  efeitos: [...],
  // não precisa especificar schemaVersion
};

salvarPoder(poder); // versão é adicionada automaticamente
```

## O Que É Validado

### Efeitos

- ✅ ID do efeito existe no sistema
- ✅ Grau é um número válido (≥ 1)
- ✅ Modificações locais são válidas

### Modificações

- ✅ ID da modificação existe no sistema
- ✅ Grau está entre mínimo e máximo permitido
- ✅ Parâmetros são necessários e válidos
- ✅ Configuração selecionada existe nas opções

### Parâmetros do Poder

- ✅ Ação, alcance e duração são números válidos
- ✅ Valores negativos são corrigidos para 0

### Custo Alternativo

- ✅ Tipo é válido ('pe', 'atributo', 'item', 'material')
- ✅ Removido se inválido

## Quando Usar

### Sempre Use `buscarPoderComHydration` Quando:

1. Carregar poder da biblioteca para editar
2. Carregar poder para visualização
3. Duplicar poder existente

### Use `buscarPoder` Normal Quando:

1. Apenas listando poderes (não precisa validar)
2. Apenas exibindo metadados (nome, data)

## Benefícios

1. **✅ Compatibilidade Garantida**: Poderes antigos funcionam após mudanças
2. **✅ Atualização Automática**: Não precisa intervenção manual
3. **✅ Feedback Claro**: Usuário sabe o que mudou
4. **✅ Zero Dados Perdidos**: Mantém dados inválidos são removidos com aviso
5. **✅ Transparente**: Funciona automaticamente, sem mudanças no código existente

## Versionamento Futuro

Quando houver mudanças que precisam de migrations específicas:

```typescript
// poderHydration.ts

function migrateTo_1_1_0(poder: Poder): Poder {
  // Exemplo: renomear campo
  if ('campoAntigo' in poder) {
    poder.campoNovo = poder.campoAntigo;
    delete poder.campoAntigo;
  }
  return poder;
}

// Na função hydratePoder:
if (poderSalvo.schemaVersion === '1.0.0') {
  poder = migrateTo_1_1_0(poder);
}
```

## Testando

Para testar o sistema, você pode:

1. Salvar um poder atual
2. Modificar `efeitos.json` ou `modificacoes.json` (remover/renomear IDs)
3. Recarregar o poder
4. Verificar que IDs inválidos foram removidos automaticamente
5. Ver toast com avisos das mudanças

## Implementação Técnica

- `poderHydration.ts`: Lógica de validação e atualização
- `useBibliotecaPoderes.ts`: Integração com localStorage
- `SCHEMA_VERSION`: Versão atual do schema (incrementar quando houver breaking changes)
