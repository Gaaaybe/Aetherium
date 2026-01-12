# Changelog - Spirit and Caos System

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Data: 12/01/2026] - Refinamento de Modificações (Opções e Balanceamento)

### 🔧 **Modificações com Novas Opções**

#### **Seletivo** - Sistema de Seleção Expandido
**Antes:** +1 por grau (seleção genérica)
**Depois:** Sistema de duas opções

##### **Opção 1: Restrito** (+2 por grau)
- Escolhe **um tipo de alvo fixo** ao comprar a modificação
- Exemplos: "apenas inimigos", "apenas aliados", "apenas humanoides"
- **Menor custo**, mas inflexível
- Ideal para poderes com uso consistente

##### **Opção 2: Variável** (+3 por grau)
- Escolhe **livremente** quais alvos afetar a cada uso
- Máxima flexibilidade tática
- **Maior custo**, mas adaptável
- Ideal para poderes de área complexos

**Exemplo de Uso:**
- Explosão de Fogo, Grau 8, com Área
- **Seletivo Restrito (apenas inimigos):** (2+2) × 8 = **32 PdA**
  - Sempre afeta só inimigos, automático
- **Seletivo Variável:** (2+3) × 8 = **40 PdA**
  - Escolhe livremente quem é afetado a cada uso
  - Pode poupar aliado específico ou atingir inimigo disfarçado

---

#### **Sutil** - Conversão para Sistema por Grau
**Antes:** Custo fixo (+1 ou +2)
**Depois:** Custo por grau (+1 ou +2 por grau)

##### **Opção 1: Difícil de Notar** (+1 por grau)
- Efeito difícil de perceber
- Detectável apenas por sentidos exóticos ou testes específicos
- Sutileza moderada

##### **Opção 2: Completamente Indetectável** (+2 por grau)
- Efeito impossível de detectar por meios convencionais
- Invisível a todos os sentidos normais
- Sutileza máxima

**Impacto:** Torna sutileza mais cara em poderes de alto grau, mas proporcional ao poder do efeito

**Exemplo:**
- Controle Mental Grau 9 (custoBase 6)
- **Com Sutil Difícil:** (6+1) × 9 = **63 PdA**
- **Com Sutil Indetectável:** (6+2) × 9 = **72 PdA**
- **Antes (fixo):** 54 + 1 ou 2 = 55-56 PdA (muito barato para poder tão forte)

---

#### **Limitado** - Nova Opção Extrema
**Antes:** Apenas -1 por grau
**Depois:** Sistema de duas opções

##### **Opção 1: Limitado Normal** (-1 por grau)
- Reduz utilidade em **~50%**
- Funciona em cerca de metade das situações
- Exemplos: "Apenas contra mortos-vivos", "Apenas sob luz da lua"

##### **Opção 2: Limitado Extremo** (-2 por grau) 🆕
- Reduz utilidade em **~75%** ou mais
- Funciona apenas em situações **muito específicas ou raras**
- Exemplos: "Apenas contra demônios sob lua cheia", "Apenas quando sangrando"
- **Desconto maior** para limitações severas

**Exemplo:**
- Dano 10 (custoBase 2) → 20 PdA
- **Limitado Normal (vs mortos-vivos):** (2-1) × 10 = **10 PdA** (metade do custo)
- **Limitado Extremo (vs liches durante eclipse):** (2-2) × 10 = **0 PdA** → mínimo 1 × 10 = **10 PdA**
  - Nota: Em casos extremos, pode reduzir a 0, mas sistema garante custo mínimo de 1/grau

---

### ⚖️ **Falhas Rebalanceadas (Custos Aumentados)**

#### **Cansativo**
- **Antes:** -1 por grau
- **Depois:** -2 por grau
- **Motivo:** Ficar Fatigado após uso é desvantagem significativa que limita uso repetido
- **Impacto:** Poderes "ultimate" ou "modo supremo" ficam mais baratos, incentivando uso tático

**Exemplo - Forma Titã:**
- Metamorfia 15 (custoBase 10) → 150 PdA
- **Com Cansativo:** (10-2) × 15 = **120 PdA** (economiza 30 PdA)
- **Trade-off:** Fica Fatigado após transformar, não pode usar repetidamente

#### **Incontrolável**
- **Antes:** -1 por grau
- **Depois:** -2 por grau
- **Motivo:** Perder controle total sobre o poder é limitação extrema
- **Impacto:** Poderes misteriosos ou instáveis (nova origem, maldição, etc.) têm desconto maior

**Exemplo - Poder Desperto:**
- Dano 12 (custoBase 2) → 24 PdA
- **Com Incontrolável:** (2-2) × 12 = **0 PdA** → mínimo 12 PdA
- **Trade-off:** Mestre controla quando/como se manifesta (narrativa > mecânica)

---

### 📊 **Resumo de Mudanças**

| Modificação | Mudança | Antes | Depois | Impacto |
|-------------|---------|-------|--------|---------|
| **Seletivo** | Opções | +1/grau | +2 (Restrito) / +3 (Variável) | +100-200% |
| **Sutil** | Fixo→Grau | +1 ou +2 fixo | +1 ou +2 por grau | Escala com poder |
| **Limitado** | Nova opção | -1/grau | -1 (Normal) / -2 (Extremo) | Extremo dobra |
| **Cansativo** | Aumento | -1/grau | **-2/grau** | +100% |
| **Incontrolável** | Aumento | -1/grau | **-2/grau** | +100% |

