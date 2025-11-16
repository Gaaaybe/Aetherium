import { describe, it, expect } from 'vitest'
import modificacoes from '../../data/modificacoes.json'

describe('Validação dos Dados de Modificações', () => {
  it('deve ter pelo menos 100 modificações', () => {
    expect(modificacoes.length).toBeGreaterThanOrEqual(100)
  })

  it('todas as modificações devem ter ID único', () => {
    const ids = modificacoes.map(m => m.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(modificacoes.length)
  })

  it('todas as modificações devem ter campos obrigatórios', () => {
    modificacoes.forEach(mod => {
      expect(mod).toHaveProperty('id')
      expect(mod).toHaveProperty('nome')
      expect(mod).toHaveProperty('tipo')
      expect(mod).toHaveProperty('custoFixo')
      expect(mod).toHaveProperty('custoPorGrau')
      expect(mod).toHaveProperty('descricao')
      expect(mod).toHaveProperty('categoria')
      
      // Validar tipos
      expect(typeof mod.id).toBe('string')
      expect(typeof mod.nome).toBe('string')
      expect(['extra', 'falha']).toContain(mod.tipo)
      expect(typeof mod.custoFixo).toBe('number')
      expect(typeof mod.custoPorGrau).toBe('number')
      expect(typeof mod.descricao).toBe('string')
      expect(typeof mod.categoria).toBe('string')
    })
  })

  it('extras devem ter custo positivo ou zero', () => {
    const extras = modificacoes.filter(m => m.tipo === 'extra')
    extras.forEach(extra => {
      expect(extra.custoFixo).toBeGreaterThanOrEqual(0)
      expect(extra.custoPorGrau).toBeGreaterThanOrEqual(0)
    })
  })

  it('falhas devem ter custo negativo ou zero', () => {
    const falhas = modificacoes.filter(m => m.tipo === 'falha')
    falhas.forEach(falha => {
      expect(falha.custoFixo).toBeLessThanOrEqual(0)
      expect(falha.custoPorGrau).toBeLessThanOrEqual(0)
    })
  })

  it('modificações com parâmetros devem ter configurações ou opções', () => {
    const comParametros = modificacoes.filter(m => m.requerParametros)
    comParametros.forEach(mod => {
      // Se requer parâmetros, deve ter configurações, opcoes, ou tipoParametro
      const temConfiguracoes = 'configuracoes' in mod && Array.isArray(mod.configuracoes) && mod.configuracoes.length > 0
      const temOpcoes = 'opcoes' in mod && Array.isArray(mod.opcoes) && mod.opcoes.length > 0
      const temTipoParametro = 'tipoParametro' in mod && typeof mod.tipoParametro === 'string'
      
      expect(temConfiguracoes || temOpcoes || temTipoParametro).toBe(true)
    })
  })

  it('deve ter pelo menos 20 categorias diferentes', () => {
    const categorias = new Set(modificacoes.map(m => m.categoria))
    expect(categorias.size).toBeGreaterThanOrEqual(20)
  })

  it('nomes devem começar com letra maiúscula', () => {
    modificacoes.forEach(mod => {
      const primeiraLetra = mod.nome.charAt(0)
      expect(primeiraLetra).toBe(primeiraLetra.toUpperCase())
    })
  })

  it('descrições não devem estar vazias', () => {
    modificacoes.forEach(mod => {
      expect(mod.descricao.trim().length).toBeGreaterThan(10)
    })
  })
})

describe('Categorias de Modificações', () => {
  it('deve listar todas as categorias existentes', () => {
    const categorias = [...new Set(modificacoes.map(m => m.categoria))].sort()
    expect(categorias.length).toBeGreaterThan(0)
    
    // Log para visualizar (útil durante desenvolvimento)
    console.log('Categorias encontradas:', categorias.length)
    categorias.forEach(cat => {
      const count = modificacoes.filter(m => m.categoria === cat).length
      console.log(`  - ${cat}: ${count} modificações`)
    })
  })

  it('categoria Combate deve ter modificações', () => {
    const combate = modificacoes.filter(m => m.categoria === 'Combate')
    expect(combate.length).toBeGreaterThan(0)
  })
})
