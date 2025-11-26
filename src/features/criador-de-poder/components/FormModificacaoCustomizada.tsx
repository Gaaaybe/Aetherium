import { useState } from 'react';
import { Modal, Button, Input } from '../../../shared/ui';
import type { Modificacao } from '../../../data';

interface FormModificacaoCustomizadaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (modificacao: Omit<Modificacao, 'custom'>) => void;
  modificacaoInicial?: Modificacao; // Para edição
}

export function FormModificacaoCustomizada({
  isOpen,
  onClose,
  onSave,
  modificacaoInicial,
}: FormModificacaoCustomizadaProps) {
  const [formData, setFormData] = useState<Omit<Modificacao, 'custom'>>(() => ({
    id: modificacaoInicial?.id || `custom-mod-${Date.now()}`,
    nome: modificacaoInicial?.nome || '',
    tipo: modificacaoInicial?.tipo || 'extra',
    custoFixo: modificacaoInicial?.custoFixo || 0,
    custoPorGrau: modificacaoInicial?.custoPorGrau || 0,
    descricao: modificacaoInicial?.descricao || '',
    requerParametros: modificacaoInicial?.requerParametros || false,
    categoria: modificacaoInicial?.categoria || 'geral',
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      alert('Nome é obrigatório');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        modificacaoInicial
          ? '✏️ Editar Modificação Customizada'
          : '🔧 Criar Modificação Customizada'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 📝 Informações Básicas */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            📝 Informações Básicas
          </h3>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Nome *
            </label>
            <Input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome da modificação"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Tipo *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) =>
                setFormData({ ...formData, tipo: e.target.value as 'extra' | 'falha' })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="extra">✨ Extra (aumenta custo)</option>
              <option value="falha">⚠️ Falha (reduz custo)</option>
            </select>
          </div>
        </div>

        {/* 💰 Custos */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            💰 Custos
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Custo Fixo (PdA)
              </label>
              <Input
                type="number"
                value={formData.custoFixo}
                onChange={(e) =>
                  setFormData({ ...formData, custoFixo: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Custo por Grau (PdA)
              </label>
              <Input
                type="number"
                value={formData.custoPorGrau}
                onChange={(e) =>
                  setFormData({ ...formData, custoPorGrau: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </div>

        {/* 📄 Descrição */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            📄 Descrição
          </h3>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Descrição da modificação *
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva como a modificação afeta o poder..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]"
              required
            />
          </div>
        </div>

        {/* 🏷️ Categoria */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            🏷️ Categoria
          </h3>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Categoria
            </label>
            <Input
              type="text"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              placeholder="geral, alcance, dano, etc."
            />
          </div>
        </div>

        {/* ⚙️ Configurações */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            ⚙️ Configurações
          </h3>
          
          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requerParametros"
                checked={formData.requerParametros}
                onChange={(e) =>
                  setFormData({ ...formData, requerParametros: e.target.checked })
                }
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="requerParametros" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                📝 Requer parâmetros adicionais
              </label>
            </div>
          </div>

          {/* Observações */}
          {formData.requerParametros && (
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                💡 Observações sobre parâmetros
              </label>
              <textarea
                value={formData.observacoes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                placeholder="Descreva quais parâmetros serão necessários..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[60px]"
              />
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-4">
          <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            {modificacaoInicial ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
