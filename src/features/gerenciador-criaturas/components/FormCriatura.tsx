import { useState, useMemo, useRef } from 'react';
import { Plus, AlertCircle, RotateCcw, Move } from 'lucide-react';
import { Modal, ModalFooter, Button, Input, Slider, Badge, ConfirmDialog } from '../../../shared/ui';
import { PreviewStats } from './PreviewStats';
import { AttributeSelector } from './AttributeSelector';
import { SaveSelector } from './SaveSelector';
import { SkillSelector } from './SkillSelector';
import { calculateCreatureStatsV2 } from '../hooks/calculateCreatureStatsV2';
import { getRoleDistribution } from '../data/constants';
import { 
  useCreatureCalculator, 
  useCreatureBossMechanics,
  useCreatureValidation,
  getAllRoles,
  getRoleTemplate,
} from '../index';
import type { CreatureFormInput, CreatureRole } from '../types';

interface FormCriaturaProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreatureFormInput) => void;
  initialData?: Partial<CreatureFormInput>;
  mode?: 'create' | 'edit';
}

/**
 * FormCriatura
 * 
 * Modal para criar ou editar uma criatura.
 * Calcula stats em tempo real e mostra preview.
 */
export function FormCriatura({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
}: FormCriaturaProps) {
  // Form State - usar initialData como base inicial
  const [formData, setFormData] = useState<Partial<CreatureFormInput>>(() => ({
    name: '',
    level: 1,
    role: 'Padrao',
    sovereigntyMultiplier: 10,
    sovereignty: 1, // Padrão para Elite
    rdOverride: undefined,
    speedOverride: 9,
    color: undefined,
    notes: '',
    attributeDistribution: undefined,
    saveDistribution: undefined,
    selectedSkills: [],
    ...initialData,
  }));

  // Estado para posição da imagem (object-position)
  const [imagePosition, setImagePosition] = useState(
    initialData?.imagePosition ?? { x: 50, y: 50 }
  );

  const [showResetDialog, setShowResetDialog] = useState(false);

  // Rastrear role anterior para detectar mudanças
  const previousRole = useRef(formData.role);

  // Validação
  const errors = useCreatureValidation(formData);
  
  // Validação de distribuições - considera a role (Lacaio não tem major)
  const hasValidDistributions = useMemo(() => {
    if (!formData.attributeDistribution || !formData.saveDistribution) return false;
    
    const roleDistribution = getRoleDistribution(formData.role || 'Padrao');
    const attrDist = formData.attributeDistribution;
    const saveDist = formData.saveDistribution;
    
    // Verificar se preencheu os slots de atributos
    const hasValidAttrs = 
      attrDist.major.length === roleDistribution.attrs[0] &&
      attrDist.medium.length === roleDistribution.attrs[1] &&
      attrDist.minor.length === roleDistribution.attrs[2];
    
    // Verificar se preencheu os slots de resistências
    const hasValidSaves = 
      saveDist.strong.length === roleDistribution.saves[0] &&
      saveDist.medium.length === roleDistribution.saves[1] &&
      saveDist.weak.length === roleDistribution.saves[2];
    
    return hasValidAttrs && hasValidSaves;
  }, [formData.attributeDistribution, formData.saveDistribution, formData.role]);
  
  const isValid = errors.length === 0 && 
                  formData.name && 
                  formData.level && 
                  formData.role &&
                  hasValidDistributions;

  // Calcular stats em tempo real
  const stats = useCreatureCalculator(formData as CreatureFormInput);
  const bossMechanics = useCreatureBossMechanics(
    formData.role || 'Padrao'
  );

  // Calcular stats V2 se tiver distribuições
  const statsV2 = useMemo(() => {
    if (!formData.attributeDistribution || !formData.saveDistribution || !formData.level || !formData.role) {
      return null;
    }
    
    try {
      return calculateCreatureStatsV2({
        name: formData.name || '',
        level: formData.level,
        role: formData.role,
        attributeDistribution: formData.attributeDistribution,
        saveDistribution: formData.saveDistribution,
        selectedSkills: formData.selectedSkills || [],
        sovereigntyMultiplier: formData.sovereigntyMultiplier,
        rdOverride: formData.rdOverride,
        speedOverride: formData.speedOverride,
      });
    } catch (error) {
      console.error('Erro ao calcular stats V2:', error);
      return null;
    }
  }, [
    formData.name,
    formData.level,
    formData.role,
    formData.attributeDistribution,
    formData.saveDistribution,
    formData.selectedSkills,
    formData.sovereigntyMultiplier,
    formData.rdOverride,
    formData.speedOverride,
  ]);

  // Template da role selecionada
  const roleTemplate = useMemo(() => {
    return formData.role ? getRoleTemplate(formData.role) : null;
  }, [formData.role]);

  // Handler: Atualizar campo
  const updateField = <K extends keyof CreatureFormInput>(
    field: K,
    value: CreatureFormInput[K]
  ) => {
    setFormData(prev => {
      // Se mudou o role, resetar distribuições e ajustar sovereignty
      if (field === 'role' && value !== previousRole.current) {
        previousRole.current = value as CreatureRole;
        
        // Definir sovereignty padrão baseado na role
        let defaultSovereignty = 1;
        if (value === 'Elite') {
          defaultSovereignty = 1; // Elite: 1 ação extra
        } else if (value === 'ChefeSolo') {
          defaultSovereignty = 3; // Chefe Solo: 3 ações extras
        }
        
        return {
          ...prev,
          [field]: value,
          sovereignty: defaultSovereignty,
          attributeDistribution: undefined,
          saveDistribution: undefined,
          selectedSkills: [],
        };
      }
      return { ...prev, [field]: value };
    });
  };

  // Handler: Submit
  const handleSubmit = () => {
    if (!isValid || !formData.name || !formData.level || !formData.role) return;

    onSubmit({
      name: formData.name,
      level: formData.level,
      role: formData.role,
      sovereigntyMultiplier: formData.sovereigntyMultiplier,
      sovereignty: formData.sovereignty,
      rdOverride: formData.rdOverride,
      speedOverride: formData.speedOverride,
      color: formData.color,
      notes: formData.notes,
      imageUrl: formData.imageUrl,
      imagePosition: formData.imageUrl ? imagePosition : undefined, // Só salvar se tiver imagem
      attributeDistribution: formData.attributeDistribution,
      saveDistribution: formData.saveDistribution,
      selectedSkills: formData.selectedSkills,
    });

    onClose();
  };

  // Handler: Reset
  const handleReset = () => {
    setShowResetDialog(true);
  };

  const confirmReset = () => {
    setFormData({
      name: '',
      level: 1,
      role: 'Padrao',
      sovereigntyMultiplier: 10,
      sovereignty: 1,
      rdOverride: undefined,
      speedOverride: 9,
      color: undefined,
      notes: '',
      attributeDistribution: undefined,
      saveDistribution: undefined,
      selectedSkills: [],
    });
    setShowResetDialog(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Criar Criatura' : 'Editar Criatura'}
      size="xl"
    >
      <div className="space-y-6">
        {/* Informações Básicas */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome da Criatura *
            </label>
            <Input
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Ex: Goblin Guerreiro"
              maxLength={50}
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Anotações sobre a criatura..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-espirito-500 focus:border-transparent"
            />
          </div>

          {/* URL da Imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Imagem (URL ou Base64) - Opcional
            </label>
            <Input
              value={formData.imageUrl || ''}
              onChange={(e) => updateField('imageUrl', e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg ou data:image/png;base64,..."
              maxLength={10000}
            />
            {formData.imageUrl && (
              <div className="mt-2 space-y-2">
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                    style={{ objectPosition: `${imagePosition.x}% ${imagePosition.y}%` }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const errorMsg = e.currentTarget.nextElementSibling as HTMLElement;
                      if (errorMsg) errorMsg.style.display = 'block';
                    }}
                  />
                  <div className="hidden p-3 text-center text-sm text-red-600 dark:text-red-400">
                    ❌ Erro ao carregar imagem
                  </div>
                </div>
                
                {/* Controles de Posição */}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Move className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Ajustar Enquadramento</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">Horizontal: {imagePosition.x}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={imagePosition.x}
                        onChange={(e) => setImagePosition(prev => ({ ...prev, x: Number(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400">Vertical: {imagePosition.y}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={imagePosition.y}
                        onChange={(e) => setImagePosition(prev => ({ ...prev, y: Number(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={() => setImagePosition({ x: 50, y: 50 })}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-espirito-600 dark:hover:text-espirito-400"
                    >
                      Resetar posição
                    </button>
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Cole uma URL de imagem ou converta para Base64
            </p>
          </div>

          {/* Nível */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nível: <span className="text-espirito-600 dark:text-espirito-400 font-bold">{formData.level}</span>
            </label>
            <Slider
              min={1}
              max={250}
              value={formData.level || 1}
              onChange={(value) => updateField('level', value)}
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Nível 1</span>
              <span>Nível 250</span>
            </div>
          </div>

          {/* Função/Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Função *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {getAllRoles().map((role) => {
                const template = getRoleTemplate(role);
                const isSelected = formData.role === role;

                return (
                  <button
                    key={role}
                    onClick={() => updateField('role', role)}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-left
                      ${isSelected 
                        ? 'border-espirito-500 bg-espirito-50 dark:bg-espirito-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <span className="font-bold text-sm mb-1 block text-gray-900 dark:text-gray-100">{template.name}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {template.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Descrição da role selecionada */}
            {roleTemplate && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {roleTemplate.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" size="sm">
                    PV ×{roleTemplate.pvMultiplier}
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    PE ×{roleTemplate.peMultiplier}
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    Dano ×{roleTemplate.damageMultiplier}
                  </Badge>
                  {roleTemplate.isBoss && (
                    <Badge variant="warning" size="sm">
                      Chefe
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* V2: Distribuições Dinâmicas */}
          {formData.role && (
            <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              {/* Atributos */}
              <AttributeSelector
                role={formData.role}
                value={formData.attributeDistribution}
                onChange={(dist) => updateField('attributeDistribution', dist)}
              />

              {/* Resistências */}
              <SaveSelector
                role={formData.role}
                value={formData.saveDistribution}
                onChange={(dist) => updateField('saveDistribution', dist)}
              />

              {/* Perícias */}
              <SkillSelector
                value={formData.selectedSkills || []}
                onChange={(skills) => updateField('selectedSkills', skills)}
              />
            </div>
          )}

          {/* Chefe Solo: Multiplicador de PV */}
          {formData.role === 'ChefeSolo' && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Multiplicador de PV (Chefe Solo): <span className="text-yellow-600 font-bold">{formData.sovereigntyMultiplier}x</span>
              </label>
              <Slider
                min={10}
                max={15}
                step={0.5}
                value={formData.sovereigntyMultiplier || 10}
                onChange={(value) => updateField('sovereigntyMultiplier', value)}
              />
              <p className="text-xs text-gray-500 mt-2">
                Ajuste baseado no tamanho do grupo de jogadores
              </p>
            </div>
          )}

          {/* Elite e Chefe Solo: Soberania (Ações Extras) */}
          {(formData.role === 'Elite' || formData.role === 'ChefeSolo') && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 rounded">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Soberania (Ações Extras): <span className="text-purple-600 font-bold">{formData.sovereignty || 1}</span>
              </label>
              <Slider
                min={1}
                max={5}
                step={1}
                value={formData.sovereignty || 1}
                onChange={(value) => updateField('sovereignty', value)}
              />
              <p className="text-xs text-gray-500 mt-2">
                {formData.role === 'Elite' 
                  ? 'Elite: geralmente 1 ação extra'
                  : 'Chefe Solo: 3+ ações extras recomendado'}
              </p>
            </div>
          )}

          {/* Overrides Manuais (Opcional) */}
          <details className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-sm text-gray-700 dark:text-gray-300">
              Ajustes Manuais (Opcional)
            </summary>
            <div className="mt-4 space-y-3">
              <Input
                type="number"
                label="RD (Redução de Dano)"
                value={formData.rdOverride ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : undefined;
                  updateField('rdOverride', val !== undefined ? Math.max(0, val) : undefined);
                }}
                placeholder="0"
                min={0}
              />
              <Input
                type="number"
                label="Deslocamento (metros)"
                value={formData.speedOverride ?? 9}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : 9;
                  updateField('speedOverride', Math.max(0, val));
                }}
                placeholder="9"
                min={0}
              />
            </div>
          </details>
        </div>

        {/* Preview de Stats */}
        <div>
          <h3 className="font-bold text-sm text-gray-500 uppercase mb-3">Preview dos Stats</h3>
          <PreviewStats stats={stats} statsV2={statsV2} bossMechanics={bossMechanics} />
        </div>

        {/* Erros de Validação */}
        {(errors.length > 0 || !hasValidDistributions) && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200 mb-1">
                  Corrija os erros abaixo:
                </p>
                <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {!hasValidDistributions && (
                    <>
                      {!formData.attributeDistribution?.major.length && (
                        <li>Selecione a distribuição de atributos</li>
                      )}
                      {!formData.saveDistribution?.strong.length && (
                        <li>Selecione a distribuição de resistências</li>
                      )}
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <div className="flex items-center justify-between w-full">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Resetar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!isValid}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {mode === 'create' ? 'Criar Criatura' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </ModalFooter>

      {/* Dialog de Confirmação para Reset */}
      <ConfirmDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={confirmReset}
        title="Resetar Formulário"
        message="Tem certeza que deseja limpar todos os campos? Todas as informações não salvas serão perdidas."
        confirmText="Resetar"
        cancelText="Cancelar"
        variant="warning"
      />
    </Modal>
  );
}
