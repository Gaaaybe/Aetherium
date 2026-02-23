# Power Creation Module

## Arquitetura

Este módulo segue **arquitetura híbrida** baseada na natureza dos dados:

### 📦 **Catálogos Estáticos** (Controller → Service → JSON)
Dados imutáveis do sistema, sem lógica de negócio:

#### GET /catalog/scales
Escalas de parâmetros (Ação, Alcance, Duração)

#### GET /catalog/universal-table  
Tabela universal com valores baseados em grau

#### GET /catalog/domains
Lista de domínios base do sistema (Natural, Sagrado, Científico, Armas, etc.)

**Por que endpoint direto?**
- Dados puramente descritivos
- Imutáveis (só o sistema define)
- Sem validações complexas
- Performance otimizada

---

### 🏗️ **Entidades Complexas** (DDD Completo)
Dados com lógica de negócio, validações e CRUD:

#### Effects (EffectBase)
- **Use Cases**: FetchEffects (com filtro por categoria)
- **Motivo**: Podem ser customizados por usuários no futuro
- Validações de custo, grau, categorias

#### Modifications (ModificationBase)  
- **Use Cases**: FetchModifications (filtros por tipo e categoria)
- **Motivo**: Extras/Falhas têm regras específicas de custo
- Validações complexas (custoFixo, custoPorGrau)

#### Peculiarities (Peculiarity) 🆕
- **Use Cases Completos**: Create, Update, Delete, GetById, FetchByUser
- **Motivo**: CRIADAS POR USUÁRIOS (não são imutáveis)
- Cada usuário tem suas próprias peculiaridades
- Validações: nome (3-100 chars), descrição (10-500 chars)
- Campos: userId, nome, descricao, espiritual, createdAt, updatedAt

---

## Como Domínios Funcionam

### Domain (Value Object)
Representa a **escolha** de domínio em um Power:

```typescript
// Domínio base simples
Domain.create({ name: DomainName.NATURAL })

// Científico com área de conhecimento
Domain.create({ 
  name: DomainName.CIENTIFICO,
  areaConhecimento: 'Física'  // Escolha da lista do catálogo
})

// Peculiar com referência à entidade criada
Domain.create({ 
  name: DomainName.PECULIAR,
  peculiarId: 'uuid-da-peculiaridade'  // ID da Peculiarity criada
})
```

### Fluxo Completo - Peculiarity

**1. Frontend busca catálogo base:**
```typescript
const baseDomains = await fetch('/catalog/domains').then(r => r.json());
// Retorna: Natural, Sagrado, Científico, Armas, Peculiar (descrição)
```

**2. Usuário cria sua Peculiarity:**
```typescript
const peculiarity = await createPeculiarity({
  userId: user.id,
  nome: 'Controle de Gravidade',
  descricao: 'Poder único de manipular gravidade',
  espiritual: true
});
// Salvo no banco, retorna UUID
```

**3. Frontend combina domínios base + peculiarities do user:**
```typescript
const userPeculiarities = await fetchUserPecularities({ userId: user.id });

const allDomains = [
  ...baseDomains,
  ...userPeculiarities.map(p => ({
    id: p.id,
    nome: p.nome,
    tipo: 'peculiar',
    espiritual: p.espiritual
  }))
];
// Mostra no dropdown: Natural, Sagrado, ..., Controle de Gravidade
```

**4. Cria Power com Peculiar:**
```typescript
const power = await createPower({
  nome: 'Levitar',
  dominio: {
    name: 'peculiar',
    peculiarId: peculiarity.id  // ← Referencia a Peculiarity criada
  }
});
```

---

## Comparação: Científico vs Peculiar

| Aspecto | Científico | Peculiar |
|---------|-----------|----------|
| **Tipo** | Domínio base (catálogo) | Entidade customizada (banco) |
| **Listagem** | Áreas pré-definidas no JSON | Criadas pelo usuário (CRUD) |
| **Armazenamento** | `/catalog/domains` | Use cases + Database |
| **Por Usuário** | ❌ Não | ✅ Sim (cada user tem suas) |
| **Uso em Power** | Seleciona área | Referencia ID da entidade |

---

## Dados

- `src/domain/power-creation/infrastructure/data/escalas.json`
- `src/domain/power-creation/infrastructure/data/tabelaUniversal.json`
- `src/domain/power-creation/infrastructure/data/dominios.json`

## Testes

✅ **80 testes passando** (28 Power + 17 PowerArray + 7 Effects/Modifications + 14 Peculiarity + 14 outros)
