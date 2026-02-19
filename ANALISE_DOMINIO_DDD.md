# Análise de Domínio - Spirit & Caos RPG System
## Documento para Implementação DDD (Domain-Driven Design)

**Data:** 15 de fevereiro de 2026  
**Versão:** 1.0  
**Fonte:** Análise do Frontend (apps/web)

---

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Bounded Contexts (Contextos Delimitados)](#bounded-contexts)
3. [Entidades de Domínio](#entidades-de-domínio)
4. [Value Objects](#value-objects)
5. [Agregados](#agregados)
6. [Use Cases (Casos de Uso)](#use-cases)
7. [Regras de Negócio](#regras-de-negócio)
8. [Eventos de Domínio](#eventos-de-domínio)
9. [Repositórios](#repositórios)

---

## Visão Geral do Sistema

**Spirit & Caos** é um sistema de RPG digital que gerencia:
- Criação e gerenciamento de poderes customizados
- Fichas de personagens com sistema de progressão (níveis 1-250)
- Gerenciamento de criaturas para mestres (NPCs/Inimigos)
- Sistema de combate baseado em tabelas mestras
- Economia de recursos (PdA, PE, Espaços)

### Principais Características do Sistema

- **Sistema de Poderes Modular**: Poderes são construídos com Efeitos base + Modificações (Extras/Falhas)
- **Progressão por Níveis**: Sistema vai de nível 1 a 250, com escalas (Raposa, Lobo, Tigre, Demônio, Dragão, Celestial)
- **Economia de Recursos**: PdA (Pontos de Artesanato), PE (Pontos de Energia), Espaços
- **Atributos Clássicos**: Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma
- **Domínios de Poder**: Natural, Sagrado, Sacrilégio, Psíquico, Científico, Peculiar, Armas

---

## Bounded Contexts

### 1. Power Creation Context (Contexto de Criação de Poderes)
**Responsabilidade**: Criação, validação e gerenciamento de poderes customizados

**Entidades Principais**:
- Poder
- Efeito
- Modificação
- Acervo
- Domínio

**Linguagem Ubíqua**:
- PdA (Pontos de Artesanato): Custo de criação/aquisição de poderes
- Grau: Intensidade do efeito (escala de -5 a 20)
- Custo por Grau: Custo base de um efeito
- Custo Fixo: Custo que não escala com grau
- Extra: Modificação que melhora o poder (+custo)
- Falha: Limitação que reduz o custo (-custo)
- Acervo: Conjunto de poderes com descritor comum (paga-se o mais caro + 1 PdA/poder)

### 2. Character Management Context (Contexto de Gerenciamento de Personagens)
**Responsabilidade**: Fichas de personagens, progressão, recursos vitais, perícias

**Entidades Principais**:
- Personagem
- Atributos
- Vitais (PV/PE)
- Perícia
- Item/Inventário
- Vínculo Personagem-Poder

**Linguagem Ubíqua**:
- PV (Pontos de Vida): Saúde do personagem
- PE (Pontos de Energia): Energia para ativar poderes
- Modificador: Bonus derivado de atributo = ARREDONDAR.PARA.CIMA((atributo - 10) / 2)
- CD (Classe de Dificuldade): 10 + modificador + nivel/2
- Rank de Calamidade: Classificação por poder (Raposa, Lobo, Tigre, etc.)
- Espaços: Slots de memória para poderes ativos
- Contador da Morte: 0-3 contadores antes de morte permanente

### 3. Creature Management Context (Contexto de Gerenciamento de Criaturas)
**Responsabilidade**: NPCs, inimigos, gerenciamento de combate

**Entidades Principais**:
- Criatura
- Template de Função (Role)
- Ataque
- Habilidade
- Tabela Mestra
- Mecânicas de Chefe

**Linguagem Ubíqua**:
- Função (Role): Lacaio, Padrão, Bruto, Elite, Chefe Solo
- Soberania: Pontos de ação extra para chefes
- Unidade de Esforço: Custo base de habilidades
- RD (Redução de Dano): Armadura/resistência
- Bônus de Eficiência: Bonus de perícias baseado em nível

### 4. Core Data Context (Contexto de Dados Base)
**Responsabilidade**: Dados fundamentais do sistema (tabelas, escalas, templates)

**Entidades Principais**:
- Tabela Universal (Progressão por Grau)
- Efeito Base (Catálogo)
- Modificação Base (Catálogo)
- Domínio
- Escala (Ação, Alcance, Duração)

---

## Entidades de Domínio

### 1. Power Creation Context

#### 1.1 Poder (Power)
**Descrição**: Agregado raiz. Representa um poder customizado criado pelo jogador.

**Propriedades**:
```typescript
- id: string (ID único)
- nome: string (3-100 caracteres, único)
- descricao?: string (max 1000 caracteres)
- dominioId: string (Natural, Sagrado, Científico, etc.)
- dominioAreaConhecimento?: string (para Científico)
- dominioIdPeculiar?: string (para Peculiar customizado)
- efeitos: EfeitoAplicado[] (1-10 efeitos)
- modificacoesGlobais: ModificacaoAplicada[] (aplicadas a todo o poder)
- acao: number (0-5: Completa → Nenhuma)
- alcance: number (0-6: Pessoal → Percepção)
- duracao: number (0-4: Instantâneo → Permanente)
- custoAlternativo?: {
    tipo: 'pe' | 'pv' | 'atributo' | 'item' | 'material'
    usaEfeitoColateral?: boolean
    descricao?: string
    valorMaterial?: number
  }
- dataCriacao: string (ISO 8601)
- dataModificacao: string (ISO 8601)
- schemaVersion: string (versão do schema para hydration)
```

**Invariantes**:
- Deve ter pelo menos 1 efeito
- Máximo 10 efeitos
- Nome deve ser único e não pode ser "Novo Poder"
- Se domínio for Científico, área de conhecimento é obrigatória
- Se domínio for Peculiar, ID da peculiaridade é obrigatória
- Poderes em Acervo não podem ter Duração Permanente

**Operações**:
- calcularCustoPdATotal(): number
- calcularEspacosTotal(): number
- calcularPETotal(): number
- validar(): ValidationResult
- hydrate(schemaVersion): HydrationResult

#### 1.2 EfeitoAplicado (AppliedEffect)
**Descrição**: Entidade. Representa um efeito dentro de um poder.

**Propriedades**:
```typescript
- id: string (ID único na instância)
- efeitoBaseId: string (Referência ao catálogo)
- grau: number (-5 a 20)
- modificacoesLocais: ModificacaoAplicada[] (aplicadas só a este efeito)
- inputCustomizado?: string (ex: "Fogo", "Telepatia")
- configuracaoSelecionada?: string (ex: patamar de Imunidade)
```

**Invariantes**:
- Grau entre -5 e 20
- Deve referenciar um efeito válido do catálogo
- Se efeito requer input, inputCustomizado é obrigatório

**Cálculos**:
- custoBase: do catálogo
- custoPorGrau: base + modificações + parâmetros
- custoTotal: custoPorGrau × grau + custoFixo

#### 1.3 ModificacaoAplicada (AppliedModification)
**Descrição**: Value Object. Representa uma modificação (Extra ou Falha) aplicada.

**Propriedades**:
```typescript
- id: string
- modificacaoBaseId: string (Referência ao catálogo)
- escopo: 'global' | 'local'
- parametros?: Record<string, unknown>
- grauModificacao?: number (padrão 1)
- nota?: string (texto livre para lembrar propósito)
```

**Tipos de Modificação**:
- **Extra**: Melhora o poder (+custo). Ex: Sutil, Área, Afeta Incorpóreo
- **Falha**: Limitação que reduz custo (-custo). Ex: Efeito Colateral, Cansativo

**Cálculo de Custo**:
- Custo por Grau: modificacaoPorGrau × grauModificacao
- Custo Fixo: custoFixo (não escala)

#### 1.4 Acervo (PowerArray)
**Descrição**: Agregado. Coleção de poderes com descritor comum.

**Propriedades**:
```typescript
- id: string
- nome: string
- descritor: string (tema/conceito comum)
- poderes: Poder[] (array de poderes completos)
- dataCriacao: string
- dataModificacao: string
```

**Regras de Negócio**:
- Apenas 1 poder ativo por vez
- Troca = ação livre (1x por turno)
- Custo = Poder mais caro + (quantidade de outros × 1 PdA)
- Nenhum poder pode ter Duração Permanente
- Nenhum poder pode custar mais que o principal
- Vulnerabilidade/fraqueza é compartilhada

**Cálculos**:
- poderPrincipal: Poder (o mais caro)
- custoPdAPrincipal: number
- custoPdAOutros: (quantidade - 1) × 1
- custoPdATotal: principal + outros
- espacosTotal: max(espacos de cada poder)

#### 1.5 Efeito (EffectBase) - Catálogo
**Descrição**: Entidade do catálogo. Template de efeito básico.

**Propriedades**:
```typescript
- id: string (kebab-case, ex: "dano", "cura")
- nome: string
- custoBase: number (custo por grau base)
- descricao: string
- parametrosPadrao: { acao, alcance, duracao }
- categorias: string[] (ex: ["ofensivo", "combate"])
- exemplos?: string
- requerInput?: boolean
- tipoInput?: 'texto' | 'numero' | 'select'
- configuracoes?: {
    tipo: 'select' | 'radio'
    label: string
    opcoes: ConfiguracaoEfeito[]
  }
- custom?: boolean (se foi criado pelo usuário)
```

**Exemplos de Efeitos**:
- Dano (custo base: 2)
- Cura (custo base: 2)
- Proteção (custo base: 1)
- Imortalidade (custo base: 50)
- Imunidade (com patamares de custo)

#### 1.6 Modificação (ModificationBase) - Catálogo
**Descrição**: Entidade do catálogo. Template de modificação.

**Propriedades**:
```typescript
- id: string
- nome: string
- tipo: 'extra' | 'falha'
- custoFixo: number (modificador fixo em PdA)
- custoPorGrau: number (modificador por grau)
- descricao: string
- requerParametros?: boolean
- tipoParametro?: 'texto' | 'numero' | 'select'
- opcoes?: string[]
- categoria: string
```

**Exemplos de Extras**:
- Sutil (+1/grau): Difícil de detectar
- Área (+1/grau): Afeta área
- Preciso (+1/grau): Ataque que acerta sempre causa dano mínimo

**Exemplos de Falhas**:
- Efeito Colateral (-1/grau): Causa dano ao usuário
- Cansativo (-1/grau): Usuário fica fatigado
- Gatilho (-1/grau): Requer condição específica

---

### 2. Character Management Context

#### 2.1 Personagem (Character)
**Descrição**: Agregado raiz. Ficha completa de um personagem jogador.

**Estrutura**:
```typescript
- id: string
- header: CharacterHeader (narrativa)
- attributes: Attributes (Força, Destreza, etc.)
- attributeTempBonuses: AttributeTempBonuses (buffs)
- vitals: Vitals (PV/PE)
- skills: SkillsState (perícias)
- poderes: PersonagemPoder[] (poderes vinculados)
- inventory: Inventory
- pdaTotal: number (calculado)
- pdaExtras: number (manual)
- espacosDisponiveis: number (calculado)
- deslocamento: number (padrão 9m)
- dataCriacao: string
- dataModificacao: string
- schemaVersion: string
```

**Propriedades Calculadas** (não persistidas):
```typescript
- modificadores: Attributes (mods de atributos)
- calamityRank: string (Raposa, Lobo, Tigre, etc.)
- pvMax: number = (nivel * modCON) + 6
- peMax: number = floor(899 * sqrt((modMental + modFisico) / 15000))
- cdMental: number = 10 + modChave + nivel/2
- cdPhysical: number = 10 + modChave + nivel/2
- pdaUsados: number
- pdaDisponiveis: number
- espacosUsados: number
- bonusEficiencia: number = round(3000 * (nivel/250)^2) + 1
```

#### 2.2 CharacterHeader
**Descrição**: Value Object. Informações narrativas do personagem.

**Propriedades**:
```typescript
- name: string (1-100 caracteres)
- identity: string (ex: "Cavaleiro sem Rainha")
- origin: string
- level: number (1-250)
- keyAttributeMental: 'Inteligência' | 'Sabedoria' | 'Carisma'
- keyAttributePhysical: 'Força' | 'Destreza' | 'Constituição'
- inspiration: number (0-3)
- runics: number (moeda do sistema)
- complications: string[] (desvantagens narrativas)
- motivations: string[] (objetivos)
- resistancesImmunities: string (texto livre)
```

#### 2.3 Attributes
**Descrição**: Value Object. Os 6 atributos base.

**Propriedades**:
```typescript
- Força: number (1-30)
- Destreza: number (1-30)
- Constituição: number (1-30)
- Inteligência: number (1-30)
- Sabedoria: number (1-30)
- Carisma: number (1-30)
```

**Regras**:
- Personagens começam com 60 pontos (6 × 10)
- A cada nível ganham pontos para distribuir
- Pontos disponíveis = (nivel * (nivel+1) / 2) + (67 - somaAtributos)
- Modificador = ARREDONDAR.PARA.CIMA((atributo - 10) / 2)

#### 2.4 Vitals
**Descrição**: Value Object. Recursos vitais do personagem.

**Propriedades**:
```typescript
- pv: { current, max, temp }
- pe: { current, max, temp }
- deathCounters: number (0-3)
```

**Regras**:
- PV Max = (nivel * modCON) + 6, mínimo 4
- PE Max = floor(899 * sqrt((modMental + modFisico) / 15000)), mínimo 4
- Ao chegar a 0 PV: jogada de Fortitude (CD = dano). Falha = +1 contador
- 3 contadores = morte permanente

#### 2.5 SkillEntry
**Descrição**: Value Object. Configuração de uma perícia.

**Propriedades**:
```typescript
- id: string (ex: 'acrobacia')
- isEfficient: boolean (+Bônus de Eficiência)
- isInefficient: boolean (-Metade do Bônus)
- trainingLevel: number (treino ou itens)
- miscBonus: number
```

**Cálculo do Bônus**:
```
Bônus Total = ModAtributo + Treino + Misc + Eficiência (se eficiente) - Eficiência/2 (se ineficiente)
```

**Perícias Especiais**:
- **Atletismo**: Usa atributo chave físico ao invés de Força
- **Espiritismo**: Usa atributo chave mental ao invés de Sabedoria

**Lista de Perícias** (24 perícias):
Acrobacia, Adestrar Animais, Atletismo, Atuação, Cavalgar, Conhecimento, Cura, Diplomacia, Enganação, Furtividade, Espiritismo, Religião, Exploração, Intuição, Ladinagem, Ofício, Percepção, Sobrevivência, Investigação, Intimidação, Iniciativa, Fortitude, Reflexos, Vontade

#### 2.6 PersonagemPoder
**Descrição**: Entidade. Vínculo entre personagem e poder.

**Propriedades**:
```typescript
- id: string (ID único do vínculo)
- poderId: string (ID do PoderSalvo na biblioteca)
- poder: Poder (dados completos)
- ativo: boolean (está equipado?)
- pdaCost: number (custo total)
- espacosOccupied: number
- usosRestantes?: number
- dataCriacao: string
- dataModificacao: string
```

**Regras**:
- PdA é gasto uma vez (ao adquirir)
- Espaços só são ocupados quando poder está ativo
- Trocar poder ativo = ação livre

#### 2.7 Item
**Descrição**: Entidade. Item do inventário.

**Propriedades**:
```typescript
- id: string
- name: string
- description?: string
- tipo: 'arma' | 'traje' | 'acessorio' | 'consumivel' | 'outro'
- bonusDano?: number
- bonusRD?: number
- bonusAtributo?: Partial<Attributes>
```

#### 2.8 Inventory
**Descrição**: Value Object. Inventário completo (sem peso).

**Propriedades**:
```typescript
- equipped: {
    mainHand: Item | null
    offHand: Item | null
    extraHands: Item[] (de poderes como Membros Extras)
    suit: Item | null
    accessory: Item | null
  }
- quickSlots: Array<{ item, quantity } | null>
- backpack: Item[]
```

---

### 3. Creature Management Context

#### 3.1 Creature (Criatura)
**Descrição**: Agregado raiz. Representa um NPC/inimigo.

**Propriedades**:
```typescript
- id: string
- name: string
- level: number (1-250)
- role: CreatureRole (Lacaio, Padrão, Bruto, Elite, ChefeSolo)
- attributeDistribution?: {
    major: Attribute[]
    medium: Attribute[]
    minor: Attribute[] (auto-calculado)
  }
- saveDistribution?: {
    strong: Save[]
    medium: Save[]
    weak: Save[] (auto-calculado)
  }
- selectedSkills?: Skill[] (perícias selecionadas)
- stats: CreatureStats
- attacks: CreatureAttack[]
- creatureAbilities: CreatureAbility[]
- position: { x, y } (no board)
- color?: string
- notes?: string
- status: 'ativo' | 'derrotado' | 'oculto' | 'aliado'
- imageUrl?: string
- imagePosition?: { x, y }
- bossMechanics?: BossMechanics
- createdAt: number
- updatedAt: number
```

#### 3.2 CreatureStats
**Descrição**: Value Object. Estatísticas calculadas.

**Propriedades**:
```typescript
- hp: number (atual)
- maxHp: number
- pe: number (atual)
- maxPe: number
- effortUnit: number (custo de habilidades)
- rd: number (redução de dano)
- speed: number (deslocamento, padrão 9m)
- attackBonus: number
- damage: number
- cdEffect: number (CD para efeitos)
- keySkill: number
- resistances: { minor, medium, major }
- efficiency: number
```

**Cálculo baseado em**:
- Linha da Tabela Mestra (baseado em level)
- Template de Função (multiplicadores)

#### 3.3 RoleTemplate (Template de Função)
**Descrição**: Value Object. Multiplicadores por função.

**Funções Disponíveis**:

| Função | PV Mult | PE Mult | Dano Mult | Observações |
|--------|---------|---------|-----------|-------------|
| Lacaio | 0.5 | 0.5 | 0.5 | Inimigos fracos em quantidade |
| Padrão | 1.0 | 1.0 | 1.0 | Inimigo balanceado |
| Bruto | 2.0 | 1.0 | 1.5 | Tank focado em PV/Dano |
| Elite | 2.0 | 1.5 | 1.0 | Versátil, tem Soberania |
| ChefeSolo | 10-15 | 2.0 | 1.5 | Boss, Soberania máxima |

#### 3.4 MasterRow (Linha da Tabela Mestra)
**Descrição**: Value Object. Dados base por nível.

**Propriedades**:
```typescript
- level: number (1-250)
- tier?: string (ex: "Grau 12")
- scaleName?: string (Raposa, Lobo, Tigre, etc.)
- pvString: string (ex: "4 / 7 / 8")
- pvMin, pvBase, pvMax: number
- modMajor, modMedium, modMinor: number
- effortUnit: number
- peBase: number
- efficiency: number
- cdEffect: number
- atkBonus: number
- keySkill: number
- dmgBase: number
- resString: string
- resMinor, resMedium, resMajor: number
```

#### 3.5 CreatureAttack
**Descrição**: Entidade. Ataque de criatura.

**Propriedades**:
```typescript
- id: string
- name: string
- damage: string (ex: "2d6+4")
- damageType: DamageType
- criticalRange: number (19 = crítico em 19-20, 20 = só no 20)
- criticalMultiplier: number (2x, 3x, etc.)
- range: {
    type: 'adjacente' | 'natural' | 'curto' | 'medio' | 'longo' | 'variavel'
    additionalMeters?: number
  }
- effect?: string
```

**Tipos de Dano**:
cortante, perfurante, contundente, fogo, gelo, eletrico, acido, veneno, necrotico, radiante, psiquico, trovao, energia

#### 3.6 CreatureAbility
**Descrição**: Entidade. Habilidade especial (baseada em poder).

**Propriedades**:
```typescript
- id: string
- name: string
- poder: Poder (do criador de poderes)
- effortCost: 0 | 1 | 2 | 3 (unidades de esforço)
```

**Cálculo de PE**:
```
PE Real = effortCost × creature.stats.effortUnit
```

#### 3.7 BossMechanics
**Descrição**: Value Object. Mecânicas especiais de chefes.

**Propriedades**:
```typescript
- sovereignty: number (atual)
- sovereigntyMax: number (máximo, padrão 5)
```

**Regras**:
- Cada ponto de Soberania = 1 ação extra
- Usado para ações heroicas/dramáticas
- Elite e ChefeSolo possuem Soberania

---

### 4. Core Data Context

#### 4.1 TabelaUniversal (UniversalTable)
**Descrição**: Value Object. Tabela de progressão por Grau (1-20).

**Propriedades por Grau**:
```typescript
- grau: number (1-20)
- pe: number (Pontos de Energia necessários)
- espacos: number (Espaços que o poder ocupa)
- dano: number (Dano base)
- distancia: string (Alcance máximo)
- massa: string (Peso que pode ser manipulado)
- tempo: string (Duração)
- velocidade: string (Velocidade de movimento)
- area: string (Raio de área de efeito)
```

**Exemplo Grau 5**:
```json
{
  "grau": 5,
  "pe": 75,
  "espacos": 5,
  "dano": 10,
  "distancia": "180m",
  "massa": "400kg",
  "tempo": "2 minutos",
  "velocidade": "240km/h",
  "area": "24m de raio"
}
```

#### 4.2 Domínio (Domain)
**Descrição**: Value Object. Categoria de poder.

**Propriedades**:
```typescript
- id: string
- nome: string
- descricao: string
- espiritual: boolean | null
- categoria: 'espiritual' | 'arma' | 'especial'
- requerAreaConhecimento?: boolean
- areasConhecimento?: string[]
- customizavel?: boolean
```

**Domínios Disponíveis**:
1. **Natural**: Poder da natureza e vida
2. **Sagrado**: Poder divino e luz
3. **Sacrilégio**: Poder profano e sombrio
4. **Psíquico**: Poder da mente
5. **Científico**: Ciência e tecnologia (requer área: Física, Química, Biologia, etc.)
6. **Peculiar**: Poderes únicos customizados
7. **Arma Branca**: Espadas, machados, etc.
8. **Arma de Fogo**: Pistolas, rifles, etc.
9. **Arma de Tensão**: Arcos, bestas, etc.
10. **Arma Explosiva**: Granadas, bombas, etc.
11. **Arma Tecnológica/Exótica**: Lasers, energia, alienígena

#### 4.3 Escala (Scale)
**Descrição**: Value Object. Escalas de parâmetros.

**Tipos de Escala**:

**Ação** (0-5):
- 0: Completa (turno inteiro)
- 1: Padrão
- 2: Movimento
- 3: Livre
- 4: Reação
- 5: Nenhuma (sempre ativo)

**Alcance** (0-6):
- 0: Pessoal
- 1: Corpo-a-corpo
- 2: Distância (curta)
- 3: Distância (média)
- 4: Distância (longa)
- 5: Linha de Visão
- 6: Percepção

**Duração** (0-4):
- 0: Instantâneo
- 1: Concentração
- 2: Sustentado
- 3: Contínuo
- 4: Permanente

---

## Value Objects

### ConfiguracaoEfeito (EffectConfiguration)
**Descrição**: Opções de configuração de efeitos com patamares.

**Propriedades**:
```typescript
- id: string
- nome: string
- modificadorCusto: number (+0, +2, +5, etc.)
- descricao: string
- grauMinimo?: number
- custoProgressivo?: 'dobrado'
```

**Exemplo - Imunidade**:
```typescript
Patamar 1 (Resistência): +0
Patamar 2 (Imunidade 100%): +2
Patamar 3 (Absorve como PE): +5
```

### VitalChangeLog
**Descrição**: Histórico de mudanças em PV/PE.

**Propriedades**:
```typescript
- timestamp: number
- tipo: 'dano' | 'cura' | 'temp' | 'pe-gasto' | 'pe-recuperado'
- recurso: 'pv' | 'pe'
- valor: number
- fonte?: string (ex: "Ataque de Goblin")
```

### ValidationResult
**Descrição**: Resultado de validação.

**Propriedades**:
```typescript
- isValid: boolean
- errors: string[]
- warnings?: string[]
```

---

## Agregados

### Agregado 1: Poder
**Raiz**: Poder  
**Entidades**: EfeitoAplicado  
**Value Objects**: ModificacaoAplicada, CustoAlternativo

**Regras de Consistência**:
- Poder deve ter 1-10 efeitos
- Modificações globais aplicam a todos os efeitos
- Custo total = ∑(custos dos efeitos) + custos de modificações globais
- Espaços total = ∑(espaços de cada efeito)

**Invariantes**:
- Nome único e válido
- Domínio válido
- Efeitos e modificações devem referenciar catálogo válido
- Parâmetros (ação, alcance, duração) válidos

### Agregado 2: Acervo
**Raiz**: Acervo  
**Entidades**: Poder[]

**Regras de Consistência**:
- Todos os poderes devem ter descritor compatível
- Nenhum poder pode ter Duração Permanente
- Custo = max(custos) + (n-1) × 1
- Espaços = max(espaços de cada poder)

### Agregado 3: Personagem
**Raiz**: Personagem  
**Entidades**: PersonagemPoder  
**Value Objects**: CharacterHeader, Attributes, Vitals, SkillsState, Inventory

**Regras de Consistência**:
- PdA usados ≤ PdA total
- Espaços usados (ativos) ≤ Espaços disponíveis
- PV atual ≤ PV max
- PE atual ≤ PE max
- Modificadores calculados a partir de atributos

**Operações do Agregado**:
- vincularPoder(poder)
- desvincularPoder(poderId)
- togglePoderAtivo(poderId)
- sofrerDano(dano, fonte)
- curar(quantidade, fonte)
- gastarPE(quantidade)
- recuperarPE(quantidade)
- subirNivel()

### Agregado 4: Criatura
**Raiz**: Creature  
**Entidades**: CreatureAttack, CreatureAbility  
**Value Objects**: CreatureStats, BossMechanics

**Regras de Consistência**:
- Stats calculados baseados em Tabela Mestra + Template
- HP/PE atuais ≤ máximos
- Soberania ≤ soberaniaMax (se chefe)

**Operações do Agregado**:
- calcularStats()
- adicionarAtaque(attack)
- adicionarHabilidade(ability)
- sofrerDano(dano)
- gastarSoberania(quantidade)
- mudarStatus(novoStatus)

---

## Use Cases

### Power Creation Context

#### UC-P01: Criar Novo Poder
**Ator**: Jogador  
**Entrada**: Nome, domínio, efeitos, modificações, parâmetros  
**Saída**: Poder criado com ID único  
**Fluxo**:
1. Validar nome único e válido
2. Validar domínio (se Científico, pedir área)
3. Validar efeitos (1-10)
4. Calcular custos (PdA, PE, Espaços)
5. Validar integridade
6. Persistir poder

**Regras de Negócio Aplicadas**:
- RN-01: Nome não pode ser "Novo Poder"
- RN-02: Mínimo 1 efeito, máximo 10
- RN-03: CustoPorGrau = base + mods + parâmetros
- RN-04: CustoFixo = ∑ custos fixos de modificações
- RN-05: Custo por grau mínimo = 1
- RN-06: Modificador de parâmetros global

#### UC-P02: Editar Poder Existente
**Ator**: Jogador  
**Entrada**: ID do poder, novos dados  
**Saída**: Poder atualizado  
**Fluxo**:
1. Buscar poder por ID
2. Aplicar modificações
3. Recalcular custos
4. Validar integridade
5. Atualizar dataModificacao
6. Persistir

#### UC-P03: Salvar Poder na Biblioteca
**Ator**: Jogador  
**Entrada**: Poder completo  
**Saída**: PoderSalvo na biblioteca  
**Fluxo**:
1. Validar poder (schema completo)
2. Adicionar schemaVersion
3. Verificar se já existe na biblioteca
4. Se existe: atualizar; senão: criar novo
5. Adicionar timestamps
6. Persistir no localStorage

#### UC-P04: Carregar Poder da Biblioteca
**Ator**: Jogador  
**Entrada**: ID do poder  
**Saída**: Poder carregado para edição  
**Fluxo**:
1. Buscar poder na biblioteca
2. Aplicar hydration (validação + migração)
3. Se houve mudanças, atualizar biblioteca
4. Carregar no editor

**Hydration** inclui:
- Validação de schema
- Atualização de versões antigas
- Remoção de dados inválidos/obsoletos
- Adição de campos novos com padrões

#### UC-P05: Deletar Poder da Biblioteca
**Ator**: Jogador  
**Entrada**: ID do poder  
**Saída**: Poder removido  
**Fluxo**:
1. Verificar se poder está em uso por algum personagem (warning)
2. Remover da biblioteca
3. Persistir alteração

#### UC-P06: Criar Acervo de Poderes
**Ator**: Jogador  
**Entrada**: Nome, descritor, lista de poderes  
**Saída**: Acervo criado  
**Fluxo**:
1. Validar que poderes têm descritor compatível
2. Validar que nenhum tem Duração Permanente
3. Identificar poder principal (mais caro)
4. Calcular custo total: principal + (n-1)
5. Calcular espaços: max(espaços)
6. Persistir acervo

#### UC-P07: Validar Acervo
**Ator**: Sistema  
**Entrada**: Acervo  
**Saída**: ValidacaoAcervo  
**Fluxo**:
1. Verificar se algum poder tem Duração Permanente
2. Verificar se algum poder custa mais que o principal
3. Gerar lista de erros/avisos

#### UC-P08: Adicionar Efeito Customizado ao Catálogo
**Ator**: Jogador  
**Entrada**: Dados do efeito  
**Saída**: Efeito adicionado ao catálogo local  
**Fluxo**:
1. Validar dados (nome, custo base, etc.)
2. Marcar como custom: true
3. Adicionar ao catálogo local
4. Persistir

#### UC-P09: Adicionar Modificação Customizada ao Catálogo
**Ator**: Jogador  
**Entrada**: Dados da modificação  
**Saída**: Modificação adicionada  
**Fluxo**:
1. Validar dados
2. Marcar como custom: true
3. Adicionar ao catálogo local
4. Persistir

#### UC-P10: Adicionar Peculiaridade Customizada
**Ator**: Jogador  
**Entrada**: Nome, descrição, se é espiritual  
**Saída**: Peculiaridade criada  
**Fluxo**:
1. Validar dados
2. Criar entrada no catálogo de peculiaridades
3. Retornar ID para uso em Domínio Peculiar

---

### Character Management Context

#### UC-C01: Criar Novo Personagem
**Ator**: Jogador  
**Entrada**: Dados do cabeçalho  
**Saída**: Personagem criado  
**Fluxo**:
1. Criar personagem com valores padrão
2. Atributos = 10 em todos
3. Nível = 1
4. Calcular valores derivados (PV, PE, PdA, Espaços)
5. Inicializar perícias
6. Gerar ID único
7. Persistir

**Valores Iniciais**:
- PV = 6
- PE = calculado
- PdA = 15
- Espaços = calculado
- Deslocamento = 9m

#### UC-C02: Distribuir Pontos de Atributo
**Ator**: Jogador  
**Entrada**: Novos valores de atributos  
**Saída**: Atributos atualizados  
**Fluxo**:
1. Calcular pontos disponíveis
2. Verificar se soma está dentro do limite
3. Atualizar atributos
4. Recalcular modificadores
5. Recalcular PV, PE, CD, Espaços
6. Persistir

**Fórmula de Pontos**:
```
PontosDisponiveis = (nivel × (nivel+1) / 2) + (67 - somaAtributos)
```

#### UC-C03: Subir de Nível
**Ator**: Jogador  
**Entrada**: Novo nível  
**Saída**: Personagem atualizado  
**Fluxo**:
1. Incrementar nível
2. Recalcular PV max
3. Recalcular PE max
4. Recalcular PdA total
5. Recalcular Espaços disponíveis
6. Recalcular CD
7. Recalcular Rank de Calamidade
8. Recalcular Bônus de Eficiência
9. Atualizar perícias eficientes
10. Curar totalmente (opcional)
11. Persistir

#### UC-C04: Vincular Poder ao Personagem
**Ator**: Jogador  
**Entrada**: Poder da biblioteca  
**Saída**: PersonagemPoder criado  
**Fluxo**:
1. Calcular custos (PdA, Espaços)
2. Verificar se tem PdA suficiente
3. Criar vínculo PersonagemPoder
4. Marcar como ativo por padrão
5. Decrementar PdA disponíveis
6. Verificar se espaços estão dentro do limite (warning se não)
7. Adicionar ao personagem
8. Persistir

**Regras**:
- PdA é gasto permanentemente (não recupera ao desvincular)
- Espaços só ocupados quando ativo

#### UC-C05: Desvincular Poder do Personagem
**Ator**: Jogador  
**Entrada**: ID do PersonagemPoder  
**Saída**: Vínculo removido  
**Fluxo**:
1. Remover vínculo
2. Liberar espaços (se estava ativo)
3. PdA NÃO é recuperado
4. Persistir

#### UC-C06: Ativar/Desativar Poder
**Ator**: Jogador  
**Entrada**: ID do PersonagemPoder  
**Saída**: Estado alterado  
**Fluxo**:
1. Toggle estado ativo
2. Se ativando: ocupar espaços
3. Se desativando: liberar espaços
4. Verificar limite de espaços
5. Persistir

**Ação no Jogo**: Ação livre (1x por turno)

#### UC-C07: Sofrer Dano
**Ator**: Sistema/Mestre  
**Entrada**: Quantidade de dano, fonte  
**Saída**: PV atualizado, possível Contador da Morte  
**Fluxo**:
1. Aplicar RD (bloqueio)
2. Subtrair dano de PV atual
3. Se PV ≤ 0:
   - Fazer jogada de Fortitude (CD = dano recebido)
   - Se falhar: +1 Contador da Morte
   - Se 3 contadores: morte permanente
4. Registrar em VitalChangeLog
5. Persistir

#### UC-C08: Curar PV
**Ator**: Jogador/Sistema  
**Entrada**: Quantidade, fonte  
**Saída**: PV atualizado  
**Fluxo**:
1. Adicionar cura ao PV atual
2. Limitar ao PV max
3. Registrar em VitalChangeLog
4. Persistir

#### UC-C09: Gastar PE
**Ator**: Jogador  
**Entrada**: Quantidade, motivo  
**Saída**: PE atualizado  
**Fluxo**:
1. Verificar se tem PE suficiente
2. Subtrair PE
3. Registrar em VitalChangeLog
4. Persistir

#### UC-C10: Recuperar PE
**Ator**: Sistema  
**Entrada**: Quantidade (descanso/item)  
**Saída**: PE atualizado  
**Fluxo**:
1. Adicionar PE
2. Limitar ao PE max
3. Registrar em VitalChangeLog
4. Persistir

#### UC-C11: Configurar Perícia
**Ator**: Jogador  
**Entrada**: ID da perícia, configurações  
**Saída**: Perícia atualizada  
**Fluxo**:
1. Atualizar isEfficient, isInefficient, trainingLevel, miscBonus
2. Recalcular bônus total
3. Persistir

**Regras**:
- Eficiente e Ineficiente são mutuamente exclusivos
- Bônus = ModAtributo + Treino + Misc ± Eficiência

#### UC-C12: Equipar Item
**Ator**: Jogador  
**Entrada**: Item, slot  
**Saída**: Item equipado  
**Fluxo**:
1. Verificar se slot está disponível
2. Se ocupado, desequipar item anterior
3. Equipar novo item
4. Aplicar bônus do item (atributos, RD, dano)
5. Recalcular stats afetados
6. Persistir

#### UC-C13: Salvar Personagem na Biblioteca
**Ator**: Jogador  
**Entrada**: Personagem completo  
**Saída**: PersonagemSalvo  
**Fluxo**:
1. Validar personagem (schema)
2. Adicionar schemaVersion
3. Se existe: atualizar; senão: criar
4. Atualizar timestamps
5. Persistir

#### UC-C14: Carregar Personagem da Biblioteca
**Ator**: Jogador  
**Entrada**: ID do personagem  
**Saída**: Personagem carregado  
**Fluxo**:
1. Buscar na biblioteca
2. Aplicar hydration/migração se necessário
3. Carregar no editor

#### UC-C15: Duplicar Personagem
**Ator**: Jogador  
**Entrada**: ID do personagem  
**Saída**: Cópia criada  
**Fluxo**:
1. Buscar original
2. Deep clone
3. Gerar novo ID
4. Adicionar "(Cópia)" ao nome
5. Resetar timestamps
6. Salvar como novo

---

### Creature Management Context

#### UC-CR01: Criar Nova Criatura
**Ator**: Mestre  
**Entrada**: Nome, nível, função  
**Saída**: Criatura criada  
**Fluxo**:
1. Buscar linha da Tabela Mestra (por nível)
2. Obter template de função
3. Calcular stats base (PV, PE, Dano, etc.)
4. Se ChefeSolo: configurar multiplicador de PV (10-15)
5. Se Elite/ChefeSolo: configurar Soberania
6. Inicializar recursos (HP = maxHP, PE = maxPE)
7. Gerar ID único
8. Posicionar no board
9. Persistir

**Cálculos**:
```
HP = pvBase × pvMultiplier
PE = peBase × peMultiplier
Dano = dmgBase × damageMultiplier
Ataque = atkBonus (da tabela) + bonus do template
```

#### UC-CR02: Distribuir Atributos (V2)
**Ator**: Mestre  
**Entrada**: Distribuição (major, medium, minor)  
**Saída**: Atributos calculados  
**Fluxo**:
1. Obter modificadores da Tabela Mestra (major, medium, minor)
2. Aplicar aos atributos selecionados
3. Calcular atributos finais
4. Recalcular dependências (ataque, defesa, perícias)
5. Persistir

**Regras**:
- Total de 6 atributos: 2 major, 2 medium, 2 minor
- Atributos não selecionados recebem valor padrão

#### UC-CR03: Distribuir Resistências (V2)
**Ator**: Mestre  
**Entrada**: Distribuição (strong, medium, weak)  
**Saída**: Resistências calculadas  
**Fluxo**:
1. Obter valores da Tabela Mestra (major, medium, minor)
2. Aplicar às resistências selecionadas (Fortitude, Reflexos, Vontade)
3. Calcular valores finais
4. Persistir

**Regras**:
- 1 strong, 1 medium, 1 weak

#### UC-CR04: Selecionar Perícias
**Ator**: Mestre  
**Entrada**: Lista de perícias  
**Saída**: Perícias calculadas  
**Fluxo**:
1. Para cada perícia selecionada
2. Obter valor keySkill da Tabela Mestra
3. Aplicar modificadores de atributo relevante
4. Calcular bonus total
5. Persistir

#### UC-CR05: Adicionar Ataque
**Ator**: Mestre  
**Entrada**: Dados do ataque  
**Saída**: Ataque adicionado  
**Fluxo**:
1. Validar dados (nome, dano, tipo, etc.)
2. Criar CreatureAttack
3. Adicionar à lista de ataques
4. Persistir

**Dados Obrigatórios**:
- Nome
- Dano (formato: "2d6", "3d8+4")
- Tipo de dano
- Crítico (range e multiplicador)
- Alcance

#### UC-CR06: Adicionar Habilidade Especial
**Ator**: Mestre  
**Entrada**: Poder (do criador), custo de esforço  
**Saída**: Habilidade adicionada  
**Fluxo**:
1. Selecionar poder da biblioteca
2. Definir custo de esforço (0-3)
3. Criar CreatureAbility
4. Adicionar à lista
5. Persistir

**Cálculo de PE**:
```
PE da Habilidade = effortCost × creature.stats.effortUnit
```

#### UC-CR07: Usar Habilidade
**Ator**: Mestre/Sistema  
**Entrada**: ID da habilidade  
**Saída**: PE gasto  
**Fluxo**:
1. Calcular custo de PE
2. Verificar se criatura tem PE suficiente
3. Gastar PE
4. Aplicar efeitos da habilidade
5. Registrar uso
6. Persistir

#### UC-CR08: Criatura Sofrer Dano
**Ator**: Sistema  
**Entrada**: Quantidade de dano  
**Saída**: HP atualizado, possível mudança de status  
**Fluxo**:
1. Aplicar RD
2. Subtrair dano de HP atual
3. Se HP ≤ 0: status = 'derrotado'
4. Persistir

#### UC-CR09: Gastar Soberania
**Ator**: Mestre  
**Entrada**: Quantidade  
**Saída**: Soberania atualizada  
**Fluxo**:
1. Verificar se é Elite/ChefeSolo
2. Verificar se tem soberania suficiente
3. Subtrair pontos
4. Conceder ação extra
5. Persistir

**Regras**:
- 1 ponto = 1 ação extra
- Uso estratégico para momentos dramáticos

#### UC-CR10: Salvar Criatura na Biblioteca
**Ator**: Mestre  
**Entrada**: Criatura completa  
**Saída**: Criatura salva  
**Fluxo**:
1. Validar dados
2. Adicionar timestamps
3. Se existe: atualizar; senão: criar
4. Persistir

#### UC-CR11: Carregar Criatura (Spawn)
**Ator**: Mestre  
**Entrada**: ID da criatura template  
**Saída**: Nova instância no board  
**Fluxo**:
1. Buscar criatura template
2. Criar cópia com novo ID
3. Resetar recursos (HP, PE, Soberania)
4. Posicionar no board
5. Status = 'ativo'
6. Persistir

#### UC-CR12: Duplicar Criatura
**Ator**: Mestre  
**Entrada**: ID da criatura  
**Saída**: Cópia criada  
**Fluxo**:
1. Buscar original
2. Deep clone
3. Gerar novo ID
4. Adicionar "(Cópia)" ao nome
5. Resetar timestamps e recursos
6. Salvar

#### UC-CR13: Mover Criatura no Board
**Ator**: Mestre  
**Entrada**: ID da criatura, nova posição  
**Saída**: Posição atualizada  
**Fluxo**:
1. Validar nova posição
2. Atualizar position { x, y }
3. Persistir

#### UC-CR14: Mudar Status da Criatura
**Ator**: Mestre  
**Entrada**: Novo status  
**Saída**: Status atualizado  
**Fluxo**:
1. Atualizar status (ativo, derrotado, oculto, aliado)
2. Se derrotado: considerar remover do board
3. Persistir

---

### Core Data Context

#### UC-D01: Buscar Efeito por ID
**Ator**: Sistema  
**Entrada**: ID do efeito  
**Saída**: Efeito base  
**Fluxo**:
1. Buscar no catálogo de efeitos
2. Se não encontrar, retornar null

#### UC-D02: Buscar Modificação por ID
**Ator**: Sistema  
**Entrada**: ID da modificação  
**Saída**: Modificação base  
**Fluxo**:
1. Buscar no catálogo de modificações
2. Se não encontrar, retornar null

#### UC-D03: Buscar Domínio por ID
**Ator**: Sistema  
**Entrada**: ID do domínio  
**Saída**: Domínio  
**Fluxo**:
1. Buscar no catálogo de domínios
2. Se não encontrar, retornar null

#### UC-D04: Buscar Valor na Tabela Universal
**Ator**: Sistema  
**Entrada**: Grau (1-20), campo  
**Saída**: Valor correspondente  
**Fluxo**:
1. Buscar linha com grau especificado
2. Retornar campo solicitado (pe, espacos, dano, etc.)

**Exemplo**:
```typescript
getTabelaValue(5, 'pe') // Retorna 75
getTabelaValue(5, 'dano') // Retorna 10
```

#### UC-D05: Buscar Linha da Tabela Mestra
**Ator**: Sistema  
**Entrada**: Nível (1-250)  
**Saída**: MasterRow completo  
**Fluxo**:
1. Buscar linha correspondente ao nível
2. Se não encontrar, retornar null

#### UC-D06: Obter Template de Função
**Ator**: Sistema  
**Entrada**: CreatureRole  
**Saída**: RoleTemplate  
**Fluxo**:
1. Buscar template por role
2. Retornar multiplicadores e flags

---

## Regras de Negócio

### Regras de Cálculo de Poderes

#### RN-01: Validação de Nome
- Nome não pode ser vazio
- Mínimo 3 caracteres, máximo 100
- Não pode ser "Novo Poder"
- Recomendado ser único (aviso se duplicado)

#### RN-02: Validação de Efeitos
- Mínimo 1 efeito por poder
- Máximo 10 efeitos por poder
- Efeitos devem referenciar catálogo válido

#### RN-03: Cálculo de Custo por Grau
```
CustoPorGrau_Final = CustoBase_Efeito
                   + ModificadorCusto_Configuração
                   + Σ(Modificações_Globais_PorGrau)
                   + Σ(Modificações_Locais_PorGrau)
                   + Modificador_Parâmetros_Global
```

#### RN-04: Cálculo de Custo Fixo
```
CustoFixo_Final = Σ(Modificações_Globais_Fixas)
                + Σ(Modificações_Locais_Fixas)
```

#### RN-05: Custo Mínimo
- Custo por grau NUNCA pode ser menor que 1
- `Math.max(1, custoCalculado)`

#### RN-06: Modificador de Parâmetros Global
- Calculado UMA VEZ para o poder inteiro
- Baseado em: (parametrosPoder - parametrosPadrãoPoder)
- Aplicado a TODOS os efeitos

**Fórmula**:
```typescript
modificadorParametros = 
  calcularModificadorParametro(poderAcao - efeitoPadraoAcao, 'acao') +
  calcularModificadorParametro(poderAlcance - efeitoPadraoAlcance, 'alcance') +
  calcularModificadorParametro(poderDuracao - efeitoPadraoDuracao, 'duracao')
```

#### RN-07: Cálculo de PE por Efeito
```
PE_Efeito = TabelaUniversal[grau].pe
```

#### RN-08: Cálculo de Espaços por Efeito
```
Espacos_Efeito = TabelaUniversal[grau].espacos
```

#### RN-09: Custo Total do Poder
```
CustoPdA_Total = Σ(para cada efeito: CustoPorGrau × Grau + CustoFixo)
PE_Total = Σ(TabelaUniversal[grau].pe)
Espacos_Total = Σ(TabelaUniversal[grau].espacos)
```

#### RN-10: Validação de Domínio Científico
- Se dominioId = 'cientifico', dominioAreaConhecimento é obrigatório
- Áreas válidas: Física, Química, Biologia, Engenharia, Medicina, Eletrônica, Computação, Astronomia, Outro

#### RN-11: Validação de Domínio Peculiar
- Se dominioId = 'peculiar', dominioIdPeculiar é obrigatório
- Peculiaridade deve estar no catálogo ou ser criada

#### RN-12: Restrições de Acervo
- Nenhum poder pode ter Duração Permanente (4)
- Nenhum poder pode custar mais que o poder principal
- Todos os poderes devem ter descritor compatível
- Apenas 1 poder ativo por vez

#### RN-13: Custo de Acervo
```
CustoPdA_Acervo = max(custos dos poderes) + (quantidade - 1) × 1
Espacos_Acervo = max(espacos de cada poder)
```

### Regras de Personagem

#### RN-14: Cálculo de Modificador de Atributo
```
Modificador = ARREDONDAR.PARA.CIMA((atributo - 10) / 2)
```

#### RN-15: Cálculo de PV Máximo
```
PV_Max = (nivel × ModCON) + 6
Mínimo: 4
```

#### RN-16: Cálculo de PE Máximo
```
PE_Max = ARREDONDAR.PARA.BAIXO(899 × RAIZ((modMental + modFisico) / 15000))
Mínimo: 4

modMental = modificador do atributo chave mental escolhido
modFisico = modificador do atributo chave físico escolhido
```

#### RN-17: Cálculo de PdA Total
```
PdA_Total = 15 + ((nivel-1) × 7) + floor(nivel/5) × 7 + pdaExtras
```

**Exemplos**:
- Nível 1: 15 PdA
- Nível 5: 15 + 28 + 7 = 50 PdA
- Nível 10: 15 + 63 + 14 = 92 PdA

#### RN-18: Cálculo de Espaços Disponíveis
```
Espacos = ARREDONDAR.PARA.BAIXO(899 × RAIZ(modInteligencia / 15000))
Mínimo: 4
```

#### RN-19: Pontos de Atributo Disponíveis
```
Pontos = (nivel × (nivel+1) / 2) + (67 - somaAtributos)
```

**Explicação**:
- Base inicial: 60 pontos (6 atributos × 10)
- Offset de 67 permite começar acima de 10
- Ganho por nível = progressão triangular

#### RN-20: Cálculo de CD (Classe de Dificuldade)
```
CD = 10 + modificador_atributo_chave + floor(nivel / 2)
```

**Tipos**:
- CD Mental: usa keyAttributeMental
- CD Physical: usa keyAttributePhysical

#### RN-21: Rank de Calamidade
```
1-5: Raposa
6-10: Lobo
11-20: Tigre
21-30: Demônio
31-70: Dragão
71+: Celestial
```

#### RN-22: Bônus de Eficiência
```
Bonus = ARREDONDAR(3000 × (nivel / 250)²) + 1
```

#### RN-23: Cálculo de Bônus de Perícia
```
Bonus = ModAtributo + Treino + Misc + Eficiencia (se eficiente) - Eficiencia/2 (se ineficiente)
```

**Perícias Especiais**:
- **Atletismo**: usa keyAttributePhysical ao invés de Força
- **Espiritismo**: usa keyAttributeMental ao invés de Sabedoria

#### RN-24: Sistema de Morte
- Ao chegar a 0 PV: jogada de Fortitude (CD = dano recebido)
- Sucesso: estabilizado
- Falha: +1 Contador da Morte
- 3 Contadores: morte permanente

#### RN-25: Economia de Poderes do Personagem
- PdA é gasto permanentemente ao vincular poder
- Desvincular poder NÃO devolve PdA
- Espaços só são ocupados quando poder está ativo
- Trocar poder ativo/inativo = ação livre (1x turno)

#### RN-26: RD (Redução de Dano) de Bloqueio
```
RD_Bloqueio = RD_Traje + RD_Escudo + ModFortitude
```

### Regras de Criatura

#### RN-27: Cálculo de Stats de Criatura
```
HP = pvBase × pvMultiplier
PE = peBase × peMultiplier
Dano = dmgBase × damageMultiplier
Ataque = atkBonus + bonusTemplate
```

**Valores vêm de**:
- Base: Tabela Mestra (por nível)
- Multipliers: Template de Função

#### RN-28: Templates de Função
```
Lacaio:    PV 0.5x, PE 0.5x, Dano 0.5x
Padrão:    PV 1.0x, PE 1.0x, Dano 1.0x
Bruto:     PV 2.0x, PE 1.0x, Dano 1.5x
Elite:     PV 2.0x, PE 1.5x, Dano 1.0x, Soberania
ChefeSolo: PV 10-15x, PE 2.0x, Dano 1.5x, Soberania
```

#### RN-29: Soberania
- Elite: até 5 pontos
- ChefeSolo: até 5 pontos (configurável)
- 1 ponto = 1 ação extra
- Usado para momentos dramáticos/habilidades poderosas

#### RN-30: Distribuição de Atributos V2
- Total: 6 atributos
- Distribuição: 2 major, 2 medium, 2 minor
- Valores vêm da Tabela Mestra (modMajor, modMedium, modMinor)

#### RN-31: Distribuição de Resistências V2
- Total: 3 resistências (Fortitude, Reflexos, Vontade)
- Distribuição: 1 strong, 1 medium, 1 weak
- Valores vêm da Tabela Mestra (resMajor, resMedium, resMinor)

#### RN-32: Custo de Habilidade de Criatura
```
PE_Habilidade = effortCost × effortUnit

effortCost: 0-3 (unidades)
effortUnit: da Tabela Mestra
```

#### RN-33: Crítico de Ataque
- criticalRange: número que inicia crítico (19 = 19-20, 20 = só 20)
- criticalMultiplier: multiplicador de dano (2x, 3x, etc.)

### Regras de Tabelas e Dados

#### RN-34: Tabela Universal (Graus 1-20)
- Progressão de PE, Espaços, Dano, Distância, Massa, Tempo, Velocidade, Área
- Valores fixos por grau
- Usado para cálculo de custos e capacidades de poderes

#### RN-35: Tabela Mestra (Níveis 1-250)
- Progressão de todas as estatísticas base
- PV (min/base/max)
- Modificadores (maior/médio/menor)
- Resistências
- Bônus de ataque, CD, perícia chave
- Unidade de esforço, PE base, eficiência

#### RN-36: Escalas de Parâmetros
**Ação**: Completa (0) → Padrão (1) → Movimento (2) → Livre (3) → Reação (4) → Nenhuma (5)  
**Alcance**: Pessoal (0) → Corpo-a-corpo (1) → Distância C/M/L (2/3/4) → Linha de Visão (5) → Percepção (6)  
**Duração**: Instantâneo (0) → Concentração (1) → Sustentado (2) → Contínuo (3) → Permanente (4)

**Impacto no Custo**:
- Valores maiores = mais conveniente = +custo
- Valores menores = menos conveniente = -custo

---

## Eventos de Domínio

### Power Creation Context

#### PowerCreated
```typescript
{
  agregado: 'Poder',
  eventType: 'PowerCreated',
  data: {
    powerId: string,
    powerName: string,
    dominioId: string,
    custoTotal: number,
    userId: string,
    timestamp: Date
  }
}
```

#### PowerUpdated
```typescript
{
  agregado: 'Poder',
  eventType: 'PowerUpdated',
  data: {
    powerId: string,
    changes: Record<string, any>,
    userId: string,
    timestamp: Date
  }
}
```

#### PowerDeleted
```typescript
{
  agregado: 'Poder',
  eventType: 'PowerDeleted',
  data: {
    powerId: string,
    userId: string,
    timestamp: Date
  }
}
```

#### PowerSavedToLibrary
```typescript
{
  agregado: 'Poder',
  eventType: 'PowerSavedToLibrary',
  data: {
    powerId: string,
    powerName: string,
    userId: string,
    timestamp: Date
  }
}
```

#### AcervoCreated
```typescript
{
  agregado: 'Acervo',
  eventType: 'AcervoCreated',
  data: {
    acervoId: string,
    acervoName: string,
    powerIds: string[],
    custoTotal: number,
    userId: string,
    timestamp: Date
  }
}
```

### Character Management Context

#### CharacterCreated
```typescript
{
  agregado: 'Personagem',
  eventType: 'CharacterCreated',
  data: {
    characterId: string,
    characterName: string,
    level: number,
    userId: string,
    timestamp: Date
  }
}
```

#### CharacterLeveledUp
```typescript
{
  agregado: 'Personagem',
  eventType: 'CharacterLeveledUp',
  data: {
    characterId: string,
    oldLevel: number,
    newLevel: number,
    userId: string,
    timestamp: Date
  }
}
```

#### PowerLinkedToCharacter
```typescript
{
  agregado: 'Personagem',
  eventType: 'PowerLinkedToCharacter',
  data: {
    characterId: string,
    powerId: string,
    pdaCost: number,
    espacosOccupied: number,
    userId: string,
    timestamp: Date
  }
}
```

#### PowerUnlinkedFromCharacter
```typescript
{
  agregado: 'Personagem',
  eventType: 'PowerUnlinkedFromCharacter',
  data: {
    characterId: string,
    linkedPowerId: string,
    userId: string,
    timestamp: Date
  }
}
```

#### CharacterDamageTaken
```typescript
{
  agregado: 'Personagem',
  eventType: 'CharacterDamageTaken',
  data: {
    characterId: string,
    damage: number,
    fonte: string,
    newHp: number,
    deathCounter?: boolean,
    userId: string,
    timestamp: Date
  }
}
```

#### CharacterHealed
```typescript
{
  agregado: 'Personagem',
  eventType: 'CharacterHealed',
  data: {
    characterId: string,
    healing: number,
    fonte: string,
    newHp: number,
    userId: string,
    timestamp: Date
  }
}
```

#### CharacterPeSpent
```typescript
{
  agregado: 'Personagem',
  eventType: 'CharacterPeSpent',
  data: {
    characterId: string,
    amount: number,
    reason: string,
    newPe: number,
    userId: string,
    timestamp: Date
  }
}
```

#### CharacterDied
```typescript
{
  agregado: 'Personagem',
  eventType: 'CharacterDied',
  data: {
    characterId: string,
    deathCounters: number,
    userId: string,
    timestamp: Date
  }
}
```

### Creature Management Context

#### CreatureCreated
```typescript
{
  agregado: 'Creature',
  eventType: 'CreatureCreated',
  data: {
    creatureId: string,
    creatureName: string,
    level: number,
    role: CreatureRole,
    userId: string,
    timestamp: Date
  }
}
```

#### CreatureDamageTaken
```typescript
{
  agregado: 'Creature',
  eventType: 'CreatureDamageTaken',
  data: {
    creatureId: string,
    damage: number,
    newHp: number,
    defeated: boolean,
    userId: string,
    timestamp: Date
  }
}
```

#### CreatureDefeated
```typescript
{
  agregado: 'Creature',
  eventType: 'CreatureDefeated',
  data: {
    creatureId: string,
    userId: string,
    timestamp: Date
  }
}
```

#### CreatureAbilityUsed
```typescript
{
  agregado: 'Creature',
  eventType: 'CreatureAbilityUsed',
  data: {
    creatureId: string,
    abilityId: string,
    abilityName: string,
    peCost: number,
    newPe: number,
    userId: string,
    timestamp: Date
  }
}
```

#### CreatureSovereigntySpent
```typescript
{
  agregado: 'Creature',
  eventType: 'CreatureSovereigntySpent',
  data: {
    creatureId: string,
    amount: number,
    newSovereignty: number,
    userId: string,
    timestamp: Date
  }
}
```

---

## Repositórios

### PowerRepository
**Responsabilidades**:
- Persistir e recuperar Poderes
- Buscar poderes da biblioteca
- Validar integridade referencial

**Métodos**:
```typescript
interface PowerRepository {
  // CRUD básico
  save(power: Poder): Promise<Poder>;
  findById(id: string): Promise<Poder | null>;
  findAll(userId: string): Promise<Poder[]>;
  update(id: string, power: Partial<Poder>): Promise<Poder>;
  delete(id: string): Promise<void>;
  
  // Queries específicas
  findByDomain(userId: string, dominioId: string): Promise<Poder[]>;
  findByName(userId: string, name: string): Promise<Poder | null>;
  
  // Biblioteca
  saveToLibrary(userId: string, power: Poder): Promise<PoderSalvo>;
  findInLibrary(userId: string, powerId: string): Promise<PoderSalvo | null>;
  getAllFromLibrary(userId: string): Promise<PoderSalvo[]>;
  deleteFromLibrary(userId: string, powerId: string): Promise<void>;
}
```

### AcervoRepository
**Responsabilidades**:
- Persistir e recuperar Acervos
- Validar regras de acervo

**Métodos**:
```typescript
interface AcervoRepository {
  save(acervo: Acervo): Promise<Acervo>;
  findById(id: string): Promise<Acervo | null>;
  findAll(userId: string): Promise<Acervo[]>;
  update(id: string, acervo: Partial<Acervo>): Promise<Acervo>;
  delete(id: string): Promise<void>;
}
```

### CharacterRepository
**Responsabilidades**:
- Persistir e recuperar Personagens
- Gerenciar vínculos com poderes

**Métodos**:
```typescript
interface CharacterRepository {
  save(character: Personagem): Promise<Personagem>;
  findById(id: string): Promise<Personagem | null>;
  findAll(userId: string): Promise<Personagem[]>;
  update(id: string, character: Partial<Personagem>): Promise<Personagem>;
  delete(id: string): Promise<void>;
  
  // Biblioteca
  saveToLibrary(userId: string, character: Personagem): Promise<PersonagemSalvo>;
  findInLibrary(userId: string, characterId: string): Promise<PersonagemSalvo | null>;
  getAllFromLibrary(userId: string): Promise<PersonagemSalvo[]>;
  deleteFromLibrary(userId: string, characterId: string): Promise<void>;
  
  // Poderes vinculados
  linkPower(characterId: string, linkedPower: PersonagemPoder): Promise<void>;
  unlinkPower(characterId: string, linkedPowerId: string): Promise<void>;
}
```

### CreatureRepository
**Responsabilidades**:
- Persistir e recuperar Criaturas
- Gerenciar ataques e habilidades

**Métodos**:
```typescript
interface CreatureRepository {
  save(creature: Creature): Promise<Creature>;
  findById(id: string): Promise<Creature | null>;
  findAll(userId: string): Promise<Creature[]>;
  update(id: string, creature: Partial<Creature>): Promise<Creature>;
  delete(id: string): Promise<void>;
  
  // Biblioteca
  saveToLibrary(userId: string, creature: Creature): Promise<Creature>;
  findInLibrary(userId: string, creatureId: string): Promise<Creature | null>;
  getAllFromLibrary(userId: string): Promise<Creature[]>;
  deleteFromLibrary(userId: string, creatureId: string): Promise<void>;
  
  // Board específico
  findByBoard(userId: string, boardId: string): Promise<Creature[]>;
}
```

### EffectRepository (Read-Only)
**Responsabilidades**:
- Prover acesso ao catálogo de efeitos
- Permitir customizações do usuário

**Métodos**:
```typescript
interface EffectRepository {
  findAll(): Promise<Efeito[]>;
  findById(id: string): Promise<Efeito | null>;
  findByCategory(category: string): Promise<Efeito[]>;
  
  // Customizados
  saveCustom(userId: string, effect: Efeito): Promise<Efeito>;
  findAllCustom(userId: string): Promise<Efeito[]>;
}
```

### ModificationRepository (Read-Only)
**Responsabilidades**:
- Prover acesso ao catálogo de modificações

**Métodos**:
```typescript
interface ModificationRepository {
  findAll(): Promise<Modificacao[]>;
  findById(id: string): Promise<Modificacao | null>;
  findByType(type: 'extra' | 'falha'): Promise<Modificacao[]>;
  
  // Customizadas
  saveCustom(userId: string, modification: Modificacao): Promise<Modificacao>;
  findAllCustom(userId: string): Promise<Modificacao[]>;
}
```

### DomainRepository (Read-Only)
**Responsabilidades**:
- Prover acesso aos domínios
- Gerenciar peculiaridades customizadas

**Métodos**:
```typescript
interface DomainRepository {
  findAll(): Promise<Dominio[]>;
  findById(id: string): Promise<Dominio | null>;
  
  // Peculiaridades
  saveCustomPeculiarity(userId: string, peculiarity: any): Promise<any>;
  findAllCustomPeculiarities(userId: string): Promise<any[]>;
}
```

### MasterTableRepository (Read-Only)
**Responsabilidades**:
- Prover acesso à Tabela Mestra

**Métodos**:
```typescript
interface MasterTableRepository {
  findByLevel(level: number): Promise<MasterRow | null>;
  findAll(): Promise<MasterRow[]>;
  findByScaleName(scaleName: string): Promise<MasterRow[]>;
}
```

### UniversalTableRepository (Read-Only)
**Responsabilidades**:
- Prover acesso à Tabela Universal

**Métodos**:
```typescript
interface UniversalTableRepository {
  findByGrade(grade: number): Promise<UniversalTableRow | null>;
  findAll(): Promise<UniversalTableRow[]>;
  getValue(grade: number, field: string): Promise<any>;
}
```

---

## Considerações para Implementação DDD

### 1. Separação de Bounded Contexts
- Cada contexto deve ter seu próprio módulo/microserviço
- Comunicação entre contextos via eventos de domínio
- Evitar dependências circulares

### 2. Camadas por Contexto
```
Power Context/
├── domain/
│   ├── entities/         (Poder, EfeitoAplicado)
│   ├── value-objects/    (ModificacaoAplicada, CustoAlternativo)
│   ├── aggregates/       (Poder, Acervo)
│   ├── repositories/     (interfaces)
│   ├── services/         (lógica de domínio pura)
│   └── events/           (PowerCreated, etc.)
├── application/
│   ├── use-cases/        (CreatePowerUseCase, etc.)
│   ├── dto/              (DTOs de entrada/saída)
│   └── mappers/          (Domain ↔ DTO)
├── infrastructure/
│   ├── repositories/     (implementações concretas)
│   ├── persistence/      (Prisma, TypeORM, etc.)
│   └── events/           (event bus, publishers)
└── presentation/
    └── controllers/      (REST, GraphQL)
```

### 3. Persistência
- Usar Prisma como ORM
- Manter schema separado por contexto (schemas/*.prisma)
- Usar migrations para versionamento

### 4. Validação
- Domain validations nas entidades
- DTOs com class-validator
- Zod schemas para validação runtime

### 5. Eventos de Domínio
- Implementar event bus (NestJS EventEmitter ou message broker)
- Handlers assíncronos para side effects
- Auditoria via eventos

### 6. Testes
- Unit tests para regras de negócio (domain services)
- Integration tests para use cases
- E2E tests para fluxos completos

### 7. Autenticação e Autorização
- Usuários são donos de seus recursos
- Filtrar queries por userId
- Validar permissões nos use cases

### 8. Migrations e Versionamento
- Schema versioning (schemaVersion)
- Hydration para migrar dados antigos
- Backward compatibility quando possível

### 9. Caching
- Cache de tabelas base (Universal, Mestra, Efeitos, Modificações)
- Cache de bibliotecas (poderes, personagens, criaturas)
- Invalidação ao salvar/atualizar

### 10. Performance
- Lazy loading de relacionamentos
- Pagination para listas grandes
- Índices em campos de busca frequente

---

## Próximos Passos

### Fase 1: Setup Inicial
- [ ] Configurar estrutura de pastas por bounded context
- [ ] Configurar Prisma com schemas separados
- [ ] Implementar infraestrutura base (repository pattern)
- [ ] Configurar event bus

### Fase 2: Core Data Context
- [ ] Implementar repositórios read-only (Tabelas, Efeitos, Modificações, Domínios)
- [ ] Seed inicial de dados base
- [ ] Cache layer

### Fase 3: Power Creation Context
- [ ] Entidades de domínio (Poder, EfeitoAplicado, ModificacaoAplicada, Acervo)
- [ ] Use cases de CRUD
- [ ] Calculadoras de custo (services)
- [ ] Validações e hydration
- [ ] Eventos de domínio

### Fase 4: Character Management Context
- [ ] Entidades de domínio (Personagem, PersonagemPoder)
- [ ] Use cases de CRUD e progressão
- [ ] Calculadoras de stats
- [ ] Sistema de combate (dano, cura, morte)
- [ ] Gestão de recursos (PV, PE, PdA, Espaços)

### Fase 5: Creature Management Context
- [ ] Entidades de domínio (Creature, Attack, Ability)
- [ ] Use cases de CRUD
- [ ] Calculadoras de stats baseadas em Tabela Mestra
- [ ] Sistema de combate para NPCs
- [ ] Board management

### Fase 6: Integração e Testes
- [ ] Integração entre contextos via eventos
- [ ] Testes unitários de regras de negócio
- [ ] Testes de integração de use cases
- [ ] Testes E2E de fluxos críticos

### Fase 7: API e Documentação
- [ ] Controllers REST para cada contexto
- [ ] Swagger/OpenAPI
- [ ] Documentação de eventos
- [ ] Guias de uso

---

## Glossário

**PdA (Pontos de Artesanato)**: Moeda para criar/comprar poderes. Ganho por nível.

**PE (Pontos de Energia)**: Energia para ativar poderes. Baseado em atributos mentais/físicos.

**Espaços**: Slots de "memória" para poderes ativos. Baseado em Inteligência.

**Grau**: Intensidade de um efeito (-5 a 20). Define dano, alcance, duração, etc.

**Efeito**: Bloco básico de um poder (Dano, Cura, Proteção, etc.).

**Modificação**: Extra (melhora, +custo) ou Falha (limitação, -custo).

**Acervo**: Conjunto de poderes alternados. Paga-se o mais caro + 1 PdA/poder extra.

**Domínio**: Categoria de poder (Natural, Sagrado, Psíquico, etc.).

**Soberania**: Pontos de ação extra para chefes/elites.

**Função (Role)**: Lacaio, Padrão, Bruto, Elite, ChefeSolo. Define multiplicadores.

**Tabela Mestra**: Progressão de stats por nível (1-250).

**Tabela Universal**: Progressão de capacidades por grau (1-20).

**Rank de Calamidade**: Classificação por poder (Raposa, Lobo, Tigre, Demônio, Dragão, Celestial).

**CD (Classe de Dificuldade)**: 10 + mod + nivel/2. Alvo de testes de resistência.

**RD (Redução de Dano)**: Armadura que reduz dano recebido.

**Contador da Morte**: Sistema de morte. 3 contadores = morte permanente.

**Hydration**: Processo de validação e migração de dados salvos.

---

**Fim do Documento**