### 🎯 **Impacto no Sistema**

**Seletivo:**
- ✅ Flexibilidade tem custo apropriado
- ✅ Opção barata para uso simples (Restrito)
- ✅ Opção cara para controle total (Variável)

**Sutil:**
- ✅ Proporcional ao poder do efeito
- ✅ Evita "quase de graça" em poderes fortes
- ✅ Mantém acessível para poderes fracos

**Limitado Extremo:**
- ✅ Reconhece limitações verdadeiramente severas
- ✅ Permite builds de nicho ultra-especializadas
- ✅ Desconto justo para raridade extrema

**Cansativo/Incontrolável:**
- ✅ Desvantagens severas valem mais desconto
- ✅ Incentiva "poderes finais" temáticos
- ✅ Trade-off narrativo + mecânico mais justo

---

## [Data: 12/01/2026] - Reformulação do Sistema de Penetração

### 🔄 **Sistema de Penetração Refeito (Progressão em 3 Níveis)**

O antigo sistema "Penetrante/Persistente" (+3/grau) e "Verdadeiro" (+6/grau) foi substituído por uma **progressão clara de três níveis** que escala poder e custo proporcionalmente.

#### **Nova Estrutura de Penetração**

##### **Nível 1: Perfurante** (+4 por grau) 🆕
**Ataque desenhado para furar proteções ou encontrar pontos fracos**

| Tipo de Efeito | Mecânica |
|----------------|----------|
| **Dano** | Alvo considera sua RD **pela Metade** (arredondado para baixo) |
| **Cura/Persistente** | Cura danos/aflições com **Incurável de grau igual ou menor** |

**Exemplo - Espada Afiada:**
- Dano 6 com Perfurante → (2+4) × 6 = **36 PdA**
- Alvo tem RD 8 → Considera RD 4 (8/2)
- **Uso:** Armas perfurantes, ataques precisos, encontrar fraquezas

##### **Nível 2: Penetrante** (+6 por grau)
**Ataque atravessa matéria física como se não existisse**

| Tipo de Efeito | Mecânica |
|----------------|----------|
| **Dano** | **Ignora Resistências** do alvo + **metade da RD** |
| **Cura** | Cura **Incurável de qualquer grau** |

**Exemplo - Lâmina Monomolecular:**
- Dano 8 com Penetrante → (2+6) × 8 = **64 PdA**
- Alvo tem RD 10 + Resistência 5 → Ignora resistência totalmente, considera RD 5 (10/2)
- **Uso:** Faseamento, ataques espirituais, armas high-tech, ignorar armadura mágica

**Evolução:** Penetrante pode evoluir para Verdadeiro, permitindo aplicar a outros efeitos (não só dano/cura)

##### **Nível 3: Verdadeiro** (+8 por grau | Grau Mín: 5)
**Poder absoluto que transcende defesas normais**

| Aspecto | Mecânica |
|---------|----------|
| **Dano** | Ignora **RD, Resistências e Imunidades** completamente |
| **Cura** | Recupera **qualquer coisa** (inclusive lesões), dependente de descritor |
| **Defesa** | Não pode ser respondido por **reações normais** (exceto Verdadeiras) |
| **Absorção** | **Não pode ser absorvido** |
| **Nulificação** | **Não pode ser nulificado** (exceto Nulificar Verdadeiro ou Caos) |

**Exemplo - Rajada Divina:**
- Dano 10 com Verdadeiro → (2+8) × 10 = **100 PdA**
- **Requer:** Grau mínimo 5
- Ignora TUDO: RD 20, Resistência 10, Imunidade a Energia → Dano total
- **Uso:** Poderes divinos, cosmic-level, reality-warping

#### **Comparação: Sistema Antigo vs Novo**

| Modificação | Custo Antigo | Custo Novo | Mudança | Poder |
|-------------|--------------|------------|---------|-------|
| Penetrante/Persistente | +3/grau | — | **Removido** | Ignora RD |
| **Perfurante** 🆕 | — | **+4/grau** | **Novo** | RD/2 |
| **Penetrante** | — | **+6/grau** | **Renomeado** | Ignora Resistências + RD/2 |
| **Verdadeiro** | +6/grau | **+8/grau** | +33% | Ignora tudo + não-nulificável |

#### **Progressão de Poder e Custo**

```
Perfurante (+4)  →  Penetrante (+6)  →  Verdadeiro (+8)
    RD/2              Resist.+RD/2         Tudo+Absoluto
    
Custo cresce proporcionalmente ao poder:
+4 → +6 (+50%) → +8 (+33%)
```

#### **Tabela de Custos (Dano Grau 10)**

| Tipo | Custo Base | Com Modificação | Total | Incremento |
|------|------------|-----------------|-------|------------|
| **Normal** | 2/grau | — | 20 PdA | — |
| **Perfurante** | 2/grau | +4/grau | **60 PdA** | +200% |
| **Penetrante** | 2/grau | +6/grau | **80 PdA** | +300% |
| **Verdadeiro** | 2/grau | +8/grau | **100 PdA** | +400% |

#### **Exemplos Práticos**

**Exemplo 1: Curador Persistente (Grau 7)**
- Recuperação 7 (custoBase 3) → 21 PdA
- **Com Perfurante:** (3+4) × 7 = **49 PdA**
  - Cura Incurável até grau 7
