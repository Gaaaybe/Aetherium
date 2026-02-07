# 📋 Plano de Migração - Frontend para Arquitetura Full Stack (Monorepo + NestJS)

**Projeto:** Aetherium - Spirit & Caos RPG System  
**Data:** 28 de janeiro de 2026  
**Última Atualização:** 7 de fevereiro de 2026  
**Status:** Planejamento  
**Arquitetura:** Monorepo Fullstack com NestJS  

---

## 📑 Resumo Executivo

### Contexto
O projeto Aetherium atualmente funciona 100% no frontend com dados em `localStorage`. Para adicionar funcionalidades multi-usuário, colaboração e garantir confiabilidade dos dados, é necessário migrar para uma arquitetura fullstack.

### Solução Proposta
**Monorepo Fullstack** com:
- **Frontend:** React + Vite (mantido)
- **Backend:** NestJS + PostgreSQL + Redis
- **Packages Compartilhados:** Tipos, regras de negócio, dados estáticos
- **Deploy:** Frontend (Vercel/Netlify) + Backend (Railway/Render)

### Principais Mudanças

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Arquitetura** | SPA standalone | Monorepo fullstack |
| **Dados** | localStorage | PostgreSQL + cache local |
| **Regras de Negócio** | Frontend | Rules Engine + Backend API |
| **Autenticação** | Inexistente | JWT com Passport |
| **Colaboração** | Impossível | Campanhas multi-jogador |
| **Compartilhamento** | Inexistente | Biblioteca pública |
| **Real-time** | Não | WebSockets (opcional) |

### Funcionalidades Cobertas

✅ **Sistema de Poderes** - CRUD completo com validações server-side  
✅ **Sistema de Acervos** - Conjuntos de poderes com regras específicas  
✅ **Sistema de Personagens** - Fichas completas com cálculos automáticos  
✅ **Sistema de Criaturas** - Biblioteca, calculadora, tabela mestra  
✅ **Sistema de Favoritos** - Sincronização entre dispositivos  
✅ **Custom Items** - Efeitos, modificações e peculiaridades customizados  
✅ **Dados Estáticos** - API com cache agressivo  
✅ **Campanhas** - Multi-jogador com compartilhamento  
✅ **Biblioteca Pública** - Compartilhamento de conteúdo  
⚡ **Real-time** - WebSockets para colaboração ao vivo (opcional)

### Cronograma e Esforço

- **Duração Total:** 17-26 semanas (4-6 meses)
- **Esforço:** 510-760 horas
- **MVP Mínimo:** 9-13 semanas (Fases 0-2)

### Fases Principais

0. **Preparação** (2-3 sem) - Setup monorepo e packages  
1. **Autenticação** (2-3 sem) - Login, registro, JWT  
1.5. **Dados Estáticos** (1-2 sem) - APIs de dados, favoritos, custom items  
2. **Poderes + Acervos** (4-5 sem) - CRUD e cálculos server-side  
3. **Personagens** (3-4 sem) - Fichas completas  
3.5. **Criaturas** (2-3 sem) - Sistema de criaturas  
4. **Campanhas** (3-4 sem) - Multi-jogador e compartilhamento  
4+. **Real-time** (opcional) - WebSockets  

### Tecnologias

**Backend:** NestJS, TypeScript, Prisma, PostgreSQL, Redis, Socket.io  
**Frontend:** React, Vite, TypeScript, React Query, Axios  
**Monorepo:** PNPM, Turborepo, Changesets  
**Infra:** Docker, GitHub Actions, Sentry  

### Riscos Principais

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Perda de dados na migração | Alto | Feature flags + período de convivência |
| Performance degradada | Médio | Cache Redis + optimistic updates |
| Complexidade do monorepo | Médio | Turborepo + documentação clara |
| Curva de aprendizado NestJS | Baixo | Documentação excelente + exemplos |

### ROI e Benefícios

✅ **Escalabilidade** - Suporta milhares de usuários  
✅ **Segurança** - Regras imutáveis no servidor  
✅ **Confiabilidade** - Dados persistidos com backup  
✅ **Colaboração** - Campanhas e compartilhamento  
✅ **Manutenibilidade** - Código modular e testável  
✅ **Multi-dispositivo** - Sincronização automática  

---
### Organização do Projeto

```
aetherium/
├── packages/
│   ├── shared/                    # 📦 Código compartilhado
│   │   ├── types/                 # Tipos TypeScript compartilhados
│   │   ├── constants/             # Constantes (escalas, tabelas, etc)
│   │   ├── validation/            # Schemas Zod compartilhados
│   │   ├── utils/                 # Funções utilitárias puras
│   │   └── package.json
│   │
│   ├── rules-engine/              # 🎲 Motor de Regras (Standalone)
│   │   ├── src/
│   │   │   ├── powers/            # Cálculo de poderes e acervos
│   │   │   ├── characters/        # Cálculo de personagens
│   │   │   ├── creatures/         # Cálculo de criaturas
│   │   │   ├── scales/            # Sistema de escalas
│   │   │   └── index.ts           # Exporta todas as funções
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── static-data/               # 📚 Dados Estáticos
│       ├── src/
│       │   ├── efeitos.json
│       │   ├── modificacoes.json
│       │   ├── escalas.json
│       │   ├── dominios.json
│       │   ├── tabelaUniversal.json
│       │   ├── tabelaMestra.json
│       │   └── index.ts
│       └── package.json
│
├── apps/
│   ├── backend/                   # 🚀 NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/          # Autenticação e autorização
│   │   │   │   ├── users/         # Gestão de usuários
│   │   │   │   ├── powers/        # CRUD de poderes
│   │   │   │   ├── power-sets/    # CRUD de acervos
│   │   │   │   ├── characters/    # CRUD de personagens
│   │   │   │   ├── creatures/     # CRUD de criaturas
│   │   │   │   ├── campaigns/     # Gestão de campanhas
│   │   │   │   ├── favorites/     # Sistema de favoritos
│   │   │   │   ├── custom-items/  # Itens customizados
│   │   │   │   ├── static-data/   # Serve dados estáticos
│   │   │   │   ├── sharing/       # Compartilhamento
│   │   │   │   └── files/         # Upload de arquivos
│   │   │   ├── shared/
│   │   │   │   ├── guards/        # Guards de autenticação
│   │   │   │   ├── interceptors/  # Logging, transform
│   │   │   │   ├── filters/       # Exception handlers
│   │   │   │   ├── pipes/         # Validação
│   │   │   │   └── decorators/    # Custom decorators
│   │   │   ├── config/            # Configurações
│   │   │   └── main.ts
│   │   ├── test/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── nest-cli.json
│   │   └── package.json
│   │
│   └── frontend/                  # ⚛️ React Frontend (Vite)
│       ├── src/
│       │   ├── features/
│       │   ├── pages/
│       │   ├── shared/
│       │   ├── services/          # **NOVO**: API clients
│       │   │   ├── api/
│       │   │   │   ├── client.ts
│       │   │   │   ├── endpoints.ts
│       │   │   │   └── interceptors.ts
│       │   │   └── repositories/
│       │   │       ├── PowersRepository.ts
│       │   │       ├── CharactersRepository.ts
│       │   │       └── ...
│       │   ├── config/            # Feature flags
│       │   └── App.tsx
│       ├── vite.config.ts
│       └── package.json
│
├── .github/
│   └── workflows/                 # CI/CD
│       ├── backend.yml
│       ├── frontend.yml
│       └── shared.yml
│
├── docker-compose.yml             # Ambiente de desenvolvimento
├── turbo.json                     # Turborepo config
├── package.json                   # Root package.json
└── pnpm-workspace.yaml            # PNPM workspaces
```

### Gerenciamento de Dependências

- **Package Manager**: PNPM (workspaces mais eficientes)
- **Build System**: Turborepo (builds paralelos e cache)
- **Versionamento**: Changesets (versionamento semântico)

### Benefícios da Estrutura

1. **Tipos Compartilhados**: Frontend e Backend usam os mesmos tipos
2. **Rules Engine Isolado**: Regras de negócio testáveis e reutilizáveis
3. **Dados Estáticos Centralizados**: Uma única fonte de verdade
4. **Builds Otimizados**: Turborepo cacheia e paraleliza
5. **Testes Consistentes**: Mesma infraestrutura de testes

---

