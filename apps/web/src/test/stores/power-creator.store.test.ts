import { describe, it, expect, beforeEach } from 'vitest';
import { usePowerCreatorStore } from '@/stores/power-creator.store';

describe('usePowerCreatorStore', () => {
  beforeEach(() => {
    usePowerCreatorStore.getState().resetarPoder();
  });

  it('deve adicionar, atualizar e remover modificações locais de um efeito', () => {
    const store = usePowerCreatorStore.getState();
    
    // Adiciona efeito de teste
    store.adicionarEfeito('efeito-1', []);
    const efeito = usePowerCreatorStore.getState().poder.efeitos[0];
    expect(efeito).toBeDefined();
    
    // Adiciona modificação local
    store.adicionarModificacaoLocal(efeito.id, 'mod-1', { grau: 2, descricao: 'Original' });
    
    let mod = usePowerCreatorStore.getState().poder.efeitos[0].modificacoesLocais[0];
    expect(mod).toBeDefined();
    expect(mod.modificacaoBaseId).toBe('mod-1');
    expect(mod.grauModificacao).toBe(2);
    expect(mod.parametros?.descricao).toBe('Original');
    
    // Atualiza modificação local
    store.atualizarModificacaoLocal(efeito.id, mod.id, { grau: 4, descricao: 'Editado' });
    
    mod = usePowerCreatorStore.getState().poder.efeitos[0].modificacoesLocais[0];
    expect(mod.grauModificacao).toBe(4);
    expect(mod.parametros?.descricao).toBe('Editado');
    
    // Remove modificação local
    store.removerModificacaoLocal(efeito.id, mod.id);
    expect(usePowerCreatorStore.getState().poder.efeitos[0].modificacoesLocais.length).toBe(0);
  });

  it('deve adicionar, atualizar e remover modificações globais do poder', () => {
    const store = usePowerCreatorStore.getState();
    
    // Adiciona modificação global
    store.adicionarModificacaoGlobal('mod-g1', { grau: 1, descricao: 'Global Original' });
    
    let mod = usePowerCreatorStore.getState().poder.modificacoesGlobais[0];
    expect(mod).toBeDefined();
    expect(mod.modificacaoBaseId).toBe('mod-g1');
    expect(mod.grauModificacao).toBe(1);
    expect(mod.parametros?.descricao).toBe('Global Original');
    
    // Atualiza modificação global
    store.atualizarModificacaoGlobal(mod.id, { grau: 3, descricao: 'Global Editado' });
    
    mod = usePowerCreatorStore.getState().poder.modificacoesGlobais[0];
    expect(mod.grauModificacao).toBe(3);
    expect(mod.parametros?.descricao).toBe('Global Editado');
    
    // Remove modificação global
    store.removerModificacaoGlobal(mod.id);
    expect(usePowerCreatorStore.getState().poder.modificacoesGlobais.length).toBe(0);
  });
});