- **Com Penetrante:** (3+6) × 7 = **63 PdA**
  - Cura qualquer Incurável
- **Com Verdadeiro:** Requer grau mínimo 5 → (3+8) × 7 = **77 PdA**
  - Cura até lesões permanentes (dependente de descritor)

**Exemplo 2: Ataque Físico (Grau 8)**
- Dano 8 → 16 PdA
- Alvo: RD 12, Resistência 6, Imunidade a Físico
- **Normal:** Imune (não funciona)
- **Perfurante:** RD 6 (12/2), ainda imune → reduz efetividade
- **Penetrante:** Ignora resistência + RD 6 → **funciona parcialmente**
- **Verdadeiro (grau 5+):** Ignora tudo → **dano total**

**Exemplo 3: Lâmina Espiritual (Grau 6)**
- Dano 6, descritor: Espiritual/Etéreo
- **Com Penetrante:** (2+6) × 6 = **48 PdA**
- Atinge corpo físico E espiritual
- Ignora resistências físicas + RD/2
- Alvo corpóreo com RD 10 → sofre dano com RD 5
- Alvo intangível → sofre dano normalmente

#### **Impacto no Sistema**

**Balanceamento:**
- ✅ Progressão clara: Perfurante → Penetrante → Verdadeiro
- ✅ Custo proporcional ao poder (+4 → +6 → +8)
- ✅ Grau mínimo 5 para Verdadeiro evita abuso early-game
- ✅ Opções intermediárias para diferentes níveis de poder

**Casos de Uso:**
- **Perfurante:** Street-level, armas perfurantes, ataques precisos
- **Penetrante:** Super-powered, faseamento, ataques energéticos high-level
- **Verdadeiro:** Cosmic-level, divindades, reality-warpers

**Estratégia:**
- Perfurante oferece meio-termo custo-efetivo
- Penetrante é escolha sólida para high-tier sem ser absoluto
- Verdadeiro é investimento máximo para poder transcendente

---

## [Data: 11/01/2026] - Ajustes de Balanceamento em Modificações

### 🔧 **Modificações Atualizadas (Custos Revisados)**

#### **Extras com Custos Aumentados**

##### **À Distância Estendido** 
- **Antes:** +1 por grau
- **Depois:** +2 por grau
- **Motivo:** Dobrar alcance a cada ponto é extremamente poderoso para efeitos à distância

##### **Contagioso**
- **Antes:** +1 por grau
- **Depois:** +2 por grau
- **Motivo:** Efeitos que se espalham por contato têm potencial multiplicador exponencial

##### **Descritor Variável**
- **Antes:** Base +2 por grau | Grupo Amplo +2 adicional (total +4)
- **Depois:** Base +3 por grau | Grupo Amplo +3 adicional (total +6)
- **Motivo:** Versatilidade de mudar descritores livremente é poder imenso (adapta-se a qualquer situação)

##### **Efeito Secundário**
- **Antes:** +3 por grau
- **Depois:** +4 por grau
- **Motivo:** Atingir o alvo duas vezes (agora e no próximo turno) dobra a efetividade tática

##### **Incurável**
- **Antes:** +2 por grau
- **Depois:** +3 por grau
- **Motivo:** Dano que só cura naturalmente (não por poderes) é significativamente mais perigoso

##### **Inevitável**
- **Antes:** +4 por grau
- **Depois:** +6 por grau
- **Motivo:** Sem teste de ataque E sem teste de resistência é poder absoluto (deve ser muito caro)

---

### 🆕 **Nova Modificação**

#### **Exige Resistência** - Extra de Teste Defensivo
**Custo:** +1 por grau (ou +0 se efeito não tem teste nativo)

##### Descrição:
O efeito necessita de um teste de resistência, fazendo com que o alvo ainda sofra **metade dos efeitos do poder em caso de sucesso**. 

##### Mecânica:
- **Se o efeito NÃO tem teste:** Custo **+0** (adiciona teste novo gratuitamente)
- **Se o efeito JÁ tem teste:** Custo **+1/grau** (troca o teste existente)
- Escolha o tipo de resistência ao comprar: **Fortitude, Reflexo ou Vontade**

##### Opções de Resistência:
| Tipo | Descrição |
|------|-----------|
| **Fortitude** | Resistência física, venenos, doenças |
| **Reflexo** | Esquiva, reações rápidas, áreas |
| **Vontade** | Resistência mental, controle, ilusões |

##### Exemplos de Uso:

**Exemplo 1: Rajada de Energia (Dano)**
- Efeito: Dano 8 (custoBase 2) → 16 PdA
- Padrão: Teste de ataque, sem resistência
- Com Exige Resistência (Reflexo): +1/grau → (2+1) × 8 = **24 PdA**
- **Mecânica:** Acerta ataque → Alvo testa Reflexo → Sucesso = metade do dano

**Exemplo 2: Raio Paralisante (Aflição - já tem teste)**
- Efeito: Aflição 6 (custoBase 3) → 18 PdA base
- Padrão: Teste Fortitude (nativo)
- Com Exige Resistência (Vontade): +1/grau → (3+1) × 6 = **24 PdA**
- **Mecânica:** Troca teste de Fortitude por Vontade, mantém "sucesso = metade"

**Exemplo 3: Explosão de Fogo (Área - sem teste)**
- Efeito: Dano 5 com Área
- Adiciona Exige Resistência (Reflexo): **+0** (grátis, adiciona teste novo)
- **Mecânica:** Criaturas na área testam Reflexo → Sucesso = metade do dano