#### 🔴 **Alta Acoplamento - Crítico**
- **Regras de Negócio Complexas**
  - `src/features/criador-de-poder/regras/calculadoraCusto.ts` - 618 linhas de lógica de cálculo
  - `src/features/ficha-personagem/regras/calculadoraPersonagem.ts` - 364 linhas de cálculos
  - `src/features/criador-de-poder/regras/escalas.ts` - Sistema completo de escalas
  
- **Persistência de Dados Críticos**
  - Todo armazenamento em `localStorage`
  - Sem backup ou sincronização
  - Dados: poderes, **acervos**, personagens, bibliotecas, campanhas
  
- **Validação e Integridade**
  - Schema migration/hydration no cliente
  - Validações complexas client-side
  - Sem validação server-side (vulnerável a manipulação)

#### 🟡 **Médio Acoplamento - Preocupante**
- Biblioteca de poderes compartilháveis (mas sem compartilhamento real)
- **Sistema de Acervos** - Conjuntos de poderes com descritor comum
- Sistema de favoritos e customizações
- **Gerenciamento de criaturas** - Biblioteca, calculadora, tabela mestra
- Gerenciamento de criaturas e tabelas mestras
- **Sistema de Favoritos** - Efeitos e modificações favoritadas
- **Custom Items** - Efeitos, modificações e peculiaridades customizados  
- **Dados Estáticos** - JSONs carregados localmente (efeitos, modificações, etc)

#### 🟢 **Baixo Acoplamento - Aceitável**
- UI/UX e componentes visuais
- Formulários e inputs
- Navegação e routing
- Animações e transições

### Problemas Identificados

1. **Escalabilidade**: Impossível adicionar multi-usuário ou colaboração
2. **Segurança**: Regras podem ser adulteradas via DevTools
3. **Confiabilidade**: Dados vulneráveis a limpeza de cache/localStorage
4. **Manutenção**: Mudanças nas regras requerem deploy completo
5. **Sincronização**: Sem suporte multi-dispositivo
6. **Auditoria**: Impossível rastrear mudanças ou versões
7. **Colaboração**: Sem compartilhamento real de conteúdo entre usuários

---

## 🎯 Arquitetura Proposta

### Modelo Arquitetural: Híbrido (Client-Server)

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │   UI/UX Layer  │  │  State Manager │  │  Cache Layer   │ │
│  │   (React/TS)   │  │   (Zustand)    │  │  (IndexedDB)   │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
│           │                   │                   │          │
│           └───────────────────┴───────────────────┘          │
│                              │                               │
│                    ┌─────────▼─────────┐                     │
│                    │   API Client      │                     │
│                    │   (Axios/Fetch)   │                     │
│                    └─────────┬─────────┘                     │
└──────────────────────────────┼───────────────────────────────┘
                               │
                               │ REST/GraphQL
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                         BACKEND                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │  API Gateway   │  │  Auth Service  │  │  File Storage  │ │
│  │  (Express/TS)  │  │  (JWT/OAuth)   │  │    (S3/GCS)    │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
│           │                   │                   │          │
│  ┌────────▼───────────────────▼───────────────────▼────────┐ │
│  │              Business Logic Layer                       │ │
│  │  • Calculadora de Custos (regras imutáveis)            │ │
│  │  • Validador de Personagens                            │ │
│  │  • Gerenciador de Campanhas                            │ │
│  │  • Sistema de Compartilhamento                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│  ┌───────────────────────────▼──────────────────────────┐   │
│  │              Data Access Layer (ORM)                  │   │
│  │                   (Prisma/TypeORM)                    │   │
│  └───────────────────────────┬──────────────────────────┘   │
│                              │                               │
│  ┌───────────────────────────▼──────────────────────────┐   │
│  │              Database (PostgreSQL)                    │   │
│  │  • users          • characters    • campaigns        │   │
│  │  • powers         • power_sets    • creatures        │   │
│  │  • shared_content • audit_logs    • sessions         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Princípios da Nova Arquitetura

1. **Single Source of Truth**: Backend é a fonte definitiva
2. **Offline-First**: Frontend funciona offline com sincronização
3. **Progressive Enhancement**: Migração gradual sem breaking changes
4. **API-First**: Backend expõe APIs consumíveis por qualquer cliente
5. **Type-Safe**: TypeScript em todo stack com tipos compartilhados

---

## 🔧 Stack Tecnológica Recomendada

### Backend (NestJS)

```typescript
┌─────────────────────────────────────────────────┐
│ Runtime:        Node.js 20+ (LTS)              │
│ Framework:      NestJS 10+                     │
│ Linguagem:      TypeScript 5+                  │
│ ORM:            Prisma 5+                      │
│ Database:       PostgreSQL 16+                 │
│ Cache:          Redis (opcional fase 2)       │
│ Auth:           Passport + JWT + bcrypt       │
│ Validação:      class-validator + Zod         │
│ Testing:        Jest + Supertest              │
│ Docs:           Swagger/OpenAPI (automático)  │
│ WebSockets:     Socket.io (fase campanhas)    │
│ File Upload:    Multer + Sharp (imagens)      │
│ Queue:          Bull (background jobs)         │
└─────────────────────────────────────────────────┘
```

### Justificativas

- **NestJS**: Arquitetura modular, decorators, DI, ecosystem maduro, TypeScript nativo
- **Prisma**: Type-safety completa, migrations automáticas, excelente DX
- **PostgreSQL**: ACID, JSON support, confiável para dados críticos
- **Zod + class-validator**: Validação client + server com tipos compartilhados
- **Passport**: Estratégias de autenticação modulares (JWT, OAuth, etc)
- **Socket.io**: Real-time para campanhas e colaboração

### Monorepo Tools

```typescript
┌─────────────────────────────────────────────────┐
│ Package Manager: PNPM 9+                       │
│ Build System:    Turborepo                     │
│ Versionamento:   Changesets                    │
│ Linting:         ESLint (shared config)        │
│ Formatting:      Prettier (shared config)      │
└─────────────────────────────────────────────────┘
```

### Frontend (Mudanças)

```typescript
┌─────────────────────────────────────────────────┐
│ State:          Zustand + React Query          │
│ Cache:          IndexedDB (via Dexie.js)      │
│ API Client:     Axios + interceptors           │
│ Offline:        Service Workers (PWA)          │
│ Sync:           Background sync quando online  │
└─────────────────────────────────────────────────┘
```

---

## 🗺️ Plano de Migração Gradual

### Fase 0: Preparação (1-2 semanas)

#### Objetivos
- Preparar frontend para consumir APIs
- Criar abstração de dados
- Configurar ambiente de desenvolvimento
- **Estruturar monorepo**
- **Configurar packages compartilhados**

#### Tarefas

**1. Setup do Monorepo:**
```bash
# Criar estrutura
mkdir -p aetherium/{packages,apps}

# Inicializar workspaces
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'

# Instalar ferramentas
pnpm add -D -w turbo
pnpm add -D -w @changesets/cli
```

**2. Package: @aetherium/shared**
```typescript
packages/shared/
├── src/
│   ├── types/
│   │   ├── user.types.ts
│   │   ├── power.types.ts
│   │   ├── character.types.ts
│   │   ├── creature.types.ts
│   │   ├── campaign.types.ts
│   │   └── index.ts
│   ├── constants/
│   │   ├── scales.ts
│   │   ├── attributes.ts
│   │   └── index.ts
│   ├── validation/
│   │   ├── power.schema.ts
│   │   ├── character.schema.ts
│   │   └── index.ts
│   └── utils/
│       ├── id-generator.ts
│       └── index.ts
└── package.json
```

**3. Package: @aetherium/rules-engine**
```typescript
packages/rules-engine/
├── src/
│   ├── powers/
│   │   ├── cost-calculator.ts        # Migrar de frontend
│   │   ├── power-set-calculator.ts   # Cálculo de acervos
│   │   └── validators.ts
│   ├── characters/
│   │   ├── stats-calculator.ts       # Migrar de frontend
│   │   ├── vitals-calculator.ts
│   │   └── validators.ts
│   ├── creatures/
│   │   ├── creature-calculator.ts    # Migrar de frontend
│   │   ├── master-table.ts
│   │   └── role-templates.ts
│   ├── scales/
│   │   └── parameter-calculator.ts
│   └── index.ts
├── tests/
└── package.json
```

