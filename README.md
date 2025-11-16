# Spirit and Caos System - Power Creator

Sistema de criação de poderes/técnicas para RPG, desenvolvido com React + TypeScript + Vite.

## 🎮 Sobre o Sistema

Ferramenta para criar e gerenciar poderes personalizados seguindo as regras do sistema Spirit and Caos, inspirado em Mutants & Masterminds.

## 🏗️ Arquitetura de Parâmetros

### Conceito Central

A arquitetura é **hierárquica**:
- Um **Poder** é o contêiner principal
- Um **Poder** contém múltiplos **Efeitos** (blocos de construção como "Dano", "Voo", "Afligir")
- Cada **Efeito** possui parâmetros padrão (Ação, Alcance, Duração)

### Regras de Negócio

#### 1️⃣ Efeitos Definem o Padrão (Regra do "Pior Parâmetro")

Os parâmetros do **Poder** são **auto-calculados** como o **pior** (mais restritivo) parâmetro entre todos os efeitos filhos:

```typescript
// Exemplo:
Efeito A: {acao: 1, alcance: 1, duracao: 0}  // Ação Padrão, Corpo-a-corpo, Instantâneo
Efeito B: {acao: 5, alcance: 0, duracao: 4}  // Nenhuma, Pessoal, Permanente

// Poder auto-calcula (pior = menor valor):
Poder: {acao: 1, alcance: 0, duracao: 0}
```

**"Pior" = menor valor numérico:**
- Ação: 0 (Completa) < 5 (Nenhuma)
- Alcance: 0 (Pessoal) < 3 (Percepção)
- Duração: 0 (Instantâneo) < 4 (Permanente)

#### 2️⃣ O Poder Modifica Globalmente

A UI permite **modificar manualmente** os parâmetros auto-calculados do Poder. Quando modificados, esses valores se aplicam a **TODOS os efeitos**.

```typescript
// Modifico o Poder para:
Poder: {acao: 5, alcance: 0, duracao: 0}

// Este override se aplica a TODOS os efeitos
```

#### 3️⃣ O Custo é Calculado com Modificador Global

O modificador de custo é calculado **UMA VEZ** para o poder inteiro e aplicado a **TODOS os efeitos**:

```typescript
// Parâmetros padrão do poder: {acao: 1, alcance: 0, duracao: 0}
// Parâmetros atuais do poder: {acao: 5, alcance: 0, duracao: 0}

// Modificador GLOBAL = (atual - padrão)
modificadorGlobal = (5-1) + (0-0) + (0-0) = +4 PdA/grau

// Aplicado a CADA efeito:
Efeito A (custo base 1): 1 + 4 = 5 PdA/grau
Efeito B (custo base 4): 4 + 4 = 8 PdA/grau

// Total do Poder: 5 + 8 = 13 PdA
```

**Importante:** Os parâmetros **individuais dos efeitos** são **IGNORADOS** no cálculo de custo. Eles servem **APENAS** para definir os parâmetros padrão do poder.

### Fórmula de Custo

```
CustoPorGrau = CustoBase 
             + Σ(Modificações_Globais) 
             + Σ(Modificações_Locais) 
             + ModificadorParametrosGlobal

onde:
  ModificadorParametrosGlobal = (AçãoPoder - AçãoPadrãoPoder)
                               + (AlcancePoder - AlcancePadrãoPoder)
                               + (DuraçãoPoder - DuraçãoPadrãoPoder)
```

## 🚀 Tecnologias

- **React 19.2.0** - UI com componentes funcionais
- **TypeScript** - Tipagem estática
- **Vite 7.2.2** - Build tool rápido
- **Tailwind CSS** - Estilização
- **Zustand** - Gerenciamento de estado (biblioteca de poderes)

## 📂 Estrutura do Projeto

```
src/
├── data/
│   ├── efeitos.json        # Base de dados de efeitos
│   ├── modificacoes.json   # Modificadores disponíveis
│   └── escalas.ts          # Escalas de parâmetros
├── features/
│   └── criador-de-poder/
│       ├── components/     # Componentes React
│       ├── hooks/          # Lógica de negócio
│       └── regras/         # Motor de cálculo de custos
└── shared/
    └── ui/                 # Componentes reutilizáveis
```

## 🛠️ Como Usar

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:5173`

### Build para Produção

```bash
npm run build
```

## 📝 Exemplos de Uso

### Criar um Poder Simples

1. Adicione um efeito (ex: "Dano")
2. Configure o grau do efeito
3. Os parâmetros do poder são auto-calculados
4. (Opcional) Modifique os parâmetros do poder para override global
5. Adicione modificações globais ou locais conforme necessário

### Poder com Múltiplos Efeitos

```
Poder: "Rajada Flamejante"
├─ Dano (grau 5)           - {acao:1, alcance:1, duracao:0}
└─ Afligir (grau 2)        - {acao:1, alcance:1, duracao:0}

Parâmetros auto-calculados: {acao:1, alcance:1, duracao:0}
Custo sem modificações: 5 + 2 = 7 PdA

Se modificar Alcance para "À Distância" (2):
Modificador global: (1-1) + (2-1) + (0-0) = +1 PdA/grau
Dano: 1 + 1 = 2 PdA/grau × 5 = 10 PdA
Afligir: 1 + 1 = 2 PdA/grau × 2 = 4 PdA
Total: 14 PdA
```

## 🧮 Sistema de Cálculo

### RN-02: Custo de Poder
```
CustoPoder = Σ(CustoEfeito)
```

### RN-03: Custo Por Grau
```
CustoPorGrau = CustoBase + Modificações + ModificadorGlobal
```

### RN-05: Custo Mínimo
```
Custo NUNCA pode ser menor que 1 PdA
```

### RN-06: Modificadores de Parâmetros
```
Modificador = ParametroAtual - ParametroPadrão
- Valor positivo = parâmetro melhorado = custo AUMENTA
- Valor negativo = parâmetro piorado = custo DIMINUI
```

## 🎨 Funcionalidades

- ✅ Criação de poderes com múltiplos efeitos
- ✅ Cálculo automático de custos (PdA, PE, Espaços)
- ✅ Sistema de parâmetros hierárquico
- ✅ Modificações globais e locais
- ✅ Biblioteca de poderes salvos
- ✅ Exportação/importação JSON
- ✅ Interface responsiva (mobile + desktop)
- ✅ Tema claro/escuro

## 📄 Licença

Este projeto é de código aberto para fins educacionais.

---

**Versão:** 1.0.0  
**Última atualização:** 16 de novembro de 2025
