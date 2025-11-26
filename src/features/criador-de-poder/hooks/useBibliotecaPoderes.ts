import { useLocalStorage } from '../../../shared/hooks';
import { Poder } from '../regras/calculadoraCusto';
import type { PoderSalvo } from '../types';

export function useBibliotecaPoderes() {
  const [poderes, setPoderes] = useLocalStorage<PoderSalvo[]>('biblioteca-poderes', []);

  // Salvar ou atualizar um poder
  const salvarPoder = (poder: Poder) => {
    const agora = new Date().toISOString();
    
    // Verifica se já existe um poder com esse ID na biblioteca
    const poderExistente = poderes.find((p: PoderSalvo) => p.id === poder.id);
    
    if (poderExistente) {
      // Atualiza o poder existente
      setPoderes((prev: PoderSalvo[]) => 
        prev.map((p: PoderSalvo) => 
          p.id === poder.id 
            ? { ...poder, id: poder.id, dataCriacao: p.dataCriacao, dataModificacao: agora }
            : p
        )
      );
      return { ...poder, dataCriacao: poderExistente.dataCriacao, dataModificacao: agora } as PoderSalvo;
    } else {
      // Cria um novo poder
      const poderSalvo: PoderSalvo = {
        ...poder,
        id: poder.id || Date.now().toString(),
        dataCriacao: agora,
        dataModificacao: agora,
      };

      setPoderes((prev: PoderSalvo[]) => [...prev, poderSalvo]);
      return poderSalvo;
    }
  };

  // Atualizar um poder existente
  const atualizarPoder = (id: string, poder: Poder) => {
    setPoderes((prev: PoderSalvo[]) => 
      prev.map((p: PoderSalvo) => 
        p.id === id 
          ? { ...poder, id, dataCriacao: p.dataCriacao, dataModificacao: new Date().toISOString() }
          : p
      )
    );
  };

  // Deletar um poder
  const deletarPoder = (id: string) => {
    setPoderes((prev: PoderSalvo[]) => prev.filter((p: PoderSalvo) => p.id !== id));
  };

  // Buscar um poder por ID
  const buscarPoder = (id: string): PoderSalvo | undefined => {
    return poderes.find((p: PoderSalvo) => p.id === id);
  };

  // Duplicar um poder
  const duplicarPoder = (id: string) => {
    const poderOriginal = buscarPoder(id);
    if (!poderOriginal) return;

    const agora = new Date().toISOString();
    const poderDuplicado: PoderSalvo = {
      ...poderOriginal,
      id: Date.now().toString(),
      nome: `${poderOriginal.nome} (Cópia)`,
      dataCriacao: agora,
      dataModificacao: agora,
    };

    setPoderes((prev: PoderSalvo[]) => [...prev, poderDuplicado]);
    return poderDuplicado;
  };

  // Exportar como JSON
  const exportarPoder = (id: string) => {
    const poder = buscarPoder(id);
    if (!poder) return;

    const dataStr = JSON.stringify(poder, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `${poder.nome.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Importar de JSON
  const importarPoder = (jsonString: string) => {
    try {
      const poder = JSON.parse(jsonString) as Poder;
      const agora = new Date().toISOString();
      const poderImportado: PoderSalvo = {
        ...poder,
        id: Date.now().toString(),
        dataCriacao: agora,
        dataModificacao: agora,
      };

      setPoderes((prev: PoderSalvo[]) => [...prev, poderImportado]);
      return poderImportado;
    } catch (error) {
      console.error('Erro ao importar poder:', error);
      throw new Error('JSON inválido');
    }
  };

  return {
    poderes,
    salvarPoder,
    atualizarPoder,
    deletarPoder,
    buscarPoder,
    duplicarPoder,
    exportarPoder,
    importarPoder,
  };
}
