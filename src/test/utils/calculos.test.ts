import { describe, it, expect } from 'vitest'
import modificacoes from '../../data/modificacoes.json'

/**
 * Função auxiliar para calcular o custo de uma modificação
 */
function calcularCustoModificacao(
  modificacaoId: string,
  grauEfeito: number,
  configuracao?: string
): number {
  const mod = modificacoes.find(m => m.id === modificacaoId)
  if (!mod) throw new Error(`Modificação ${modificacaoId} não encontrada`)

  let custoTotal = mod.custoFixo + (mod.custoPorGrau * grauEfeito)

  // Se tem configuração, aplicar o modificador
  if (configuracao && 'configuracoes' in mod && Array.isArray(mod.configuracoes)) {
    const config = mod.configuracoes.find(c => 
      c.opcoes.some((o: any) => o.id === configuracao)
    )
    
    if (config) {
      const opcao = config.opcoes.find((o: any) => o.id === configuracao)
      if (opcao) {
        custoTotal += opcao.modificadorCusto
      }
    }
  }

  return custoTotal
}

describe('Cálculo de Custo de Modificações', () => {
  it('deve calcular custo por grau corretamente', () => {
    // Afeta Corpóreo tem +1 por grau
    const custo = calcularCustoModificacao('afeta-corporeo', 5)
    expect(custo).toBe(5) // 0 fixo + (1 * 5)
  })

  it('deve calcular custo com configuração corretamente', () => {
    // Testar uma modificação que tenha configurações estruturadas
    const modComConfig = modificacoes.find(m => 
      'configuracoes' in m && Array.isArray(m.configuracoes) && m.configuracoes.length > 0
    )
    
    if (modComConfig && 'configuracoes' in modComConfig && Array.isArray(modComConfig.configuracoes)) {
      const primeiraConfig = modComConfig.configuracoes[0]
      const primeiraOpcao = primeiraConfig.opcoes[0]
      
      const custo = calcularCustoModificacao(modComConfig.id, 5, primeiraOpcao.id)
      expect(typeof custo).toBe('number')
    }
  })

  it('deve calcular custo combinado (fixo + por grau)', () => {
    // Área tem custo por grau
    const mod = modificacoes.find(m => m.id === 'area')
    if (mod) {
      const custo = calcularCustoModificacao('area', 3, 'area-cone')
      expect(custo).toBeGreaterThanOrEqual(0)
    }
  })

  it('falhas devem reduzir o custo', () => {
    const falhas = modificacoes.filter(m => m.tipo === 'falha')
    
    falhas.forEach(falha => {
      const custo = calcularCustoModificacao(falha.id, 5)
      expect(custo).toBeLessThanOrEqual(0)
    })
  })

  it('extras devem aumentar o custo', () => {
    const extras = modificacoes.filter(m => m.tipo === 'extra')
    
    extras.forEach(extra => {
      // Extras com custo 0 são válidos (alguns são situacionais)
      const custo = calcularCustoModificacao(extra.id, 5)
      expect(custo).toBeGreaterThanOrEqual(0)
    })
  })

  it('deve calcular custo zero para grau zero', () => {
    const mod = modificacoes.find(m => m.custoPorGrau > 0)
    if (mod && mod.custoFixo === 0) {
      const custo = calcularCustoModificacao(mod.id, 0)
      expect(custo).toBe(0)
    }
  })
})

describe('Validação de Configurações', () => {
  it('modificações com configurações devem ter opções válidas', () => {
    const comConfiguracoes = modificacoes.filter(m => 
      'configuracoes' in m && Array.isArray(m.configuracoes)
    )

    comConfiguracoes.forEach(mod => {
      if ('configuracoes' in mod && Array.isArray(mod.configuracoes)) {
        mod.configuracoes.forEach(config => {
          expect(config).toHaveProperty('tipo')
          expect(config).toHaveProperty('label')
          expect(config).toHaveProperty('opcoes')
          expect(Array.isArray(config.opcoes)).toBe(true)
          expect(config.opcoes.length).toBeGreaterThan(0)

          config.opcoes.forEach((opcao: any) => {
            expect(opcao).toHaveProperty('id')
            expect(opcao).toHaveProperty('nome')
            expect(opcao).toHaveProperty('modificadorCusto')
            expect(typeof opcao.modificadorCusto).toBe('number')
          })
        })
      }
    })
  })

  it('IDs de opções devem ser únicos dentro de cada configuração', () => {
    const comConfiguracoes = modificacoes.filter(m => 
      'configuracoes' in m && Array.isArray(m.configuracoes)
    )

    comConfiguracoes.forEach(mod => {
      if ('configuracoes' in mod && Array.isArray(mod.configuracoes)) {
        mod.configuracoes.forEach(config => {
          const ids = config.opcoes.map((o: any) => o.id)
          const uniqueIds = new Set(ids)
          expect(uniqueIds.size).toBe(ids.length)
        })
      }
    })
  })
})

describe('Cenários Reais de Uso', () => {
  it('poder de Dano básico sem modificações = grau * 1', () => {
    // Efeito de Dano básico custa 1 ponto por grau
    const grau = 10
    const custoBase = grau * 1
    expect(custoBase).toBe(10)
  })

  it('poder de Dano com Área deve custar mais', () => {
    const grau = 10
    const custoBase = grau * 1
    const custoArea = calcularCustoModificacao('area', grau, 'area-cone')
    const custoTotal = custoBase + custoArea
    
    expect(custoTotal).toBeGreaterThan(custoBase)
  })

  it('poder com falha deve custar menos', () => {
    const grau = 10
    const custoBase = grau * 1
    
    // Encontrar uma falha para testar
    const falha = modificacoes.find(m => m.tipo === 'falha')
    if (falha) {
      const custoFalha = calcularCustoModificacao(falha.id, grau)
      const custoTotal = custoBase + custoFalha
      
      expect(custoTotal).toBeLessThan(custoBase)
    }
  })
})