**4. Package: @aetherium/static-data**
```typescript
packages/static-data/
├── src/
│   ├── efeitos.json
│   ├── modificacoes.json
│   ├── escalas.json
│   ├── dominios.json
│   ├── tabelaUniversal.json
│   ├── tabelaMestra.json
│   └── index.ts                       # Exporta tudo tipado
└── package.json
```

**Frontend:**
```typescript
// 1. Criar camada de abstração de dados
apps/frontend/src/services/
  ├── api/
  │   ├── client.ts           // Axios configurado
  │   ├── endpoints.ts        // URLs centralizadas
  │   └── interceptors.ts     // Auth, errors, retry
  ├── repositories/
  │   ├── PowersRepository.ts
  │   ├── PowerSetsRepository.ts
  │   ├── PersonagensRepository.ts
  │   ├── CampanhasRepository.ts
  │   ├── CreaturesRepository.ts
  │   ├── FavoritesRepository.ts
  │   └── CustomItemsRepository.ts
  └── sync/
      ├── SyncManager.ts      // Gerencia sincronização
      └── OfflineQueue.ts     // Fila de operações offline

// 2. Criar feature flags
apps/frontend/src/config/features.ts
  export const FEATURES = {
    USE_BACKEND_API: false,           // Toggle gradual
    USE_BACKEND_CALCULATION: false,   // Cálculos no backend
    OFFLINE_MODE: true,
    SYNC_ENABLED: false,
    REALTIME_CAMPAIGNS: false,
  }
```

**Backend (Setup inicial - NestJS):**
```bash
# Criar app NestJS
cd apps
nest new backend

# Instalar dependências
cd backend
pnpm add @nestjs/config @nestjs/passport passport passport-jwt
pnpm add @nestjs/swagger
pnpm add @prisma/client
pnpm add class-validator class-transformer
pnpm add bcrypt
pnpm add -D @nestjs/testing prisma
```

**Estrutura NestJS:**
```typescript
apps/backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── dto/
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   └── ... (outros módulos)
│   ├── shared/
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   └── decorators/
│   │       └── current-user.decorator.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
└── test/
```

**Entregáveis:**
- [ ] Monorepo estruturado (PNPM + Turborepo)
- [ ] Packages compartilhados configurados
- [ ] Rules engine isolado e testado
- [ ] Repositório backend (NestJS) configurado
- [ ] Camada de abstração no frontend
- [ ] Feature flags implementadas
- [ ] Ambiente de desenvolvimento (Docker Compose)
- [ ] CI/CD básico (GitHub Actions)

---

### Fase 1: Autenticação e Usuários (2-3 semanas)

#### Objetivos
- Sistema de login/registro
- Gestão de sessões
- Migração de dados locais para contas

#### Schema do Banco

```prisma
// prisma/schema.prisma

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String    @unique
  passwordHash  String
  displayName   String?
  avatarUrl     String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  
  // Relações
  powers        Power[]
  powerSets     PowerSet[]
  characters    Character[]
  campaigns     Campaign[]
  sharedContent SharedContent[]
  
  // Preferências
  preferences   Json?     // Dark mode, etc
  
  @@index([email])
  @@index([username])
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  token        String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId])
}
```

#### APIs

```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

// POST /api/auth/logout
// GET  /api/auth/me
// PUT  /api/auth/profile
```

#### Frontend

```typescript
// src/features/auth/
├── components/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── ProfileMenu.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useSession.ts
└── services/
    └── AuthService.ts

// Hook de autenticação
const { user, login, logout, isAuthenticated } = useAuth();

// Migração de dados locais
const migrarDadosLocais = async () => {
  const poderesLocais = localStorage.getItem('biblioteca-poderes');
  if (poderesLocais && user) {
    await api.post('/api/migration/powers', JSON.parse(poderesLocais));
  }
};
```

**Entregáveis:**
- [ ] Sistema de registro/login
- [ ] JWT authentication com Passport
- [ ] Protected routes no frontend
- [ ] Migração de dados locais para conta
- [ ] Persistência de sessão
- [ ] Rate limiting (proteção contra brute force)

---

### Fase 1.5: Dados Estáticos e Preferências (1-2 semanas)

#### Objetivos
- Servir dados estáticos via API (com cache agressivo)
- Sincronizar preferências do usuário (dark mode, etc)
- Sistema de favoritos (efeitos e modificações)
- Sistema de custom items (efeitos, modificações, peculiaridades)

#### Schema do Banco

```prisma
model UserPreferences {
  id            String    @id @default(cuid())
  userId        String    @unique
  
  // Aparência
  darkMode      Boolean   @default(false)
  theme         String?   @default("default")
  
  // Interface
  compactMode   Boolean   @default(false)
  showTutorials Boolean   @default(true)
  
  // Notificações
  emailNotifications    Boolean @default(true)
  pushNotifications     Boolean @default(false)
  
  // Outros
  defaultView   String?   // 'biblioteca', 'criador', etc
  
  updatedAt     DateTime  @updatedAt
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Favorite {
  id            String    @id @default(cuid())
  userId        String
  type          String    // 'efeito' | 'modificacao'
  itemId        String    // ID do efeito ou modificação
  
  createdAt     DateTime  @default(now())
  
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, type, itemId])
  @@index([userId, type])
}

model CustomEffect {
  id                String    @id @default(cuid())
  userId            String
  nome              String
  custoBase         Int
  descricao         String
  parametrosPadrao  Json      // { acao, alcance, duracao }
  categorias        String[]
  exemplos          String?
  requerInput       Boolean   @default(false)
  tipoInput         String?
  labelInput        String?
  placeholderInput  String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

model CustomModification {
  id                String    @id @default(cuid())
  userId            String
  nome              String
  tipo              String    // 'extra' | 'falha'
  custoPorGrau      Int
  custoFixo         Int       @default(0)
  descricao         String
  podeSerGraduada   Boolean   @default(false)
  escopo            String?   // 'global' | 'local' | 'ambos'
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

model Peculiarity {
  id                String    @id @default(cuid())
  userId            String
  nome              String
  espiritual        Boolean
  fundamento        Json      // { oQueE, comoFunciona, regrasInternas, requerimentos }
  descricaoCurta    String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
```

#### APIs

```typescript
// ===== Dados Estáticos (Cache: 1 dia) =====
GET    /api/static/efeitos            // Lista todos os efeitos base
GET    /api/static/modificacoes       // Lista todas as modificações base
GET    /api/static/escalas            // Sistema de escalas
GET    /api/static/dominios           // Lista de domínios
GET    /api/static/tabela-universal   // Tabela universal
GET    /api/static/tabela-mestra      // Tabela mestra (criaturas)

// ===== Preferências do Usuário =====
GET    /api/users/me/preferences      // Buscar preferências
PUT    /api/users/me/preferences      // Atualizar preferências

// ===== Sistema de Favoritos =====
GET    /api/favorites                 // Listar todos os favoritos
GET    /api/favorites/efeitos         // Apenas efeitos favoritados
GET    /api/favorites/modificacoes    // Apenas modificações favoritadas
POST   /api/favorites                 // Adicionar favorito
  Body: { type: 'efeito' | 'modificacao', itemId: string }
DELETE /api/favorites/:id             // Remover favorito

// ===== Custom Items - Efeitos =====
GET    /api/custom-effects            // Listar efeitos customizados do usuário
GET    /api/custom-effects/:id        // Buscar efeito específico
POST   /api/custom-effects            // Criar efeito customizado
PUT    /api/custom-effects/:id        // Atualizar efeito
DELETE /api/custom-effects/:id        // Deletar efeito

// ===== Custom Items - Modificações =====
GET    /api/custom-modifications
GET    /api/custom-modifications/:id
POST   /api/custom-modifications
PUT    /api/custom-modifications/:id
DELETE /api/custom-modifications/:id

// ===== Custom Items - Peculiaridades =====
GET    /api/peculiarities
GET    /api/peculiarities/:id
POST   /api/peculiarities
PUT    /api/peculiarities/:id
DELETE /api/peculiarities/:id
```

#### NestJS Modules

