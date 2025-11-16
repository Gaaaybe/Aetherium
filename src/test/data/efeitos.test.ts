import { describe, it, expect } from 'vitest'
import efeitos from '../../data/efeitos.json'

describe('Validação dos Dados de Efeitos', () => {
  it('deve ter pelo menos 30 efeitos', () => {
    expect(efeitos.length).toBeGreaterThanOrEqual(30)
  })

  it('todos os efeitos devem ter ID único', () => {
    const ids = efeitos.map(e => e.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(efeitos.length)
  })

  it('todos os efeitos devem ter campos obrigatórios', () => {
    efeitos.forEach(efeito => {
      expect(efeito).toHaveProperty('id')
      expect(efeito).toHaveProperty('nome')
      expect(efeito).toHaveProperty('custoBase')
      expect(efeito).toHaveProperty('descricao')
      expect(efeito).toHaveProperty('parametrosPadrao')
      expect(efeito).toHaveProperty('categorias')
      
      // Validar tipos
      expect(typeof efeito.id).toBe('string')
      expect(typeof efeito.nome).toBe('string')
      expect(typeof efeito.custoBase).toBe('number')
      expect(typeof efeito.descricao).toBe('string')
      expect(typeof efeito.parametrosPadrao).toBe('object')
      expect(Array.isArray(efeito.categorias)).toBe(true)
    })
  })

  it('custo base deve ser positivo', () => {
    efeitos.forEach(efeito => {
      expect(efeito.custoBase).toBeGreaterThan(0)
    })
  })

  it('nomes devem começar com letra maiúscula', () => {
    efeitos.forEach(efeito => {
      const primeiraLetra = efeito.nome.charAt(0)
      expect(primeiraLetra).toBe(primeiraLetra.toUpperCase())
    })
  })

  it('descrições não devem estar vazias', () => {
    efeitos.forEach(efeito => {
      expect(efeito.descricao.trim().length).toBeGreaterThan(10)
    })
  })

  it('parametrosPadrao deve ter acao, alcance e duracao', () => {
    efeitos.forEach(efeito => {
      expect(efeito.parametrosPadrao).toHaveProperty('acao')
      expect(efeito.parametrosPadrao).toHaveProperty('alcance')
      expect(efeito.parametrosPadrao).toHaveProperty('duracao')
      
      expect(typeof efeito.parametrosPadrao.acao).toBe('number')
      expect(typeof efeito.parametrosPadrao.alcance).toBe('number')
      expect(typeof efeito.parametrosPadrao.duracao).toBe('number')
    })
  })

  it('categorias deve ser um array não vazio', () => {
    efeitos.forEach(efeito => {
      expect(Array.isArray(efeito.categorias)).toBe(true)
      expect(efeito.categorias.length).toBeGreaterThan(0)
    })
  })
})

describe('Categorias dos Efeitos', () => {
  it('deve ter categorias válidas', () => {
    const todasCategorias = new Set<string>()
    
    efeitos.forEach(efeito => {
      efeito.categorias.forEach(cat => {
        todasCategorias.add(cat)
      })
    })
    
    expect(todasCategorias.size).toBeGreaterThan(5)
    
    console.log('Categorias de efeitos encontradas:', Array.from(todasCategorias).sort())
  })

  it('categoria Ataque deve existir', () => {
    const temAtaque = efeitos.some(e => e.categorias.includes('Ataque'))
    expect(temAtaque).toBe(true)
  })
})
