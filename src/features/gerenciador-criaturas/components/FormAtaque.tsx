import { useState } from 'react';
import { Modal, ModalFooter, Button, Input, Select } from '../../../shared/ui';
import type { CreatureAttack, DamageType, AttackRangeType } from '../types';

interface FormAtaqueProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (attack: Omit<CreatureAttack, 'id'>) => void;
  initialData?: CreatureAttack;
  mode?: 'create' | 'edit';
}

const DAMAGE_TYPES: { value: DamageType; label: string }[] = [
  { value: 'cortante', label: 'Corte' },
  { value: 'perfurante', label: 'Perfuração' },
  { value: 'contundente', label: 'Impacto' },
  { value: 'fogo', label: 'Fogo' },
  { value: 'gelo', label: 'Gelo' },
  { value: 'eletrico', label: 'Elétrico' },
  { value: 'acido', label: 'Ácido' },
  { value: 'veneno', label: 'Veneno' },
  { value: 'necrotico', label: 'Necrótico' },
  { value: 'radiante', label: 'Radiante' },
  { value: 'psiquico', label: 'Psíquico' },
  { value: 'trovao', label: 'Trovão' },
  { value: 'energia', label: 'Energia' },
];

const RANGE_TYPES: { value: AttackRangeType; label: string }[] = [
  { value: 'adjacente', label: 'Adjacente' },
  { value: 'natural', label: 'Natural' },
  { value: 'curto', label: 'À Distância (Curto)' },
  { value: 'medio', label: 'À Distância (Médio)' },
  { value: 'longo', label: 'À Distância (Longo)' },
  { value: 'variavel', label: 'Variável' },
];

export function FormAtaque({ isOpen, onClose, onSubmit, initialData, mode = 'create' }: FormAtaqueProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    damage: initialData?.damage || '',
    damageType: initialData?.damageType || 'cortante' as DamageType,
    criticalRange: initialData?.criticalRange || 20,
    criticalMultiplier: initialData?.criticalMultiplier || 2,
    rangeType: initialData?.range?.type || 'adjacente' as AttackRangeType,
    additionalMeters: initialData?.range?.additionalMeters || 0,
    effect: initialData?.effect || '',
  });

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      range: {
        type: formData.rangeType,
        additionalMeters: formData.additionalMeters > 0 ? formData.additionalMeters : undefined,
      },
    });
    onClose();
    setFormData({
      name: '',
      damage: '',
      damageType: 'cortante',
      criticalRange: 20,
      criticalMultiplier: 2,
      rangeType: 'adjacente',
      additionalMeters: 0,
      effect: '',
    });
  };

  const isValid = formData.name.trim() && formData.damage.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Adicionar Ataque' : 'Editar Ataque'}
      size="md"
    >
      <div className="space-y-4 py-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome do Ataque
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Garras, Mordida, Lança Longa..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dano (Dados)
            </label>
            <Input
              value={formData.damage}
              onChange={(e) => setFormData({ ...formData, damage: e.target.value })}
              placeholder="Ex: 2d6, 3d8+4"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Formato: XdY ou XdY+Z
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Dano
            </label>
            <Select
              value={formData.damageType}
              onChange={(e) => setFormData({ ...formData, damageType: e.target.value as DamageType })}
              options={DAMAGE_TYPES}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Taxa de Crítico
            </label>
            <Input
              type="number"
              min={1}
              max={20}
              value={formData.criticalRange}
              onChange={(e) => setFormData({ ...formData, criticalRange: parseInt(e.target.value) || 20 })}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.criticalRange === 20 ? 'Apenas 20' : `${formData.criticalRange}-20`}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Multiplicador de Crítico
            </label>
            <Input
              type="number"
              min={2}
              max={5}
              value={formData.criticalMultiplier}
              onChange={(e) => setFormData({ ...formData, criticalMultiplier: parseInt(e.target.value) || 2 })}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              x{formData.criticalMultiplier}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Alcance
            </label>
            <Select
              value={formData.rangeType}
              onChange={(e) => setFormData({ ...formData, rangeType: e.target.value as AttackRangeType })}
              options={RANGE_TYPES}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Metros Adicionais
            </label>
            <Input
              type="number"
              min={0}
              value={formData.additionalMeters}
              onChange={(e) => setFormData({ ...formData, additionalMeters: parseInt(e.target.value) || 0 })}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.additionalMeters > 0 ? `+${formData.additionalMeters}m` : 'Padrão'}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Efeito Adicional (Opcional)
          </label>
          <textarea
            value={formData.effect}
            onChange={(e) => setFormData({ ...formData, effect: e.target.value })}
            placeholder="Ex: Alvo deve fazer teste de Fortitude CD 15 ou ficar envenenado..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-espirito-500 dark:focus:ring-espirito-400 focus:border-transparent
                     resize-none"
            rows={3}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Futuramente será vinculado a um poder
          </p>
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid}>
          {mode === 'create' ? 'Adicionar' : 'Salvar'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
