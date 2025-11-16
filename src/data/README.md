# 📚 Documentação dos Dados do Sistema

Esta pasta contém todos os dados do sistema "Espírito e Caos" em formato JSON.

## 📂 Arquivos

### 1. **`tabelaUniversal.json`**
Contém os valores de progressão por Grau (1-20).

**Campos:**
- `grau`: Nível do poder (1-20)
- `pe`: Pontos de Energia necessários
- `espacos`: Espaços que o poder ocupa
- `dano`: Valor de dano base
- `distancia`: Alcance máximo
- `massa`: Peso que pode ser manipulado
- `tempo`: Duração
- `velocidade`: Velocidade de movimento
- `area`: Raio de área de efeito

**Exemplo:**
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

---

### 2. **`efeitos.json`**
Define os blocos básicos de construção dos poderes.

**Campos:**
- `id`: Identificador único (kebab-case)
- `nome`: Nome legível do efeito
- `custoBase`: Custo em PdA por grau (RN-03)
- `descricao`: Explicação do que o efeito faz
- `parametrosPadrao`: Valores padrão de ação/alcance/duração
  - `acao`: 0-5 (Completa → Nenhuma)
  - `alcance`: 0-3 (Pessoal → Percepção)
  - `duracao`: 0-4 (Instantâneo → Permanente)
- `categorias`: Tags para filtro/organização
- `exemplos`: Exemplos narrativos de uso

**Exemplo:**
```json
{
  "id": "dano",
  "nome": "Dano",
  "custoBase": 2,
  "descricao": "Causa dano físico ou de energia ao alvo.",
  "parametrosPadrao": {
    "acao": 1,
    "alcance": 2,
    "duracao": 0
  },
  "categorias": ["ofensivo", "combate"],
  "exemplos": "Bola de fogo, rajada de energia"
}
```

---

### 3. **`modificacoes.json`**
Extras (melhoram o poder) e Falhas (reduzem custo).

**Campos:**
- `id`: Identificador único
- `nome`: Nome da modificação
- `tipo`: `"extra"` ou `"falha"`
- `custoFixo`: Modificador fixo em PdA (RN-04)
- `custoPorGrau`: Modificador por grau (RN-03)
- `descricao`: Explicação da modificação
- `requerParametros`: `true` se precisa de input customizado
- `tipoParametro`: `"texto"`, `"numero"` ou `"select"`
- `opcoes`: Array de opções (para tipo `select`)
- `placeholder`: Texto de ajuda para input
- `categoria`: Tipo da modificação (organização)

**Exemplos:**

**Extra Simples:**
```json
{
  "id": "sutil",
  "nome": "Sutil",
  "tipo": "extra",
  "custoFixo": 0,
  "custoPorGrau": 1,
  "descricao": "O poder é difícil de detectar quando em uso.",
  "requerParametros": false,
  "categoria": "ocultação"
}
```

**Falha com Parâmetro:**
```json
{
  "id": "limitado",
  "nome": "Limitado",
  "tipo": "falha",
  "custoFixo": 0,
  "custoPorGrau": -1,
  "descricao": "O poder só funciona sob condições específicas.",
  "requerParametros": true,
  "tipoParametro": "texto",
  "placeholder": "Ex: Apenas contra criaturas de fogo",
  "categoria": "restrição"
}
```

---

### 4. **`escalas.json`**
Define as escalas de parâmetros (Ação, Alcance, Duração).

**Estrutura:**
```json
{
  "acao": {
    "nome": "Ação",
    "descricao": "Quanto tempo leva para ativar o poder",
    "escala": [
      {
        "valor": 0,
        "nome": "Completa",
        "descricao": "Requer sua ação completa"
      },
      // ... valores 1-5
    ]
  },
  "alcance": { /* ... */ },
  "duracao": { /* ... */ }
}
```

**Valores:**
- **Ação**: 0 (Completa) → 5 (Nenhuma)
- **Alcance**: 0 (Pessoal) → 3 (Percepção)
- **Duração**: 0 (Instantâneo) → 4 (Permanente)

---

## 🔧 Como Usar

### Importando os Dados

```typescript
import { 
  EFEITOS, 
  MODIFICACOES, 
  TABELA_UNIVERSAL, 
  ESCALAS,
  buscarEfeito,
  buscarModificacao,
  buscarGrauNaTabela,
  obterNomeParametro
} from '@/data';

// Buscar um efeito específico
const dano = buscarEfeito('dano');
console.log(dano?.custoBase); // 2

// Buscar valores de um grau
const grau5 = buscarGrauNaTabela(5);
console.log(grau5?.pe); // 75

// Obter nome de parâmetro
const nomeAcao = obterNomeParametro('acao', 1);
console.log(nomeAcao); // "Padrão"
```

---

## 📝 Regras de Negócio

### RN-02: Fórmula de Custo
```
CustoEfeito = (CustoPorGrau_Final × Grau) + CustoFixo_Final
```

### RN-03: Cálculo do CustoPorGrau_Final
```
CustoPorGrau_Final = CustoBase_Efeito 
                   + Σ(Modificações_Globais_PorGrau)
                   + Σ(Modificações_Locais_PorGrau)
```

### RN-04: Cálculo do CustoFixo_Final
```
CustoFixo_Final = Σ(Modificações_Globais_Fixas) 
                + Σ(Modificações_Locais_Fixas)
```

### RN-05: Custo Mínimo
```typescript
// SEMPRE aplicar isto:
CustoPorGrau_Final = Math.max(1, CustoPorGrau_Final);
CustoPdA_Total = Math.max(1, CustoPdA_Total);
```

### RN-06: Mudança de Parâmetros
```typescript
// Exemplo: Mudar ação de Padrão (1) para Livre (3)
const modificadorPorGrau = 3 - 1; // +2 PdA/grau

// Exemplo: Reduzir alcance de Distância (2) para Corpo-a-corpo (1)
const modificadorPorGrau = 1 - 2; // -1 PdA/grau (Falha)
```

---

## ✏️ Como Adicionar Novos Dados

### Novo Efeito
1. Abra `efeitos.json`
2. Adicione um novo objeto no array
3. Defina `id` único (kebab-case)
4. Configure `custoBase` e `parametrosPadrao`
5. Adicione categorias e exemplos

### Nova Modificação
1. Abra `modificacoes.json`
2. Determine se é `"extra"` ou `"falha"`
3. Se precisar de input do usuário:
   - `requerParametros: true`
   - Defina `tipoParametro` e `placeholder`
4. Configure custos (`custoFixo` e/ou `custoPorGrau`)

---

## 🎯 Próximos Passos

Com os JSONs prontos, você pode:
1. Implementar a lógica de cálculo (`calculadoraCusto.js`)
2. Criar o hook `usePoderCalculator`
3. Construir o componente `<CriadorDePoder />`
4. Testar com os dados reais!