```typescript
// apps/backend/src/modules/static-data/
@Module({
  controllers: [StaticDataController],
  providers: [StaticDataService],
})
export class StaticDataModule {}

// Serve dados do package @aetherium/static-data com cache
@Controller('static')
export class StaticDataController {
  @Get('efeitos')
  @CacheKey('static:efeitos')
  @CacheTTL(86400) // 1 dia
  getEfeitos() {
    return staticData.efeitos;
  }
  // ...
}

// apps/backend/src/modules/favorites/
@Module({
  imports: [PrismaModule],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}

// apps/backend/src/modules/custom-items/
@Module({
  imports: [PrismaModule],
  controllers: [
    CustomEffectsController,
    CustomModificationsController,
    PeculiaritiesController,
  ],
  providers: [CustomItemsService],
  exports: [CustomItemsService],
})
export class CustomItemsModule {}
```

**Entregáveis:**
- [ ] API de dados estáticos com cache
- [ ] Sistema de preferências do usuário
- [ ] CRUD completo de favoritos
- [ ] CRUD completo de custom items
- [ ] Frontend adaptado para consumir APIs
- [ ] Migração de dados do localStorage

---

### Fase 2: Poderes e Acervos - Backend (3-5 semanas)

#### Objetivos
- Migrar lógica de cálculo de poderes para backend
- Implementar sistema de Acervos (Power Sets) com regras específicas
- Persistência em banco de dados
- API completa de CRUD

#### Schema do Banco

```prisma
model Power {
  id                    String    @id @default(cuid())
  userId                String
  name                  String
  description           String?
  domainId              String
  
  // Parâmetros do poder
  action                Int
  range                 Int
  duration              Int
  
  // Custo alternativo (JSON para flexibilidade)
  alternativeCost       Json?
  
  // Metadados
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  schemaVersion         String    @default("1.0.0")
  
  // Relações
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  effects               PowerEffect[]
  globalModifications   PowerModification[]
  powerSets             PowerSetPower[]  // Acervos que contêm este poder
  sharedWith            SharedContent[]
  
  // Soft delete
  deletedAt             DateTime?
  
  @@index([userId])
  @@index([domainId])
  @@index([createdAt])
}

model PowerEffect {
  id                    String    @id @default(cuid())
  powerId               String
  effectBaseId          String
  rank                  Int
  customInput           String?
  selectedConfig        String?
  order                 Int       // Para manter ordem
  
  power                 Power     @relation(fields: [powerId], references: [id], onDelete: Cascade)
  localModifications    PowerModification[]
  
  @@index([powerId])
}

model PowerModification {
  id                    String    @id @default(cuid())
  modificationBaseId    String
  scope                 String    // 'global' | 'local'
  parameters            Json?
  modificationRank      Int?
  note                  String?
  
  // Relações (uma das duas)
  powerId               String?
  effectId              String?
  
  power                 Power?       @relation(fields: [powerId], references: [id], onDelete: Cascade)
  effect                PowerEffect? @relation(fields: [effectId], references: [id], onDelete: Cascade)
  
  @@index([powerId])
  @@index([effectId])
}

model PowerSet {
  id                    String    @id @default(cuid())
  userId                String
  name                  String
  descriptor            String    // Descritor comum (ex: "Fogo", "Elementais")
  
  // Metadados
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relações
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  powers                PowerSetPower[]
  sharedWith            SharedContent[]
  
  // Soft delete
  deletedAt             DateTime?
  
  @@index([userId])
  @@index([createdAt])
}

model PowerSetPower {
  id                    String    @id @default(cuid())
  powerSetId            String
  powerId               String
  order                 Int       // Ordem no acervo
  
  powerSet              PowerSet  @relation(fields: [powerSetId], references: [id], onDelete: Cascade)
  power                 Power     @relation(fields: [powerId], references: [id], onDelete: Cascade)
  
  @@unique([powerSetId, powerId])
  @@index([powerSetId])
  @@index([powerId])
}
```

#### APIs

```typescript
// CRUD básico
GET    /api/powers              // Listar poderes do usuário
GET    /api/powers/:id          // Buscar poder específico
POST   /api/powers              // Criar novo poder
PUT    /api/powers/:id          // Atualizar poder
DELETE /api/powers/:id          // Deletar poder

// Operações especiais
POST   /api/powers/:id/duplicate    // Duplicar poder
GET    /api/powers/:id/calculate    // Calcular custos (server-side)
POST   /api/powers/:id/validate     // Validar poder
GET    /api/powers/shared           // Poderes compartilhados

// Busca e filtros
GET    /api/powers?domain=:id       // Filtrar por domínio
GET    /api/powers?search=:query    // Buscar por nome/descrição

// Acervos de Poderes (Power Sets)
GET    /api/power-sets              // Listar acervos do usuário
GET    /api/power-sets/:id          // Buscar acervo específico
POST   /api/power-sets              // Criar novo acervo
PUT    /api/power-sets/:id          // Atualizar acervo
DELETE /api/power-sets/:id          // Deletar acervo

// Operações de acervo
POST   /api/power-sets/:id/add-power       // Adicionar poder ao acervo
DELETE /api/power-sets/:id/remove-power/:powerId  // Remover poder
GET    /api/power-sets/:id/calculate       // Calcular custos do acervo
POST   /api/power-sets/:id/validate        // Validar acervo (regras)
GET    /api/power-sets/shared              // Acervos compartilhados
```

#### Migração da Lógica de Cálculo

```typescript
// backend/src/modules/powers/services/PowerCalculator.ts
// Migrar de: src/features/criador-de-poder/regras/calculadoraCusto.ts

export class PowerCalculatorService {
  calculatePowerCost(power: Power): PowerCostDetails {
    // Mesma lógica, mas server-side
    // Fonte única de verdade
  }
  
  validatePower(power: Power): ValidationResult {
    // Validações de integridade
  }
  
  calculateDefaultParameters(effects: Effect[]): Parameters {
    // Auto-cálculo de parâmetros
  }
}

// backend/src/modules/powers/services/PowerSetCalculator.ts
// Migrar de: src/features/criador-de-poder/hooks/useAcervoCalculator.ts

export class PowerSetCalculatorService {
  calculatePowerSetCost(powerSet: PowerSet): PowerSetCostDetails {
    // Regras do Acervo:
    // - Custo = poder mais caro + 1 PdA por cada adicional
    // - Espaços = soma de todos os poderes
    // - Validações: mínimo 2 poderes, sem permanentes (duração=5)
    // - Nenhum poder pode custar mais que o principal
  }
  
  validatePowerSet(powerSet: PowerSet): ValidationResult {
    // Validações específicas de acervo
    // - Mínimo 2 poderes
    // - Sem poderes com duração permanente
    // - Descritor obrigatório
  }
  
  detectPrincipalPower(powerSet: PowerSet): Power {
    // Identifica o poder mais caro (principal)
  }
}
```

#### Frontend (Adaptação)

```typescript
// src/features/criador-de-poder/hooks/usePoderCalculator.ts
export function usePoderCalculator() {
  const { data: poder, mutate } = usePower(powerId);
  const { mutate: savePower } = useSavePower();
  
  // Cálculos em tempo real (cache) OPCIONAL
  // Se FEATURES.USE_BACKEND_CALCULATION === true, usa API
  const detalhes = useQuery(
    ['power-calculation', poder?.id],
    () => api.get(`/api/powers/${poder.id}/calculate`),
    { enabled: !!poder?.id, staleTime: 30000 }
  );
  
  // Operações otimistas para UX
  const adicionarEfeito = async (efeitoId: string, grau: number) => {
    // Otimistic update
    mutate(draft => {
      draft.effects.push({ efeitoId, grau, ... });
    }, { revalidate: false });
    
    // Sincroniza com backend
    await savePower(poder);
  };
}
```

**Entregáveis:**
- [ ] CRUD completo de poderes
- [ ] CRUD completo de acervos (Power Sets)
- [ ] Lógica de cálculo server-side (poderes e acervos)
- [ ] Validação server-side (regras de acervo)
- [ ] Frontend adaptado para usar API
- [ ] Sincronização otimista
- [ ] Testes unitários de cálculo (poderes e acervos)

---

### Fase 3: Personagens - Backend (3-4 semanas)

#### Schema do Banco

