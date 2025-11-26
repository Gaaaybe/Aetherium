import { useState } from 'react';
import { Modal, Button, Input } from '../../../shared/ui';
import type { Efeito } from '../../../data';

interface FormEfeitoCustomizadoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (efeito: Omit<Efeito, 'custom'>) => void;
  efeitoInicial?: Efeito; // Para edição
}

export function FormEfeitoCustomizado({
  isOpen,
  onClose,
  onSave,
  efeitoInicial,
}: FormEfeitoCustomizadoProps) {
  const [formData, setFormData] = useState<Omit<Efeito, 'custom'>>(() => ({
    id: efeitoInicial?.id || `custom-efeito-${Date.now()}`,
    nome: efeitoInicial?.nome || '',
    custoBase: efeitoInicial?.custoBase || 1,
    descricao: efeitoInicial?.descricao || '',
    parametrosPadrao: efeitoInicial?.parametrosPadrao || {
      acao: 1,
      alcance: 0,
      duracao: 0,
    },
    categorias: efeitoInicial?.categorias || [],
    exemplos: efeitoInicial?.exemplos || '',
    custoProgressivo: efeitoInicial?.custoProgressivo || false,
  }));

  const [novaCategoria, setNovaCategoria] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      alert('Nome é obrigatório');
      return;
    }
    onSave(formData);
    onClose();
  };

  const adicionarCategoria = () => {
    if (novaCategoria.trim() && !formData.categorias.includes(novaCategoria.trim())) {
      setFormData({
        ...formData,
        categorias: [...formData.categorias, novaCategoria.trim()],
      });
      setNovaCategoria('');
    }
  };

  const removerCategoria = (categoria: string) => {
    setFormData({
      ...formData,
      categorias: formData.categorias.filter((c) => c !== categoria),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={efeitoInicial ? '✏️ Editar Efeito Customizado' : '✨ Criar Efeito Customizado'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium mb-1">Nome *</label>
          <Input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Nome do efeito"
            required
          />
        </div>

        {/* Custo Base */}
        <div>
          <label className="block text-sm font-medium mb-1">Custo Base (PdA) *</label>
          <Input
            type="number"
            value={formData.custoBase}
            onChange={(e) =>
              setFormData({ ...formData, custoBase: Number(e.target.value) })
            }
            min={0}
            required
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium mb-1">Descrição *</label>
          <textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Descrição do efeito"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]"
            required
          />
        </div>

        {/* Parâmetros Padrão */}
        <div>
          <label className="block text-sm font-medium mb-2">⚙️ Parâmetros Padrão</label>
          <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ação</label>
            <Input
              type="number"
              value={formData.parametrosPadrao.acao}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parametrosPadrao: {
                    ...formData.parametrosPadrao,
                    acao: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Alcance</label>
            <Input
              type="number"
              value={formData.parametrosPadrao.alcance}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parametrosPadrao: {
                    ...formData.parametrosPadrao,
                    alcance: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Duração</label>
            <Input
              type="number"
              value={formData.parametrosPadrao.duracao}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parametrosPadrao: {
                    ...formData.parametrosPadrao,
                    duracao: Number(e.target.value),
                  },
                })
              }
            />
          </div>
        </div>
        </div>

        {/* Categorias */}
        <div>
          <label className="block text-sm font-medium mb-2">🏷️ Categorias</label>
          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              placeholder="Nova categoria"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  adicionarCategoria();
                }
              }}
            />
            <Button
              type="button"
              onClick={adicionarCategoria}
              variant="secondary"
              size="sm"
              className="shrink-0"
            >
              ➕ Adicionar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.categorias.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 
                         dark:text-purple-300 rounded-full text-sm flex items-center gap-2"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => removerCategoria(cat)}
                  className="hover:text-red-600 dark:hover:text-red-400"
                  aria-label={`Remover categoria ${cat}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Exemplos */}
        <div>
          <label className="block text-sm font-medium mb-2">💡 Exemplos de Uso</label>
          <textarea
            value={formData.exemplos}
            onChange={(e) => setFormData({ ...formData, exemplos: e.target.value })}
            placeholder="Exemplos de uso (opcional)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[60px]"
          />
        </div>

        {/* Custo Progressivo */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="custoProgressivo"
              checked={formData.custoProgressivo || false}
              onChange={(e) =>
                setFormData({ ...formData, custoProgressivo: e.target.checked })
              }
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="custoProgressivo" className="text-sm font-medium">
              📈 Custo progressivo (aumenta com o grau)
            </label>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-4">
          <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            {efeitoInicial ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