##### Impacto no Sistema:
- 🎯 **Efeitos de área** ganham teste de resistência gratuitamente (+0)
- ⚖️ **Efeitos com teste** podem trocar tipo de resistência por +1/grau
- 🛡️ **Alvos resilientes** têm chance de reduzir impacto (não apenas evitar totalmente)
- 🎮 **Balanceamento:** Efeitos garantidos ficam menos absolutos

---

## [Data: 11/01/2026] - Reformulação do Sistema de Duração

### 🔧 **Mecânicas Atualizadas**

#### **Sistema de Duração - Custos de Transição Revisados**

O sistema de duração foi reformulado para refletir melhor a complexidade e poder de cada nível. As transições entre níveis agora têm custos variáveis baseados no salto de qualidade entre elas.

##### Escala de Duração (da mais restritiva à mais flexível):

| Valor | Nome | Descrição | Custo para Próximo |
|-------|------|-----------|-------------------|
| **0** | **Instantâneo** | Exige Ação Padrão, efeito se extingue após uso mantendo resultado | **+1/grau** |
| **1** | **Manutenção (Concentração)** | Exige Ação Padrão por turno para manter | **+2/grau** |
| **2** | **Manutenção (Sustentada)** | Exige Ação Livre por turno para manter | **+3/grau** |
| **3** | **Ativado** | Não exige ação para manter; funciona como liga/desliga | — |
| **4** | **Permanente** | Sempre ativo, não pode ser desligado (requer mod. especial) | — |

##### Regras de Custo:

**Regra Geral:**
- Mover efeito **PARA BAIXO** na escala (melhorar) custa **+N por grau**
- Mover efeito **PARA CIMA** na escala (piorar) concede **-N por grau**

**Custos Especiais por Transição:**

| Transição | Custo Melhoria | Custo Piora | Justificativa |
|-----------|----------------|-------------|---------------|
| Instantâneo ↔ Concentração | +1/grau | -1/grau | Salto básico, efeito ganha persistência |
| Concentração ↔ Sustentada | +2/grau | -2/grau | Libera ação padrão, aumento significativo de eficiência tática |
| Sustentada ↔ Ativado | +3/grau | -3/grau | Libera ação livre, poder torna-se "sempre disponível" |

##### Exemplos de Aplicação:

**Exemplo 1: Dano (Instantâneo → Concentração)**
- Efeito: Dano, custoBase 2, grau 8
- Padrão: Instantâneo (0)
- Modificado: Concentração (1) — dano contínuo
- Modificador: +1/grau
- **Custo Final:** (2 + 1) × 8 = **24 PdA**
- **Ganho:** Dano se repete cada turno enquanto mantém concentração

**Exemplo 2: Proteção (Ativado → Sustentada)**
- Efeito: Proteção, custoBase 3, grau 10
- Padrão: Ativado (3)
- Modificado: Sustentada (2) — campo de força precisa de manutenção
- Modificador: -3/grau (piora duas transições: -3 + 0 = -3, pois pula Concentração)
  * Nota: Ativado (3) → Sustentada (2) é 1 salto direto = -3/grau
- **Custo Final:** (3 - 3) × 10 = **0 PdA** (mínimo 1 × 10 = 10 PdA)
- **Perda:** Precisa gastar ação livre por turno para manter

**Exemplo 3: Voo (Sustentada → Ativado)**
- Efeito: Voo, custoBase 3, grau 6
- Padrão: Sustentada (2)
- Modificado: Ativado (3) — voar sem esforço mental
- Modificador: +3/grau
- **Custo Final:** (3 + 3) × 6 = **36 PdA**
- **Ganho:** Não precisa manter com ação livre, voa automaticamente

**Exemplo 4: Ilusão (Concentração → Instantâneo)**
- Efeito: Ilusão, custoBase 1, grau 4
- Padrão: Concentração (1)
- Modificado: Instantâneo (0) — ilusão persistente sem manutenção
- Modificador: -1/grau
- **Custo Final:** (1 - 1) × 4 = **0 PdA** (mínimo 1 × 4 = 4 PdA)
- **Perda:** Efeito não pode ser controlado após ativação, mas resultado permanece

**Exemplo 5: Invocar (Sustentada → Concentração)**
- Efeito: Invocar, custoBase 7, grau 5
- Padrão: Sustentada (2)
- Modificado: Concentração (1) — lacaio requer total concentração
- Modificador: -2/grau
- **Custo Final:** (7 - 2) × 5 = **25 PdA**
- **Perda:** Lacaio desaparece se não gastar ação padrão mantendo-o, não pode fazer mais nada

##### Impacto no Sistema:

**Balanceamento:**
- Duração Ativada torna-se significativamente mais cara (consistente com poder de "sempre ativo")
- Concentração vs Sustentada tem diferença real (2 pontos reflete liberação de ação padrão)
- Pioras estratégicas oferecem descontos proporcionais ao sacrifício tático

**Casos Especiais:**
- **Permanente (4):** Continua sendo aplicado via modificação especial a partir de Ativado
- **custoEquivalente:** Permanente usa valor 3 (Ativado) para cálculos de custo

**Compatibilidade:**
- Sistema anterior usava ±1 para todas transições
- Nova regra diferencia peso tático de cada transição
- Efeitos existentes mantêm valores padrão, modificação de duração aplica novos custos