```prisma
model Character {
  id                String    @id @default(cuid())
  userId            String
  name              String
  level             Int       @default(1)
  experience        Int       @default(0)
  
  // Atributos
  attributes        Json      // { Força: 10, Destreza: 10, ... }
  tempBonuses       Json?     // Bônus temporários
  
  // Recursos vitais
  currentHP         Int
  maxHP             Int
  currentPE         Int
  maxPE             Int
  temporaryHP       Int       @default(0)
  
  // Habilidades e perícias
  skills            Json      // { Acrobacia: { ranks: 2, ... }, ... }
  
  // Poderes
  powers            Json[]    // Referências para poderes + configurações
  
  // Equipamento
  inventory         Json?
  
  // Campanha (opcional)
  campaignId        String?
  
  // Metadados
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  campaign          Campaign? @relation(fields: [campaignId], references: [id])
  
  @@index([userId])
  @@index([campaignId])
}
```

#### APIs

```typescript
GET    /api/characters
GET    /api/characters/:id
POST   /api/characters
PUT    /api/characters/:id
DELETE /api/characters/:id

// Operações especiais
POST   /api/characters/:id/level-up
PUT    /api/characters/:id/vitals        // Atualizar HP/PE
POST   /api/characters/:id/rest          // Descanso
GET    /api/characters/:id/calculate     // Recalcular valores derivados
POST   /api/characters/:id/add-power     // Adicionar poder
POST   /api/characters/:id/add-power-set // Adicionar acervo
```

**Entregáveis:**
- [ ] CRUD de personagens
- [ ] Cálculos server-side
- [ ] Sistema de level-up
- [ ] Gestão de recursos vitais
- [ ] Integração com poderes e acervos

---

### Fase 3.5: Gerenciador de Criaturas (2-3 semanas)

#### Objetivos
- Sistema completo de criação e gestão de criaturas
- Biblioteca de criaturas salvas
- Calculadora de stats baseada na tabela mestra
- Sistema de combate/tabuleiro (reactflow)

#### Schema do Banco

```prisma
model Creature {
  id                String    @id @default(cuid())
  userId            String    // Criador da criatura
  name              String
  level             Int       @default(1)
  role              String    // 'Lacaio' | 'Padrao' | 'Bruto' | 'Elite' | 'ChefeSolo'
  
  // Configuração de Atributos
  attributeDistribution Json  // { major: ['INT'], medium: ['DES', 'CON'], minor: ['FOR', 'SAB', 'CAR'] }
  
  // Stats Calculados (armazenados para performance)
  stats             Json      // { hp, maxHp, pe, maxPe, attackBonus, damage, etc }
  
  // Recursos Atuais (para uso em combate)
  currentHp         Int
  currentPe         Int
  sovereignty       Int?      // Para chefes
  
  // Habilidades especiais
  abilities         Json[]    // Referências ou descrição
  
  // Descrição narrativa
  description       String?
  notes             String?
  imageUrl          String?
  
  // Campanha (opcional)
  campaignId        String?
  
  // Metadados
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  campaign          Campaign? @relation(fields: [campaignId], references: [id])
  
  @@index([userId])
  @@index([campaignId])
  @@index([level])
  @@index([role])
}

model CreatureBoard {
  id                String    @id @default(cuid())
  userId            String
  campaignId        String?
  name              String    @default("Tabuleiro de Combate")
  
  // Estado do tabuleiro (nodes e edges do ReactFlow)
  nodes             Json[]    // Criaturas e posições
  edges             Json[]    // Conexões
  viewport          Json?     // { x, y, zoom }
  
  // Metadados
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  campaign          Campaign? @relation(fields: [campaignId], references: [id])
  
  @@index([userId])
  @@index([campaignId])
}

model MasterTableCache {
  id                String    @id @default(cuid())
  version           String    @unique @default("1.0.0")
  data              Json      // Tabela mestra completa
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

#### APIs

```typescript
// ===== CRUD de Criaturas =====
GET    /api/creatures                 // Listar criaturas do usuário
GET    /api/creatures/:id             // Buscar criatura específica
POST   /api/creatures                 // Criar nova criatura
PUT    /api/creatures/:id             // Atualizar criatura
DELETE /api/creatures/:id             // Deletar criatura

// Operações especiais
POST   /api/creatures/:id/duplicate   // Duplicar criatura
GET    /api/creatures/:id/calculate   // Recalcular stats
PUT    /api/creatures/:id/vitals      // Atualizar HP/PE/Soberania
POST   /api/creatures/:id/level-up    // Aumentar nível

// Busca e filtros
GET    /api/creatures?level=:level    // Filtrar por nível
GET    /api/creatures?role=:role      // Filtrar por função
GET    /api/creatures?campaignId=:id  // Criaturas de campanha

// ===== Tabela Mestra =====
GET    /api/master-table              // Obter tabela completa (cache)
GET    /api/master-table/:level       // Obter dados de um nível específico

// ===== Tabuleiro de Combate =====
GET    /api/creature-boards           // Listar tabuleiros do usuário
GET    /api/creature-boards/:id       // Buscar tabuleiro específico
POST   /api/creature-boards           // Criar novo tabuleiro
PUT    /api/creature-boards/:id       // Atualizar tabuleiro
DELETE /api/creature-boards/:id       // Deletar tabuleiro

// ===== Compartilhamento =====
GET    /api/shared/creatures          // Criaturas públicas
POST   /api/creatures/:id/share       // Compartilhar criatura
POST   /api/creatures/:id/clone       // Clonar criatura compartilhada
```

#### NestJS Module

```typescript
// apps/backend/src/modules/creatures/
@Module({
  imports: [PrismaModule],
  controllers: [
    CreaturesController,
    CreatureBoardsController,
    MasterTableController,
  ],
  providers: [
    CreaturesService,
    CreatureCalculatorService,    // Usa @aetherium/rules-engine
    MasterTableService,
  ],
  exports: [CreaturesService],
})
export class CreaturesModule {}

// Serviço de cálculo
@Injectable()
export class CreatureCalculatorService {
  constructor(
    private masterTableService: MasterTableService,
  ) {}
  
  calculateCreatureStats(
    level: number,
    role: CreatureRole,
    attributeDistribution: AttributeDistribution,
  ): CreatureStats {
    // Usa @aetherium/rules-engine/creatures
    const masterRow = this.masterTableService.getRow(level);
    const roleTemplate = getRoleTemplate(role);
    return calculateStats(masterRow, roleTemplate, attributeDistribution);
  }
}
```

**Entregáveis:**
- [ ] CRUD completo de criaturas
- [ ] Sistema de cálculo server-side
- [ ] API da tabela mestra (com cache)
- [ ] CRUD de tabuleiros de combate
- [ ] Frontend adaptado para usar API
- [ ] Sincronização otimista
- [ ] Testes unitários de cálculo

---

### Fase 4: Campanhas e Colaboração (4-5 semanas)

#### Objetivos
- Sistema de campanhas multi-jogador
- Compartilhamento de poderes/personagens/criaturas
- Gestão de permissões
- **Real-time via WebSockets** (opcional mas recomendado)

#### Schema do Banco

```prisma
model Campaign {
  id            String    @id @default(cuid())
  name          String
  description   String?
  gmUserId      String    // Game Master
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  gm            User        @relation("GMCampaigns", fields: [gmUserId], references: [id])
  players       CampaignPlayer[]
  characters    Character[]
  sessions      Session[]
  sharedContent SharedContent[]
  
  @@index([gmUserId])
}

model CampaignPlayer {
  id            String    @id @default(cuid())
  campaignId    String
  userId        String
  role          String    @default("player") // player, assistant_gm
  
  joinedAt      DateTime  @default(now())
  
  campaign      Campaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([campaignId, userId])
}

model SharedContent {
  id            String    @id @default(cuid())
  type          String    // 'power', 'power_set', 'character', 'creature'
  contentId     String    // ID do conteúdo compartilhado
  ownerId       String
  
  // Compartilhamento
  isPublic      Boolean   @default(false)
  campaignId    String?   // Compartilhado com campanha específica
  
  // Metadados
  views         Int       @default(0)
  likes         Int       @default(0)
  
  createdAt     DateTime  @default(now())
  
  owner         User      @relation(fields: [ownerId], references: [id])
  campaign      Campaign? @relation(fields: [campaignId], references: [id])
  
  @@index([type, isPublic])
  @@index([campaignId])
}
```

#### APIs

```typescript
// Campanhas
GET    /api/campaigns
POST   /api/campaigns
GET    /api/campaigns/:id
PUT    /api/campaigns/:id
DELETE /api/campaigns/:id

// Jogadores
POST   /api/campaigns/:id/invite      // Convidar jogador
POST   /api/campaigns/:id/join        // Aceitar convite
DELETE /api/campaigns/:id/leave       // Sair da campanha
DELETE /api/campaigns/:id/kick/:userId

// Compartilhamento
GET    /api/shared/powers             // Poderes públicos
GET    /api/shared/powers/:id
POST   /api/powers/:id/share          // Compartilhar poder
POST   /api/powers/:id/clone          // Clonar poder compartilhado

GET    /api/shared/power-sets         // Acervos públicos
GET    /api/shared/power-sets/:id
POST   /api/power-sets/:id/share      // Compartilhar acervo
POST   /api/power-sets/:id/clone      // Clonar acervo compartilhado

GET    /api/shared/characters/:id     // Personagem compartilhado
POST   /api/characters/:id/share      // Compartilhar personagem
POST   /api/characters/:id/clone      // Clonar personagem

GET    /api/shared/creatures/:id      // Criatura compartilhada
POST   /api/creatures/:id/share       // Compartilhar criatura
POST   /api/creatures/:id/clone       // Clonar criatura
```

#### WebSocket Events (Real-time) - Opcional mas Recomendado

```typescript
// ===== Namespace: /campaigns/:campaignId =====

// Cliente -> Servidor
'join-campaign'              // Entrar na sala da campanha
'leave-campaign'             // Sair da sala
'update-creature-vitals'     // Atualizar HP/PE de criatura
'add-creature-to-board'      // Adicionar criatura ao tabuleiro
'move-creature'              // Mover criatura no tabuleiro
'send-message'               // Enviar mensagem no chat
'roll-dice'                  // Rolar dados
'update-initiative'          // Atualizar ordem de iniciativa

// Servidor -> Cliente (broadcasts)
'creature-vitals-updated'    // Criatura teve HP/PE alterado
'creature-added'             // Nova criatura no tabuleiro
'creature-moved'             // Criatura movida
'creature-removed'           // Criatura removida
'message-received'           // Nova mensagem no chat
'dice-rolled'                // Resultado de rolagem
'initiative-updated'         // Ordem de iniciativa mudou
'player-joined'              // Jogador entrou na campanha
'player-left'                // Jogador saiu da campanha
'session-started'            // Sessão iniciada pelo GM
'session-ended'              // Sessão encerrada
```

#### NestJS Module (com WebSockets)

```typescript
// apps/backend/src/modules/campaigns/campaigns.module.ts
@Module({
  imports: [
    PrismaModule,
    UsersModule,
    CharactersModule,
    CreaturesModule,
  ],
  controllers: [
    CampaignsController,
    CampaignPlayersController,
  ],
  providers: [
    CampaignsService,
    CampaignGateway,        // WebSocket Gateway
  ],
  exports: [CampaignsService],
})
export class CampaignsModule {}

// apps/backend/src/modules/campaigns/campaigns.gateway.ts
@WebSocketGateway({
  namespace: /\/campaigns\/[^/]+/,  // Namespace dinâmico
  cors: { origin: process.env.FRONTEND_URL },
})
export class CampaignGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  constructor(
    private campaignsService: CampaignsService,
    private creaturesService: CreaturesService,
  ) {}
  
  async handleConnection(client: Socket) {
    // Validar JWT do cliente
    const user = await this.validateToken(client.handshake.auth.token);
    client.data.userId = user.id;
  }
  
  handleDisconnect(client: Socket) {
    // Cleanup
  }
  
  @SubscribeMessage('join-campaign')
  async handleJoinCampaign(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { campaignId: string },
  ) {
    // Verificar se usuário tem permissão
    await this.campaignsService.verifyAccess(data.campaignId, client.data.userId);
    
    client.join(`campaign:${data.campaignId}`);
    this.server
      .to(`campaign:${data.campaignId}`)
      .emit('player-joined', { 
        userId: client.data.userId,
        timestamp: new Date(),
      });
  }
  
  @SubscribeMessage('update-creature-vitals')
  async handleUpdateVitals(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      campaignId: string;
      creatureId: string;
      hp?: number;
      pe?: number;
      sovereignty?: number;
    },
  ) {
    // Atualizar no banco
    const updated = await this.creaturesService.updateVitals(
      data.creatureId,
      { hp: data.hp, pe: data.pe, sovereignty: data.sovereignty },
    );
    
    // Broadcast para todos na campanha
    this.server
      .to(`campaign:${data.campaignId}`)
      .emit('creature-vitals-updated', {
        creatureId: data.creatureId,
        hp: updated.currentHp,
        pe: updated.currentPe,
        sovereignty: updated.sovereignty,
        updatedBy: client.data.userId,
        timestamp: new Date(),
      });
  }
  
  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      campaignId: string;
      message: string;
      type: 'ic' | 'ooc' | 'system';
    },
  ) {
    // Salvar mensagem (opcional)
    // await this.campaignsService.saveMessage(data);
    
    // Broadcast
    this.server
      .to(`campaign:${data.campaignId}`)
      .emit('message-received', {
        userId: client.data.userId,
        message: data.message,
        type: data.type,
        timestamp: new Date(),
      });
  }
}
```

**Entregáveis:**
- [ ] Sistema de campanhas
- [ ] Convites e permissões
- [ ] Compartilhamento de conteúdo (poderes, acervos, personagens, criaturas)
- [ ] Biblioteca pública
- [ ] WebSocket Gateway (real-time) - Opcional
- [ ] Chat de campanha - Opcional
- [ ] Sincronização de tabuleiro em tempo real - Opcional

---

### Fase 5: Features Avançadas (Futuro)

#### Real-time Features
- WebSockets para atualizações em tempo real
- Chat de campanha
- Mapas compartilhados
- Iniciativa compartilhada

#### Analytics e Auditoria
```prisma
model AuditLog {
  id          String    @id @default(cuid())
  userId      String
  action      String    // 'create', 'update', 'delete'
  entityType  String    // 'power', 'character', etc
  entityId    String
  changes     Json?     // Diff das mudanças
  createdAt   DateTime  @default(now())
  
  @@index([userId, createdAt])
  @@index([entityType, entityId])
}
```

#### Import/Export
- Exportar personagens/poderes (JSON, PDF)
- Importar de outras plataformas
- Backup automático

---

## 🚀 Estratégia de Deploy (Monorepo)

### Desenvolvimento

```yaml
# docker-compose.yml (na raiz do monorepo)
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: aetherium_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
  
  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
      target: development
    ports:
      - "3001:3001"
      - "9229:9229"  # Debug port
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://dev:dev@postgres:5432/aetherium_dev
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-secret-change-in-production
      JWT_EXPIRES_IN: 7d
      FRONTEND_URL: http://localhost:5173
    volumes:
      - .:/workspace
      - /workspace/node_modules
      - /workspace/apps/backend/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: pnpm --filter backend dev
  
  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
      target: development
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3001
      VITE_WS_URL: ws://localhost:3001
    volumes:
      - .:/workspace
      - /workspace/node_modules
      - /workspace/apps/frontend/node_modules
    command: pnpm --filter frontend dev
    depends_on:
      - backend

volumes:
  postgres_data:
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Job 1: Lint e Type Check
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm lint
      
      - name: Type check
        run: pnpm typecheck
  
  # Job 2: Testes
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: aetherium_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      
      - name: Run migrations
        run: pnpm --filter backend prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/aetherium_test
      
      - name: Test backend
        run: pnpm --filter backend test:cov
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/aetherium_test
      
      - name: Test frontend
        run: pnpm --filter frontend test
      
      - name: Test rules-engine
        run: pnpm --filter @aetherium/rules-engine test
  
  # Job 3: Build
  build:
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: |
            apps/backend/dist
            apps/frontend/dist