---

## [Data: 11/01/2026] - Atualização de Custos e Mecânicas

### 🆕 Novos Efeitos

#### **Controle Mental** - Efeito Poderoso de Dominação Mental
**Custo Base:** 6 pontos por grau
**Alcance:** Percepção | **Duração:** Manutenção (Concentração)

Permite impor sua vontade sobre a mente de outros com controle progressivo baseado em grau.

##### Mecânica Principal:
- **Teste:** Efeito vs Vontade do alvo
- **Sucesso:** Estabelece controle (nível baseado em grau)
- **Falha:** Alvo resiste e percebe invasão (exceto com Sutil)
- **Resistência Contínua:** Novo teste de Vontade no final de cada turno do alvo
- **Ordens Suicidas:** +2 Vantagens para resistir se ordem obviamente suicida ou contra natureza fundamental

##### Sistema de Patamares (3 Níveis):

| Patamar | Grau Mín | Tipo | Descrição |
|---------|----------|------|-----------|
| **1** | 2 | **Influência (Sugestão)** | Planta ideia, emoção ou tendência |
| **2** | 5 | **Compulsão (Ordem Única)** | Força ação específica ou emoção intensa |
| **3** | 9 | **Dominação (Marionete)** | Controle total, dita todas ações |

**Patamar 1 - Influência/Sugestão (Grau 2+):**
- Não controla ações diretamente, apenas inclina o alvo
- Aplicações:
  - **Tendência:** "Você sente que aquele guarda é suspeito"
  - **Empurrão:** "Você está com sede"
  - **Dúvida:** "Talvez eu deva deixar a porta destrancada"
- **Limite:** Alvo racionaliza como ideia própria, não fará nada que não faria sob leve pressão social

**Patamar 2 - Compulsão/Ordem Única (Grau 5+):**
- Força ação específica ou estado emocional intenso
- Alvo age contra vontade momentânea mas mantém consciência
- Aplicações:
  - **Provocação:** Compelido a atacar ignorando estratégias defensivas
  - **Charme:** Considera você amigo leal, não ataca, protege de ameaças
  - **Comando:** Uma frase: "Largue a arma", "Corra", "Fique parado", "Diga a verdade"
- **Limite:** Ordem rege ação principal do turno, alvo escolhe como executa

**Patamar 3 - Dominação/Marionete (Grau 9+):**
- Controle total de funções motoras e mentais
- Aplicações:
  - **Controle Total:** Dita todas ações, movimentos, falas (você joga com a ficha dele)
  - **Programação:** Gatilhos complexos: "Quando o Rei entrar, ataque-o"
- **Limite:** Apenas um alvo dominado por vez com concentração (exceto com modificações de área/divisão)

##### Extras Sugeridos (Customização):
- **Elo Sensorial (+1/grau):** Vê e ouve através dos sentidos do alvo (como Sentido Remoto)
- **Telepático (+1/grau):** Ordens mentais diretas (sem precisar falar/ser ouvido)

##### Falhas Sugeridas (Limitações):
- **Dependente de Sentido (-1/grau):** Requer vetor físico constante
  - Visual: Precisa ver seus olhos/pêndulo, desviar quebra
  - Auditivo: Precisa ouvir voz/música, silêncio quebra
- **Limitado a Emoções (-1/grau):** Só gera estados emocionais, não dita ações (Controle Emocional)
- **Transe (-1/grau):** Seu corpo fica imóvel e indefeso enquanto mantém controle

**Impacto no Jogo:**
- 🎯 Efeito de alto nível para dominação mental completa
- ⚖️ Balanceado por custo alto (6 pts/grau) e resistência contínua
- 🎭 Progressão clara: Sugestão → Comando → Dominação
- ⚠️ Pode ser game-changing no grau 9+ (marionete)
- 🛡️ Contramedidas: Testes de Vontade, penalidades para ordens extremas

---

### ⚖️ Mudanças em Custos de Efeitos

#### **Compreender** - Custo Aumentado
- **Antes:** Custo Base = 4 pontos
- **Depois:** Custo Base = 6 pontos
- **Motivo:** Balanceamento - efeito de comunicação com múltiplas funcionalidades (animais, espíritos, idiomas, máquinas, objetos, plantas) estava sub-precificado para seu poder

#### **Recuperação** - Custo Aumentado
- **Antes:** Custo Base = 2 pontos
- **Depois:** Custo Base = 3 pontos
- **Motivo:** Balanceamento - efeito de cura com múltiplas modalidades (Dano, Condição, Lesão, Energia) estava sub-precificado para seu poder e versatilidade

#### **Teleporte** - Custo Aumentado
- **Antes:** Custo Base = 2 pontos
- **Depois:** Custo Base = 3 pontos
- **Motivo:** Balanceamento - movimento instantâneo sem atravessar distância é extremamente poderoso e estava sub-precificado

#### **Sentidos** - Reformulação Completa do Sistema
- **Antes:** Custo Base = 4 pontos (lista simples de capacidades)
- **Depois:** Custo Base = 3 pontos (sistema de patamares estruturado)
- **Motivo:** Reorganização para maior clareza e balanceamento por poder das capacidades

#### **Sentido Remoto** - Mecânica Reformulada e Custo Ajustado
- **Antes:** Custo Base = 1 ponto (sistema complexo de tipos)
- **Depois:** Custo Base = 3 pontos (pacotes simplificados)
- **Motivo:** Simplificação e balanceamento - efeito poderoso que estende alcance de todos os poderes baseados em percepção