```

### Produção (Sugestões)

#### Opção 1: Plataformas Modernas (Recomendado)

```typescript
┌─────────────────────────────────────────────────┐
│ Frontend:   Vercel / Netlify                   │
│             - Deploy automático do monorepo    │
│             - Edge functions (API proxy)       │
│             - CDN global                       │
│                                                 │
│ Backend:    Railway / Render                   │
│             - Deploy do NestJS                 │
│             - Auto-scaling                     │
│             - Gerenciamento de ambiente        │
│                                                 │
│ Database:   Supabase / Neon / Railway         │
│             - PostgreSQL gerenciado            │
│             - Backups automáticos              │
│             - Connection pooling               │
│                                                 │
│ Cache:      Upstash Redis                     │
│             - Redis serverless                 │
│             - Global replication               │
│                                                 │
│ Storage:    Cloudinary / AWS S3               │
│             - Upload de imagens                │
│             - Transformação automática         │
│                                                 │
│ Monitoring: Sentry + LogRocket                │
│             - Error tracking                   │
│             - Performance monitoring           │
└─────────────────────────────────────────────────┘
```

#### Opção 2: Cloud Provider (AWS/GCP)

```typescript
┌─────────────────────────────────────────────────┐
│ Frontend:   S3 + CloudFront / GCS + CDN       │
│ Backend:    ECS / Cloud Run (containers)       │
│ Database:   RDS PostgreSQL / Cloud SQL        │
│ Cache:      ElastiCache / Memorystore         │
│ Storage:    S3 / GCS                          │
│ Load Balancer: ALB / Cloud Load Balancing    │
└─────────────────────────────────────────────────┘
```

### Dockerfiles para Produção

```dockerfile
# apps/backend/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile --prod

FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter backend build
RUN pnpm --filter @aetherium/rules-engine build
RUN pnpm --filter @aetherium/shared build

FROM base AS production
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/packages ./packages
COPY apps/backend/package.json ./apps/backend/
EXPOSE 3001
CMD ["node", "apps/backend/dist/main.js"]
```

```dockerfile
# apps/frontend/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter frontend build

FROM nginx:alpine AS production
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🔒 Segurança e Performance

### Segurança (NestJS)

```typescript
// apps/backend/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Helmet - Secure HTTP headers
  app.use(helmet());
  
  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });
  
  // Rate Limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 min
      max: 100, // limit each IP to 100 requests per windowMs
    }),
  );
  
  // Validation Pipe (global)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Remove propriedades não definidas nos DTOs
      forbidNonWhitelisted: true, // Lança erro se propriedades extras forem enviadas
      transform: true,           // Transforma payloads em instâncias de DTOs
    }),
  );
  
  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  await app.listen(3001);
}
```

### Performance e Cache

```typescript
// apps/backend/src/modules/static-data/static-data.controller.ts
@Controller('static')
@UseInterceptors(CacheInterceptor)  // Cache automático
export class StaticDataController {
  @Get('efeitos')
  @CacheKey('static:efeitos')
  @CacheTTL(86400)  // 24 horas
  @Header('Cache-Control', 'public, max-age=86400')
  getEfeitos() {
    return staticData.efeitos;
  }
  
  @Get('tabela-mestra')
  @CacheKey('static:master-table')
  @CacheTTL(604800)  // 7 dias
  @Header('Cache-Control', 'public, max-age=604800')
  getMasterTable() {
    return staticData.tabelaMestra;
  }
}

// Configuração de Cache (Redis)
// apps/backend/src/modules/cache/cache.module.ts
@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: 600, // 10 minutos (default)
    }),
  ],
  exports: [CacheModule],
})
export class CacheConfigModule {}
```

### Database Performance

```prisma
// prisma/schema.prisma

// Índices estratégicos
model Power {
  // ... campos ...
  
  @@index([userId, createdAt(sort: Desc)])  // Lista de poderes do usuário
  @@index([dominioId])                       // Busca por domínio
  @@index([userId, deletedAt])               // Soft delete queries
  @@fulltext([name, description])            // Full-text search
}
      - "5173:5173"
    volumes:
      - ./frontend:/app
    environment:
      VITE_API_URL: http://localhost:3001
```

### Produção (Sugestões)

```
Frontend:   Vercel / Netlify (jamstack otimizado)
Backend:    Railway / Render / DigitalOcean App Platform
Database:   Supabase / Neon / Railway Postgres
Cache:      Upstash Redis
Storage:    Cloudinary / AWS S3
```

---

## ⚠️ Riscos e Mitigações

### Risco 1: Perda de Dados Durante Migração
**Mitigação:**
- Feature flag para rollback instantâneo
- Migração opcional por usuário
- Backup automático de localStorage antes da migração
- Período de convivência (dados locais + nuvem)

### Risco 2: Performance Degradada
**Mitigação:**
- Caching agressivo (React Query com 30s stale time)
- Optimistic updates
- Lazy loading de dados não críticos
- IndexedDB como cache local

### Risco 3: Complexidade da Sincronização Offline
**Mitigação:**
- Começar sem sync offline (Fase 1-3)
- Implementar sync apenas na Fase 4+
- Usar bibliotecas testadas (WatermelonDB, RxDB)

### Risco 4: Mudanças nas Regras de Negócio
**Mitigação:**
- Versionamento de schemas (já existe)
- Migrations automáticas (Prisma)
- Testes abrangentes de cálculos
- Documentação das regras

---

## 📊 Estimativas de Tempo (Atualizado para Monorepo + NestJS)

| Fase | Duração | Esforço (horas) | Prioridade |
|------|---------|-----------------|------------|
| Fase 0: Preparação + Monorepo | 2-3 semanas | 60-90h | 🔴 Crítica |
| Fase 1: Auth | 2-3 semanas | 60-80h | 🔴 Crítica |
| Fase 1.5: Dados Estáticos + Favoritos | 1-2 semanas | 30-50h | 🟡 Alta |
| Fase 2: Poderes + Acervos | 4-5 semanas | 120-160h | 🔴 Crítica |
| Fase 3: Personagens | 3-4 semanas | 90-120h | 🔴 Crítica |
| Fase 3.5: Criaturas | 2-3 semanas | 60-90h | 🟡 Alta |
| Fase 4: Campanhas + Compartilhamento | 3-4 semanas | 90-120h | 🟡 Alta |
| Fase 4 (WebSockets) | +1-2 semanas | +30-50h | 🟢 Opcional |
| **TOTAL (sem WebSockets)** | **17-24 semanas** | **510-710h** | |
| **TOTAL (com WebSockets)** | **18-26 semanas** | **540-760h** | |

**Observações:**
- Estimativas para 1 desenvolvedor full-stack experiente
- Inclui testes unitários e e2e
- Inclui documentação (Swagger + README)
- Tempo extra para setup inicial do monorepo
- WebSockets são opcionais e podem ser adicionados depois

**Redução de Tempo:**
- Com 2 desenvolvedores: 12-16 semanas
- Focando apenas em Fases 0-3: 12-17 semanas
- MVP mínimo (Fases 0-2): 9-13 semanas

---

## ✅ Checklist de Migração (Atualizado)

### Preparação (Fase 0)
- [ ] Decisão final: Monorepo com PNPM + Turborepo
- [ ] Estrutura de monorepo criada
- [ ] Package @aetherium/shared configurado
- [ ] Package @aetherium/rules-engine configurado
- [ ] Package @aetherium/static-data configurado
- [ ] Setup do repositório backend (NestJS)
- [ ] Docker Compose configurado
- [ ] CI/CD básico (GitHub Actions)
- [ ] Camada de abstração no frontend
- [ ] Feature flags implementadas

### Fase 1 - Auth
- [ ] Registro de usuários
- [ ] Login/Logout
- [ ] JWT authentication com Passport
- [ ] Protected routes (frontend + backend)
- [ ] Guards e decorators (NestJS)
- [ ] Migração de dados locais
- [ ] Rate limiting

### Fase 1.5 - Dados Estáticos e Preferências
- [ ] API de dados estáticos com cache
- [ ] Sistema de preferências do usuário
- [ ] CRUD de favoritos (efeitos e modificações)
- [ ] CRUD de custom effects
- [ ] CRUD de custom modifications
- [ ] CRUD de peculiarities
- [ ] Migração de favoritos do localStorage
- [ ] Migração de custom items do localStorage

### Fase 2 - Poderes + Acervos
- [ ] Schema do banco (Prisma) - Powers e PowerSets
- [ ] Module NestJS - Powers
- [ ] Module NestJS - PowerSets
- [ ] CRUD de poderes (controllers + services)
- [ ] CRUD de acervos (controllers + services)
- [ ] Lógica de cálculo no rules-engine (poderes)
- [ ] Lógica de cálculo no rules-engine (acervos)
- [ ] Validação server-side (regras de acervo)
- [ ] Testes unitários (poderes e acervos)
- [ ] Frontend adaptado (repositories + API)
- [ ] Migração de biblioteca do localStorage

### Fase 3 - Personagens
- [ ] Schema do banco
- [ ] Module NestJS - Characters
- [ ] CRUD de personagens
- [ ] Cálculos no rules-engine
- [ ] Level-up e recursos vitais
- [ ] Integração com poderes e acervos
- [ ] Frontend adaptado
- [ ] Migração do localStorage

### Fase 3.5 - Criaturas
- [ ] Schema do banco (Creature + CreatureBoard)
- [ ] Module NestJS - Creatures
- [ ] CRUD de criaturas
- [ ] Sistema de cálculo no rules-engine
- [ ] API da tabela mestra (com cache)
- [ ] CRUD de tabuleiros de combate
- [ ] Frontend adaptado
- [ ] Migração de biblioteca de criaturas

### Fase 4 - Campanhas
- [ ] Schema do banco (Campaign + Players + SharedContent)
- [ ] Module NestJS - Campaigns
- [ ] Sistema de campanhas (CRUD)
- [ ] Sistema de convites e permissões
- [ ] Compartilhamento de conteúdo (poderes, acervos, personagens, criaturas)
- [ ] Biblioteca pública
- [ ] Frontend adaptado

### Fase 4 (Opcional) - Real-time
- [ ] WebSocket Gateway (Socket.io)
- [ ] Sistema de salas por campanha
- [ ] Sincronização de vitais em tempo real
- [ ] Chat de campanha
- [ ] Sincronização de tabuleiro
- [ ] Frontend com Socket.io client

### Deploy e Infra
- [ ] Dockerfiles para produção
- [ ] Environment variables configuradas
- [ ] Database migrations em produção
- [ ] Monitoramento (Sentry)
- [ ] Logs estruturados
- [ ] Health checks
- [ ] Backups automáticos

---

## 🎓 Recursos e Referências

### Documentação
- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [React Query Docs](https://tanstack.com/query/latest)
- [Zod Validation](https://zod.dev)

### Arquitetura
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [API Design Best Practices](https://swagger.io/resources/articles/best-practices-in-api-design/)

### Segurança
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## 🆕 Atualizações Recentes

### 7 de fevereiro de 2026 - v2.0 (Migração para Monorepo + NestJS)
- **Arquitetura revisada:** Monorepo com PNPM + Turborepo + NestJS
- **Estrutura de packages:**
  - `@aetherium/shared` - Tipos e constantes compartilhadas
  - `@aetherium/rules-engine` - Motor de regras isolado e testável
  - `@aetherium/static-data` - Dados estáticos (JSONs)
- **Novas funcionalidades identificadas:**
  - Sistema de Favoritos (efeitos e modificações)
  - Custom Items (efeitos, modificações e peculiaridades customizados)
  - Sistema de Criaturas (biblioteca, calculadora, tabela mestra)
  - Sistema de Dados Estáticos (API com cache)
  - Preferências do Usuário (dark mode, etc)
  - WebSockets para campanhas (opcional)
- **Fase 1.5 adicionada:** Dados estáticos e preferências
- **Fase 3.5 adicionada:** Sistema completo de criaturas
- **Stack tecnológica atualizada:** NestJS com Passport, Socket.io, Bull
- **Deploy atualizado:** Dockerfiles para monorepo, CI/CD com Turborepo
- **Segurança e Performance:** Rate limiting, cache Redis, índices otimizados
- **Estimativas atualizadas:** 17-26 semanas (510-760h)

### 7 de fevereiro de 2026 - v1.0
- **Sistema de Acervos implementado no frontend:**
  - Tipos: `Acervo`, `DetalhesAcervo`, `ValidacaoAcervo`
  - Hooks: `useAcervos` (CRUD + sincronização), `useAcervoCalculator` (cálculos e validações)
  - Componentes: `ListaAcervos`, `CriadorAcervo`, `ResumoAcervo`
  - Integração: Nova aba na BibliotecaPage
  - Regras implementadas: 
    - Custo = poder principal + 1 PdA por adicional
    - Validações: mínimo 2 poderes, sem permanentes, descritor obrigatório
    - Apenas 1 poder ativo por vez (regra de gameplay)
  - Persistência: localStorage com evento customizado para sincronização entre componentes
  - Features: Criar, editar, deletar, visualizar detalhes, click-through para ResumoPoder
- **Markdown support completo:** Implementado em descrições de poderes e fundamentos de peculiaridades
- **Plano atualizado:** Acervos adicionados ao schema do backend (Fase 2) e estimativas ajustadas

---

## 🎯 Considerações Adicionais

### Performance e Escalabilidade

1. **Caching Strategy**
   - Redis para dados frequentes (usuários ativos, sessões)
   - Cache HTTP para dados estáticos (24h - 7 dias)
   - Cache de queries (React Query no frontend)
   - Memoização de cálculos pesados

2. **Database Optimization**
   - Índices em colunas frequentemente consultadas
   - Soft delete ao invés de hard delete
   - Paginação para listagens grandes
   - Connection pooling (PgBouncer)

3. **API Optimization**
   - Lazy loading de relacionamentos
   - Compressão de responses (gzip)
   - Rate limiting por usuário
   - Query complexity limiting (GraphQL - se adotado)

### Segurança

1. **Authentication & Authorization**
   - JWT com refresh tokens
   - Bcrypt para senhas (salt rounds: 12)
   - Guards para proteção de rotas
   - Role-based access control (RBAC)

2. **Input Validation**
   - Validação no frontend (UX)
   - Validação no backend (segurança)
   - Sanitização de inputs
   - Protection contra SQL injection (ORM)
   - Protection contra XSS (sanitização)

3. **API Security**
   - HTTPS only (produção)
   - CORS configurado corretamente
   - Helmet.js para headers seguros
   - Rate limiting
   - CSRF protection (se usando cookies)

### Observabilidade

1. **Logging**
   - Winston ou Pino (structured logging)
   - Níveis: error, warn, info, debug
   - Request ID para rastreamento
   - Logs de auditoria para ações sensíveis

2. **Monitoring**
   - Sentry para error tracking
   - Health checks endpoints
   - Prometheus metrics (opcional)
   - APM (Application Performance Monitoring)

3. **Alerting**
   - Alerts para erros críticos
   - Alerts para performance degradada
   - Alerts para storage crítico

### Testing Strategy

1. **Unit Tests**
   - Regras de negócio (rules-engine)
   - Services (mocked dependencies)
   - Coverage mínimo: 80%

2. **Integration Tests**
   - Controllers + Services + Database
   - Usar banco de teste
   - Testar fluxos completos

3. **E2E Tests**
   - Fluxos críticos (registro, login, criar poder)
   - Usar Playwright ou Cypress
   - Rodar em CI/CD

### Backup e Disaster Recovery

1. **Database Backups**
   - Backups automáticos diários
   - Retention: 30 dias
   - Testar restore periodicamente

2. **Application State**
   - Export de dados do usuário
   - Import de backups
   - Versioning de schemas

### Compliance e LGPD

1. **Data Privacy**
   - Consentimento explícito para coleta de dados
   - Direito de acesso aos dados
   - Direito de deletar dados (delete cascade)
   - Anonimização de dados antigos

2. **Terms and Privacy Policy**
   - Termos de uso
   - Política de privacidade
   - Cookie policy (se aplicável)

---

## 📝 Próximos Passos

1. **Revisar e aprovar este plano atualizado**
2. **Confirmar stack tecnológica:** Monorepo (PNPM + Turborepo) + NestJS + PostgreSQL
3. **Criar estrutura do monorepo**
4. **Setup inicial dos packages compartilhados**
5. **Migrar regras de negócio para @aetherium/rules-engine**
6. **Setup do backend (NestJS)**
7. **Configurar ambiente de desenvolvimento (Docker Compose)**
8. **Iniciar Fase 0** (preparação completa)
9. **Primeira migration:** autenticação (Fase 1)
10. **Iteração gradual** seguindo as fases

### Decisões Pendentes

- [ ] Confirmar plataforma de deploy (Vercel + Railway? AWS?)
- [ ] Definir estratégia de monitoramento (Sentry? Datadog?)
- [ ] WebSockets na Fase 4 ou deixar para depois?
- [ ] GraphQL ou REST? (Recomendação: REST por simplicidade)
- [ ] Usar Zustand ou migrar para React Query + Context?
- [ ] Implementar sistema de backup manual ou esperar provider?

---

**Documento vivo** - Atualizar conforme o projeto evolui.

**Versão:** 2.0 - Monorepo + NestJS Fullstack