**Mudanças Estruturais:**

##### Sistema de Pacotes de Sentidos (Simplificado)
Substituiu sistema complexo de "1-5 tipos" por pacotes claros:

| Pacote | Custo Total/Grau | Descrição |
|--------|------------------|-----------|
| **Sentido Único Não-Visual** | 3 pontos/grau (+0) | Audição, Faro, Mental, etc. Difícil para mirar sem Acurado |
| **Visão (Sozinha)** | 4 pontos/grau (+1) | Apenas visão. Observação clara sem outros sentidos |
| **Visão + Audição** | 5 pontos/grau (+2) | "Pacote Espionagem" - Reconhecimento completo |
| **Todos os Sentidos** | 6 pontos/grau (+3) | "Projeção Completa" - Como estar presente fisicamente |

##### Mecânicas Detalhadas Adicionadas:

**O Sensor:**
- Ponto de percepção invisível e intangível no local alvo
- Não precisa ver o local (define distância/direção ou conhece o local com Acurado)
- Alcance baseado na Tabela Universal de Distância

**Ataque via Sensor:** 🆕
- Ataques com alcance Percepção podem originar do Sensor
- Para o alvo, surge do nada ou do Sensor invisível
- Transforma observação passiva em ameaça ofensiva

**Sobreposição (Trade-off):** ⚠️
- Sentidos naturais do corpo físico são substituídos
- **Desvantagem:** Fica Desprevenido contra ameaças ao corpo físico
- Vulnerabilidade durante uso

**Detecção (Contramedida):**
- Sensor NÃO é indetectável
- Criaturas fazem teste de Intuição (ou Percepção Mística) vs Teste de Efeito
- **Sucesso:** Sentem presença, calafrio ou perturbação no local

**Interação Sensorial:**
- Pode usar efeitos de Sentidos através do Sensor
- Exemplos: Visão no Escuro, Analítico, Infravisão
- Deve fazer parte do pacote projetado

##### Parâmetros de Ação Ajustados:
- **Ação:** Livre → **Movimento** (mais realista para estabelecer sensor)
- **Duração:** Sustentado (mantido)
- **Alcance:** Grau (Tabela Universal de Distância)

**Impacto no Jogo:**
- ✅ Sistema mais claro e intuitivo
- ✅ Custo reflete poder real (estende todos os poderes de Percepção)
- ✅ Contramedidas adicionadas (detecção, vulnerabilidade)
- ✅ Uso ofensivo explicitado (ataque via sensor)
- ⚖️ Balanceamento melhor entre poder e custo

**Mudança Estrutural Completa:**

##### Sistema de Patamares (Novo)
O efeito agora é organizado em 4 patamares baseados em poder e grau mínimo:

| Patamar | Grau Mín | Custo/Grau | Capacidades |
|---------|----------|------------|-------------|
| **1** | 2 | +1 | Básicas (Radial, Rastrear, Sentidos de Direção/Distância/Perigo/Tempo, Ultra-audição, Ultravisão, À Distância, Detecção, Estendido, Visão Ampliada) |
| **2** | 4 | +3 | Avançadas (Contra-Ataca Camuflagem Única, Rádio, Rápido, Visão na Penumbra, Elo de Comunicação, Infravisão, Percepção, Detecção Acurado, Avaliação, Visão Microbiológica) |
| **3** | 5 | +4 | Superiores (Contra-Ataca Camuflagem Universal, Penetra Camuflagem/Raio-X, Pós-cognição, Visão no Escuro, Visão Molecular) |
| **4** | 7 | +6 | Supremas (Precognição, Analítico, Visão Atômica) |

##### Novas Capacidades Detalhadas:

**Patamar 1 (Básico):**
- **Radial:** Percepção 360°, alvos atrás não podem usar Furtividade sem camuflagem
- **Rastrear:** Seguir trilhas com dificuldade reduzida
- **Sentido de Direção:** Sempre sabe onde é o norte, refaz passos
- **Sentido de Distância:** Julga distâncias automaticamente
- **Sentido de Perigo:** Teste de Percepção contra surpresa
- **Sentido de Tempo:** Cronômetro mental preciso
- **Ultra-audição:** Ouve frequências extremas (ultrassom, infrassom)
- **Ultravisão:** Enxerga luz ultravioleta
- **À Distância:** Usa sentido sem alcance (tato/paladar) a distância
- **Detecção:** Sente presença/ausência de efeito específico
- **Estendido:** Alcance ampliado (multiplicado pela Sabedoria)
- **Visão Ampliada:** Detalhes minúsculos como lupa extrema

**Patamar 2 (Avançado):**
- **Contra-Ataca Camuflagem Única:** Ignora camuflagem de descritor específico
- **Rádio:** "Ouve" AM/FM/celular/TV, permite Comunicação
- **Rápido:** Processa informação sensorial x5 mais rápido por grau (começa grau 4)
- **Visão na Penumbra:** Ignora penalidades de baixa luminosidade
- **Elo de Comunicação:** Comunicação telepática com indivíduo específico
- **Infravisão:** Enxerga calor, rastreia trilhas térmicas
- **Percepção:** Sente uso de descritor específico (exceto espiritual)
- **Detecção Acurado:** Detecta efeito e especifica detalhes (grau, domínio)
- **Avaliação:** Estima características de criaturas/objetos (saúde, nível de ameaça, qualidade)
- **Visão Microbiológica:** Enxerga células, bactérias, estruturas orgânicas

**Patamar 3 (Superior):**
- **Contra-Ataca Camuflagem Universal:** Ignora QUALQUER camuflagem
- **Penetra Camuflagem (Raio-X):** Vê através de obstáculos físicos
  - Espessura baseada em Tabela Universal de Distância
  - Materiais densos têm "Nível de Bloqueio" que deve superar
  - **Limitação:** Vê através, mas não remove cobertura para ataques
- **Pós-cognição:** Percebe eventos passados, consciência no passado enquanto ativa
- **Visão no Escuro:** Enxerga na escuridão total como dia normal
- **Visão Molecular:** Enxerga composição química, DNA, moléculas

**Patamar 4 (Supremo):**
- **Precognição:** Percebe futuros possíveis, visões crípticas do mestre
- **Analítico:** Decompõe realidade em dados, teste oposto revela:
  - Objetos: Composição exata, dureza, PV, funções, histórico
  - Criaturas: "Ficha completa" - resistências, imunidades, vulnerabilidades, atributos, PV/PE exatos
- **Visão Atômica:** Enxerga átomos, elétrons, espaço vazio, assinatura atômica

##### Regras Importantes:
- **Um sentido por grau:** Escolha sentido (visão, audição, etc.) e uma capacidade
- **Múltiplas capacidades:** Requer comprar efeito adicional
- **Sentidos extras:** Dentro do mesmo poder, cada adicional custa +2/grau (Modificação Global)
- **Patamar determina acesso:** Grau mínimo deve ser atingido para acessar capacidades

**Impacto no Jogo:**
- ✅ Sistema mais organizado e intuitivo
- ✅ Progressão clara de poder (básico → supremo)
- ✅ Balanceamento melhor (capacidades poderosas custam mais)
- ✅ Flexibilidade mantida para customização
- ✅ Descrições detalhadas facilitam interpretação

---

### 🔄 Mudanças em Modificações

#### **Modificações de Invocar** - Novas Opções e Atualização 🆕

##### Novas Modificações Adicionadas:

**1. Normal** (+1 por grau)
- **Tipo:** Extra
- **Descrição:** Criaturas invocadas têm tipo padrão de criatura com atributos padrão
- **Custo:** Base do efeito + 1 por grau por criatura invocada
- **Uso:** Para invocar criaturas equilibradas com estatísticas normais

**2. Bruto** (+2 por grau)
- **Tipo:** Extra
- **Descrição:** Criaturas invocadas têm tipo Bruto com atributos Bruto (superiores)
- **Custo:** Base do efeito + 2 por grau por criatura invocada
- **Uso:** Para invocar criaturas mais poderosas e resistentes

##### Modificação Atualizada:

**Heroico** - Descrição Expandida
- **Antes:** "Tratadas como personagens normais"
- **Depois:** "Tratadas como personagens normais **e criaturas de Elite**"
- **Custo:** Mantido em +3 por grau
- **Clarificação:** Agora explicitamente menciona que são criaturas de Elite, não apenas personagens normais
- Lacaios = Personagens completos de Elite com mesmo nível do invocador

**Hierarquia de Poder dos Lacaios:**

| Modificação | Custo/Grau | Tipo de Criatura | Características |
|-------------|------------|------------------|-----------------|
| **Lacaio Padrão** | Base | Lacaio | Regras de Lacaios, limitados |
| **Normal** | +1 | Padrão | Atributos padrão de criatura |
| **Bruto** | +2 | Bruto | Atributos Bruto (superiores) |
| **Heroico** | +3 | Elite | Personagens completos, PVs normais, mesmo nível |

**Impacto no Jogo:**
- ✅ Progressão clara de poder vs custo
- ⚖️ Balanceamento: quanto mais poderoso, mais caro
- 🎯 Opções táticas: escolher entre quantidade vs qualidade
- 📊 Normal e Bruto preenchem lacuna entre Lacaio básico e Heroico

**Exemplo de Custos:**
```
Invocar Grau 5:
- Lacaio Padrão: 5 pontos base
- + Normal: 5 + 5 = 10 pontos por criatura
- + Bruto: 5 + 10 = 15 pontos por criatura  
- + Heroico: 5 + 15 = 20 pontos por criatura (Elite)
```

---

#### **Ressurreição** - Mecânica Completamente Reformulada + Sistema de Parâmetros

**Mudanças principais:**

##### 0. **Sistema de Parâmetros Implementado** 🆕
- Agora requer parâmetro de grau (similar a Área)
- `requerParametros: true`
- `tipoParametro: "grau"`
- `grauMinimo: 1` / `grauMaximo: 20`
- Usuário deve especificar o grau ao adicionar a modificação
- Campo `detalhesGrau` adicionado com tabela de tempo resumida

##### 1. **Sistema de Graus e Limite**
- Agora possui seu próprio grau separado da Recuperação base
- **Regra:** Grau de Ressurreição ≤ Grau de Recuperação
- **Exceção:** Recuperação grau 10 permite Ressurreição até grau 20

##### 2. **Janela de Tempo Baseada em Grau** (Nova Mecânica)
Tabela de tempo máximo que o alvo pode estar morto:

| Grau | Tempo Máximo                        |
|------|-------------------------------------|
| 1    | 1 Rodada (Morte Clínica/Imediato) |
| 3    | 1 Minuto                           |
| 4    | 30 Minutos                         |
| 5    | 1 Hora                             |
| 9    | 12 Horas                           |
| 10   | 1 Dia                              |
| 14   | 1 Mês                              |
| 17   | 1 Ano                              |
| 20   | Séculos/Milênios (com vestígios)  |

##### 3. **Mecânica de Teste Reformulada**
- **Antes:** CD = maior CD do alvo
- **Depois:** CD = maior CD que o alvo possuía em vida **OU** CD da força que o matou (se sobrenatural)
- Mais realista e dramático para mortes por poderes poderosos

##### 4. **Resultado em Sucesso**
- Alvo retorna com a condição **Estabilizado** e **1 PV**
- **Importante:** NÃO recupera automaticamente:
  - Lesões anteriores
  - Membros perdidos
  - Condições anteriores à morte
- Requer cura adicional para recuperação completa

##### 5. **Limite de Tentativas**
- **Falha:** Não pode tentar novamente no **mesmo alvo** pela **cena inteira**
- Evita spam de ressurreição

**Comparação de Texto:**

<details>
<summary>📜 Descrição Antiga vs Nova</summary>

**Antes:**
> "Você pode restaurar a vida dos mortos! Caso o alvo esteja morto a uma quantidade de minutos igual ou menor que o grau em Recuperação, faça um teste de efeito (A CD desse teste é a maior CD do alvo). Caso seja bem-sucedido, a condição do paciente se torna Estabilizado com 1PV, isso por si só não recupera lesões ou condições anteriores, como se tivesse acabado de ser estabilizado (esse efeito apenas vale para outros alvos)."

**Depois:**
> "Você pode restaurar a vida dos mortos! Ao aplicar este extra, seu efeito de Recuperação ganha a capacidade de reverter a condição Morto. Este extra possui seu próprio grau, que deve ser comprado separadamente. LIMITE: O Grau de Ressurreição não pode ser maior que o Grau do efeito de Recuperação base, exceto grau 10 de Recuperação liberando Ressurreição até grau 20. JANELA DE TEMPO: O tempo máximo que o alvo pode estar morto é determinado pelo seu Grau em Ressurreição - Grau 1: 1 Rodada (Imediato/Morte Clínica); Grau 3: 1 Minuto; Grau 4: 30 Minutos; Grau 5: 1 Hora; Grau 9: 12 Horas; Grau 10: 1 Dia; Grau 14: 1 Mês; Grau 17: 1 Ano; Grau 20: Séculos ou Milênios (Desde que haja vestígios). ATIVAÇÃO: Faça um Teste de Efeito (Recuperação). A CD é a maior CD que o alvo possuía em vida (ou a CD da força que o matou, se for sobrenatural). SUCESSO: A condição do paciente se torna Estabilizado com 1 PV. Isso por si só não recupera lesões, membros perdidos ou condições anteriores à morte. FALHA: O efeito não funciona e você não pode tentar novamente no mesmo alvo pela cena."

</details>

**Impacto no Jogo:**
- ✅ Maior flexibilidade tática (graus separados)
- ✅ Sistema de progressão mais claro
- ✅ Previne ressurreição de personagens há muito tempo mortos sem investimento significativo
- ✅ Cria momentos mais dramáticos (limite de tentativas)

---

### 🧪 Testes

- **Status:** ✅ Todos os 92 testes passando
- **Arquivos Afetados:**
  - `src/data/efeitos.json` (Compreender)
  - `src/data/modificacoes.json` (Ressurreição)
- **Compatibilidade:** Mantida com sistema de hydration v1.0.0

---

### 📝 Notas de Desenvolvimento

**Sobre a Ressurreição:**
A reformulação torna a ressurreição mais equilibrada e realista:
- **Grau baixo (1-5):** Reanimação imediata/emergência (até 1 hora)
- **Grau médio (9-10):** Ressurreição de mortes recentes (até 1 dia)
- **Grau alto (14-17):** Trazer de volta os perdidos há tempos (até 1 ano)
- **Grau máximo (20):** Necromancia lendária, artefatos divinos (milênios)

**Design Philosophy:**
Agora o custo total escala apropriadamente:
- Base: Recuperação (Custo Base 0) + Ressurreição (+1/grau)
- Exemplo: Recuperação 10 + Ressurreição 10 = 10 pontos totais
- Para ressurreição de 1 dia de morte (viável para campanhas médias)

---

### 🔮 Próximas Mudanças Planejadas

- [ ] **Sentidos** - Reformulação completa (aguardando próximo prompt)
- [ ] Novos efeitos a serem adicionados
- [ ] Balanceamento adicional baseado em playtest

---

## Histórico de Versões

### v1.0.0 - Sistema de Hydration
- ✅ Implementado sistema de versionamento de schemas
- ✅ Hydration automática de poderes salvos
- ✅ Backward compatibility para dados antigos

### v0.9.0 - Refatoração de Código
- ✅ Eliminação de código duplicado (modificacaoFormatter.ts)
- ✅ Centralização de utilitários
- ✅ 92 testes implementados e passando

---

**Legenda:**
- 🆕 Novo
- ⚖️ Balanceamento
- 🔄 Mudança de Mecânica
- 🐛 Correção de Bug
- ✅ Completo
- 🧪 Testes
