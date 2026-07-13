import { useEffect, useMemo, useState } from 'react';
import { Package, Save, RefreshCw, Link2, Sword, Shield, FlaskConical, FileText, Plus, Eye, Sparkles, BookOpen, Hammer, Box, Trash2 } from 'lucide-react';
import { DOMINIOS } from '@/data';
import { usePeculiaridades } from '@/shared/hooks/usePeculiaridades';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Textarea, Badge, toast, Tooltip, DynamicIcon, ConfirmDialog } from '@/shared/ui';
import { usePoderes } from '@/features/criador-de-poder/hooks/usePoderes';
import { usePowerArrays } from '@/features/criador-de-poder/hooks/usePowerArrays';
import { useItemBuilder } from '../hooks/useItemBuilder';
import { useItems } from '../hooks/useItems';
import { useItemCreatorStore } from '@/stores/item-creator.store';
import { SeletorVinculosModal } from './SeletorVinculosModal';
import { ResumoItem } from './ResumoItem';
import { ResumoVinculoModal } from './ResumoVinculoModal';
import type { ItemResponse, ItemType, UpdateItemPayload, DomainName } from '@/services/types';
import { UPGRADE_PATAMARES, type UpgradePatamarId } from '../hooks/useItemBuilder';

function ItemTypeIcon({ tipo }: { tipo: ItemType }) {
  if (tipo === 'weapon') return <Sword className="w-4 h-4" />;
  if (tipo === 'defensive-equipment') return <Shield className="w-4 h-4" />;
  if (tipo === 'consumable') return <FlaskConical className="w-4 h-4" />;
  if (tipo === 'upgrade-material') return <Hammer className="w-4 h-4" />;
  if (tipo === 'general') return <Box className="w-4 h-4" />;
  return <Package className="w-4 h-4" />;
}

const BASE_PRESETS = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'] as const;
const BASE_CUSTOM_VALUE = '__custom__';

export function CriadorDeItem({
  itemInicial,
  onSaved,
  poderesAdicionais,
  acervosAdicionais,
}: {
  itemInicial?: ItemResponse;
  onSaved?: (item: ItemResponse) => void;
  poderesAdicionais?: any[];
  acervosAdicionais?: any[];
}) {
  const { criar, atualizar, loading } = useItems();
  const { poderes } = usePoderes();
  const { acervos } = usePowerArrays();
  const { peculiaridades } = usePeculiaridades();

  const poderesCompletos = useMemo(() => {
    const list = [...poderes];
    if (poderesAdicionais) {
      for (const p of poderesAdicionais) {
        if (!list.some((existing) => existing.id === p.id)) {
          list.push(p);
        }
      }
    }
    return list;
  }, [poderes, poderesAdicionais]);

  const acervosCompletos = useMemo(() => {
    const list = [...acervos];
    if (acervosAdicionais) {
      for (const a of acervosAdicionais) {
        if (!list.some((existing) => existing.id === a.id)) {
          list.push(a);
        }
      }
    }
    return list;
  }, [acervos, acervosAdicionais]);

  const [salvando, setSalvando] = useState(false);
  const [modalPoderesAberto, setModalPoderesAberto] = useState(false);
  const [modalAcervosAberto, setModalAcervosAberto] = useState(false);
  const [modalResumoAberto, setModalResumoAberto] = useState(false);
  const [poderResumoId, setPoderResumoId] = useState<string | null>(null);
  const [acervoResumoId, setAcervoResumoId] = useState<string | null>(null);
  const [confirmarReset, setConfirmarReset] = useState(false);

  const {
    state,
    updateField,
    addDomain,
    removeDomain,
    updateDomain,
    setTipo,
    togglePower,
    togglePowerArray,
    updateWeaponDamage,
    addWeaponDamage,
    removeWeaponDamage,
    updateWeaponField,
    updateDefensiveField,
    updateConsumableField,
    setUpgradeMaterialPatamar,
    hydrateFromItem,
    getValidationErrors,
    buildPayload,
    reset,
  } = useItemBuilder();


  useEffect(() => {
    const rawTemplate = localStorage.getItem('criador-de-item-template');
    const raw = localStorage.getItem('criador-de-item-carregar');

    if (itemInicial) {
      hydrateFromItem(itemInicial);
    } else if (rawTemplate) {
      try {
        const item = JSON.parse(rawTemplate) as ItemResponse;
        hydrateFromItem(item, true); // true = asTemplate
        toast.success(`Template de "${item.nome}" carregado.`);
      } catch {
        toast.error('Erro ao carregar o template.');
      } finally {
        // Remove de forma assíncrona para permitir que a montagem dupla do Strict Mode encontre o item
        setTimeout(() => {
          localStorage.removeItem('criador-de-item-template');
        }, 100);
      }
    } else if (raw) {
      try {
        const item = JSON.parse(raw) as ItemResponse;
        hydrateFromItem(item);
        toast.success(`Item "${item.nome}" carregado para edição.`);
      } catch {
        toast.error('Não foi possível carregar o item selecionado.');
      } finally {
        // Remove de forma assíncrona para permitir que a montagem dupla do Strict Mode encontre o item
        setTimeout(() => {
          localStorage.removeItem('criador-de-item-carregar');
        }, 100);
      }
    } else {
      // Se não há item inicial nem no localstorage, mas o Zustand tem um editingItemId (UUID)
      // de uma sessão anterior, reseta para começar limpo
      const currentEditingId = useItemCreatorStore.getState().state.editingItemId;
      const isApiId = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(currentEditingId || '');
      if (isApiId) {
        reset();
      }
    }

    // Cleanup ao desmontar
    return () => {
      const currentEditingId = useItemCreatorStore.getState().state.editingItemId;
      const isApiId = /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(currentEditingId || '');
      const isLeavingPage = !window.location.pathname.includes('/criador');
      if (isApiId && isLeavingPage) {
        reset();
      }
    };
  }, [itemInicial, hydrateFromItem, reset]);

  const dominiosAtuais = useMemo(() => state.dominios.map((d) => d.name), [state.dominios]);

  const poderesCompativeis = useMemo(
    () => poderesCompletos.filter((p) => dominiosAtuais.includes(p.dominio.name)),
    [poderesCompletos, dominiosAtuais],
  );

  const acervosCompativeis = useMemo(
    () => acervosCompletos.filter((a) => dominiosAtuais.includes(a.dominio.name)),
    [acervosCompletos, dominiosAtuais],
  );

  const poderesSelecionados = useMemo(
    () => poderesCompletos.filter((poder) => state.powerIds.includes(poder.id)),
    [poderesCompletos, state.powerIds],
  );

  const acervosSelecionados = useMemo(
    () => acervosCompletos.filter((acervo) => state.powerArrayIds.includes(acervo.id)),
    [acervosCompletos, state.powerArrayIds],
  );

  const poderResumoSelecionado = useMemo(
    () => (poderResumoId ? poderesCompletos.find((poder) => poder.id === poderResumoId) : undefined),
    [poderResumoId, poderesCompletos],
  );

  const acervoResumoSelecionado = useMemo(
    () => (acervoResumoId ? acervosCompletos.find((acervo) => acervo.id === acervoResumoId) : undefined),
    [acervoResumoId, acervosCompletos],
  );

  const nivelCalculado = useMemo(() => {
    const somaPoderes = poderesCompletos
      .filter((poder) => state.powerIds.includes(poder.id))
      .reduce(
        (total, poder) =>
          total + poder.effects.reduce((powerTotal, effect) => powerTotal + effect.grau, 0),
        0,
      );

    const somaAcervos = acervosCompletos
      .filter((acervo) => state.powerArrayIds.includes(acervo.id))
      .reduce(
        (total, acervo) =>
          total +
          acervo.powers.reduce(
            (arrayTotal, poder) =>
              arrayTotal + poder.effects.reduce((powerTotal, effect) => powerTotal + effect.grau, 0),
            0,
          ),
        0,
      );

    return Math.max(1, somaPoderes + somaAcervos);
  }, [acervosCompletos, poderesCompletos, state.powerArrayIds, state.powerIds]);

  const custoRealCalculado = useMemo(
    () => state.custoBase * nivelCalculado,
    [nivelCalculado, state.custoBase],
  );

  const precoVendaCalculado = useMemo(
    () => Math.floor(custoRealCalculado / 2),
    [custoRealCalculado],
  );

  const salvarItem = async () => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    setSalvando(true);
    try {
      const payload = buildPayload();
      if (state.editingItemId) {
        const updated = await atualizar(state.editingItemId, payload as UpdateItemPayload);
        hydrateFromItem(updated);
        toast.success(`Item "${updated.nome}" atualizado com sucesso!`);
        if (onSaved) onSaved(updated);
      } else {
        const item = await criar(payload);
        toast.success(`Item "${item.nome}" criado com sucesso!`);
        reset();
        if (onSaved) onSaved(item);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao salvar item. Verifique os campos e tente novamente.';
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" /> Criador de Itens
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Nível: {nivelCalculado}</Badge>
              <Badge variant="secondary">Custo Real: {custoRealCalculado}</Badge>
              <Badge variant="secondary">Venda: {precoVendaCalculado}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome"
              value={state.nome}
              onChange={(e) => updateField('nome', e.target.value)}
              placeholder="Ex: Espada Solar"
              maxLength={100}
              helperText={`${state.nome.length}/100 caracteres`}
            />
            <Select
              label="Tipo de Item"
              value={state.tipo}
              onChange={(e) => setTipo(e.target.value as typeof state.tipo)}
              options={[
                { value: 'weapon', label: 'Arma' },
                { value: 'defensive-equipment', label: 'Equipamento Defensivo' },
                { value: 'consumable', label: 'Consumível' },
                { value: 'artifact', label: 'Artefato' },
                { value: 'accessory', label: 'Acessório' },
                { value: 'general', label: 'Item Geral' },
                { value: 'upgrade-material', label: 'Material de Upgrade' },
              ]}
              placeholder=""
            />
          </div>

          <Textarea
            label="Descrição"
            value={state.descricao}
            onChange={(e) => updateField('descricao', e.target.value)}
            rows={3}
            placeholder="Descreva o item e sua função..."
            maxLength={1000}
            helperText={`${state.descricao.length}/1000 caracteres`}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Custo Base"
              type="number"
              min={0}
              value={state.custoBase}
              onChange={(e) => updateField('custoBase', Number(e.target.value || 0))}
            />
            <Input
              label="Ícone (URL)"
              value={state.icone}
              onChange={(e) => updateField('icone', e.target.value)}
              placeholder="https://..."
            />
            <Input
              label="Nível Calculado"
              value={String(nivelCalculado)}
              readOnly
              helperText="Soma dos graus de todos os efeitos dos poderes e acervos vinculados. Sem vínculos, nível 1."
            />
          </div>

          {/* Domínios do Item */}
          <div className="space-y-4 border border-gray-100 dark:border-gray-800 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-900/10">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Domínios ({state.dominios.length})
              </h4>
              {state.dominios.length < 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addDomain({ name: 'natural' })}
                  className="flex items-center gap-1.5 h-8 text-xs font-bold text-espirito-600 dark:text-espirito-400 border-espirito-200 dark:border-espirito-800 hover:bg-espirito-50 dark:hover:bg-espirito-900/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Domínio
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {state.dominios.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Nenhum domínio selecionado. Este item não terá domínio vinculado.
                </p>
              )}
              {state.dominios.map((dom, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50 space-y-3 relative group"
                >
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Select
                        label={`Domínio #${idx + 1}`}
                        value={dom.name}
                        onChange={(e) =>
                          updateDomain(idx, {
                            name: e.target.value as DomainName,
                            areaConhecimento: undefined,
                            peculiarId: undefined,
                          })
                        }
                        options={DOMINIOS.map((dominio) => ({
                          value: dominio.id,
                          label: dominio.nome,
                        }))}
                        placeholder=""
                      />
                    </div>
                    {state.dominios.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeDomain(idx)}
                        className="h-10 px-3 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                        title="Remover este domínio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {dom.name === 'cientifico' && (
                    <Select
                      label="Área de Conhecimento"
                      value={dom.areaConhecimento ?? ''}
                      onChange={(e) => updateDomain(idx, { areaConhecimento: e.target.value })}
                      options={(
                        DOMINIOS.find((d) => d.id === 'cientifico')?.areasConhecimento ?? []
                      ).map((area) => ({ value: area, label: area }))}
                      placeholder="Selecione a área"
                    />
                  )}

                  {dom.name === 'peculiar' && (
                    <Select
                      label="Peculiaridade"
                      value={dom.peculiarId ?? ''}
                      onChange={(e) => updateDomain(idx, { peculiarId: e.target.value })}
                      options={peculiaridades.map((p) => ({ value: p.id, label: p.nome }))}
                      placeholder="Selecione a peculiaridade"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Notas"
              value={state.notas}
              onChange={(e) => updateField('notas', e.target.value)}
              placeholder="Notas opcionais do item"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is-public-item"
              type="checkbox"
              checked={state.isPublic}
              onChange={(e) => updateField('isPublic', e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="is-public-item" className="text-sm text-gray-700 dark:text-gray-300">
              Publicar item para a comunidade
            </label>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Domínios atuais:</span> {state.dominios.map((d) => DOMINIOS.find((dom) => dom.id === d.name)?.nome ?? d.name).join(', ')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Apenas poderes e acervos com domínio compatível com algum dos selecionados podem ser vinculados.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              `Upgrade Level` de armas e equipamentos defensivos é separado do nível do item e começa em 0.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ItemTypeIcon tipo={state.tipo} /> Configurações por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.tipo === 'weapon' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Danos</p>
                  <Button size="sm" variant="outline" onClick={addWeaponDamage}>Adicionar Dano</Button>
                </div>
                {state.weapon.danos.map((dano, index) => {
                  const baseNormalizada = dano.base.trim().toUpperCase();
                  const isBasePreset = BASE_PRESETS.includes(baseNormalizada as (typeof BASE_PRESETS)[number]);
                  const baseSelectValue = isBasePreset ? baseNormalizada : BASE_CUSTOM_VALUE;

                  return (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end border-b border-gray-100 dark:border-gray-800 pb-3 md:pb-0 md:border-0">
                    <Input
                      label="Dado"
                      value={dano.dado}
                      onChange={(e) => updateWeaponDamage(index, 'dado', e.target.value)}
                      placeholder="1d8"
                    />
                    <div className="space-y-2">
                      <Select
                        label="Base"
                        value={baseSelectValue}
                        onChange={(e) => {
                          const nextValue = e.target.value;
                          if (nextValue === BASE_CUSTOM_VALUE) {
                            updateWeaponDamage(index, 'base', isBasePreset ? '' : dano.base);
                            return;
                          }

                          updateWeaponDamage(index, 'base', nextValue);
                        }}
                        options={[
                          ...BASE_PRESETS.map((base) => ({ value: base, label: base })),
                          { value: BASE_CUSTOM_VALUE, label: 'Personalizado' },
                        ]}
                        placeholder=""
                      />
                      {baseSelectValue === BASE_CUSTOM_VALUE ? (
                        <Input
                          label="Base Personalizada"
                          value={dano.base}
                          onChange={(e) => updateWeaponDamage(index, 'base', e.target.value)}
                          placeholder="Ex: FOR x2"
                        />
                      ) : null}
                    </div>
                    <Input
                      label="Tipo de Dano"
                      value={dano.tipoDano ?? ''}
                      onChange={(e) => updateWeaponDamage(index, 'tipoDano', e.target.value)}
                      placeholder="Ex: Corte, Impacto..."
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 h-10">
                      <input
                        type="checkbox"
                        checked={dano.espiritual}
                        onChange={(e) => updateWeaponDamage(index, 'espiritual', e.target.checked)}
                      />
                      Espiritual
                    </label>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => removeWeaponDamage(index)}
                      disabled={state.weapon.danos.length === 1}
                      className="w-full md:w-auto"
                    >
                      Remover
                    </Button>
                  </div>
                )})}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  label="Margem Crítico"
                  type="number"
                  min={2}
                  max={20}
                  value={state.weapon.critMargin}
                  onChange={(e) => updateWeaponField('critMargin', Number(e.target.value || 20))}
                />
                <Input
                  label="Multiplicador"
                  type="number"
                  min={1}
                  max={7}
                  value={state.weapon.critMultiplier}
                  onChange={(e) => updateWeaponField('critMultiplier', Number(e.target.value || 2))}
                />
                <Select
                  label="Alcance"
                  value={state.weapon.alcance}
                  onChange={(e) => updateWeaponField('alcance', e.target.value)}
                  options={[
                    { value: 'adjacente', label: 'Adjacente' },
                    { value: 'natural', label: 'Natural' },
                    { value: 'curto', label: 'Curto' },
                    { value: 'medio', label: 'Médio' },
                    { value: 'longo', label: 'Longo' },
                  ]}
                  placeholder=""
                />
                <Input
                  label="Extra Natural (m)"
                  type="number"
                  min={0}
                  step={0.5}
                  value={state.weapon.alcanceExtraMetros}
                  onChange={(e) =>
                    updateWeaponField('alcanceExtraMetros', Number(e.target.value || 0))
                  }
                  disabled={state.weapon.alcance !== 'natural'}
                  helperText={
                    state.weapon.alcance === 'natural'
                      ? 'Use incrementos de 0,5m para estender o alcance natural.'
                      : 'Disponível apenas para armas de alcance natural.'
                  }
                />
                <Input
                  label="Atributo Escalonamento"
                  value={state.weapon.atributoEscalonamento}
                  onChange={(e) => updateWeaponField('atributoEscalonamento', e.target.value)}
                  placeholder="FOR, DES..."
                />
                  <Input
                    label="Upgrade Inicial"
                    type="number"
                    min={0}
                    max={7}
                    value={state.weapon.upgradeLevel}
                    onChange={(e) => updateWeaponField('upgradeLevel', Number(e.target.value || 0))}
                    disabled={!!state.editingItemId} // Trava de regra de negócio
                    helperText={!!state.editingItemId ? "Upgrade só pode ser alterado na criação (Regra de Negócio)" : "0 a 7"}
                  />
              </div>
            </>
          )}

          {state.tipo === 'defensive-equipment' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select
                label="Tipo Equipamento"
                value={state.defensive.tipoEquipamento}
                onChange={(e) => updateDefensiveField('tipoEquipamento', e.target.value)}
                options={[
                  { value: 'protecao', label: 'Proteção' },
                  { value: 'traje', label: 'Traje' },
                ]}
                placeholder=""
              />
              <Input
                label="RD Base"
                type="number"
                min={1}
                value={state.defensive.baseRD}
                onChange={(e) => updateDefensiveField('baseRD', Number(e.target.value || 1))}
              />
              <Input
                label="Atributo Escalonamento"
                value={state.defensive.atributoEscalonamento}
                onChange={(e) => updateDefensiveField('atributoEscalonamento', e.target.value)}
                placeholder="CON, DES..."
              />
              <Input
                label="Upgrade Inicial"
                type="number"
                min={0}
                max={9}
                value={state.defensive.upgradeLevel}
                onChange={(e) => updateDefensiveField('upgradeLevel', Number(e.target.value || 0))}
                disabled={!!state.editingItemId} // Trava de regra de negócio
                helperText={!!state.editingItemId ? "Upgrade só pode ser alterado na criação (Regra de Negócio)" : "0 a 9"}
              />
            </div>
          )}

          {state.tipo === 'consumable' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Descritor do Efeito"
                value={state.consumable.descritorEfeito}
                onChange={(e) => updateConsumableField('descritorEfeito', e.target.value)}
                placeholder="Recupera 2d6 PV"
              />
              <Input
                label="Quantidade de Doses"
                type="number"
                min={1}
                value={state.consumable.qtdDoses}
                onChange={(e) => updateConsumableField('qtdDoses', Number(e.target.value || 1))}
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 h-10 mt-6">
                <input
                  type="checkbox"
                  checked={state.consumable.isRefeicao}
                  onChange={(e) => updateConsumableField('isRefeicao', e.target.checked)}
                />
                É refeição
              </label>
            </div>
          )}

          {(state.tipo === 'artifact' || state.tipo === 'accessory' || state.tipo === 'general') && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Este tipo não requer campos extras obrigatórios. Você já pode vincular poderes/acervos e salvar.
            </p>
          )}

          {state.tipo === 'upgrade-material' && (() => {
            const patamar = UPGRADE_PATAMARES.find((p) => p.id === state.upgradeMaterial.patamarId);
            return (
              <div className="space-y-3">
                <Select
                  label="Patamar do Material"
                  value={String(state.upgradeMaterial.patamarId)}
                  onChange={(e) => setUpgradeMaterialPatamar(Number(e.target.value) as UpgradePatamarId)}
                  options={UPGRADE_PATAMARES.map((p) => ({
                    value: String(p.id),
                    label: `${p.nome} (até ${p.maxUpgradeLimit}x · ${p.custoBase.toLocaleString('pt-BR')}R)`,
                  }))}
                  placeholder=""
                />
                {patamar && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm space-y-1">
                    <p className="font-semibold text-amber-800 dark:text-amber-300">ᚱ {patamar.nome}</p>
                    <p className="text-amber-700 dark:text-amber-400">
                      Permite aprimorar até <strong>{patamar.maxUpgradeLimit}x</strong> · Custo sugerido: <strong>{patamar.custoBase.toLocaleString('pt-BR')} ᚱ</strong>
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      O custo base foi atualizado automaticamente. Ajuste-o acima se necessário.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="w-4 h-4" /> Poderes Vinculados ({state.powerIds.length})
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setModalPoderesAberto(true)}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {poderesSelecionados.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum poder vinculado ainda.</p>
            ) : (
              poderesSelecionados.map((poder) => (
                <div key={poder.id} className="flex items-start justify-between gap-2 p-2 rounded border border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setPoderResumoId(poder.id)}
                    className="min-w-0 flex items-start gap-2 text-left flex-1"
                  >
                    <div className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center">
                      {poder.icone ? (
                        <DynamicIcon name={poder.icone} className="w-full h-full" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{poder.nome}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{poder.descricao}</p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setPoderResumoId(poder.id)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => togglePower(poder.id)}>Remover</Button>
                  </div>
                </div>
              ))
            )}

            {poderesCompativeis.length === 0 && (
              <p className="text-sm text-gray-500">Nenhum poder compatível com o domínio atual.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="w-4 h-4" /> Acervos Vinculados ({state.powerArrayIds.length})
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setModalAcervosAberto(true)}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {acervosSelecionados.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum acervo vinculado ainda.</p>
            ) : (
              acervosSelecionados.map((acervo) => (
                <div key={acervo.id} className="flex items-start justify-between gap-2 p-2 rounded border border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setAcervoResumoId(acervo.id)}
                    className="min-w-0 flex items-start gap-2 text-left flex-1"
                  >
                    <div className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center">
                      {acervo.icone ? (
                        <DynamicIcon name={acervo.icone} className="w-full h-full" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{acervo.nome}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{acervo.descricao}</p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setAcervoResumoId(acervo.id)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => togglePowerArray(acervo.id)}>Remover</Button>
                  </div>
                </div>
              ))
            )}

            {acervosCompativeis.length === 0 && (
              <p className="text-sm text-gray-500">Nenhum acervo compatível com o domínio atual.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setConfirmarReset(true)}>
                <RefreshCw className="w-4 h-4 mr-1" /> {state.editingItemId ? 'Cancelar Edição' : 'Resetar'}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Tooltip content="Ver resumo completo do item atual">
                <Button
                  variant="outline"
                  onClick={() => setModalResumoAberto(true)}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Resumo
                </Button>
              </Tooltip>
              <Button onClick={salvarItem} loading={salvando} disabled={loading}>
                <Save className="w-4 h-4 mr-1" /> {state.editingItemId ? 'Atualizar Item' : 'Salvar Item'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <SeletorVinculosModal
        isOpen={modalPoderesAberto}
        onClose={() => setModalPoderesAberto(false)}
        title="Vincular Poderes"
        emptyText="Nenhum poder encontrado para este domínio."
        options={poderesCompativeis.map((poder) => ({
          id: poder.id,
          nome: poder.nome,
          descricao: poder.descricao,
          dominio: poder.dominio.name,
          icone: poder.icone,
        }))}
        selectedIds={state.powerIds}
        onToggle={togglePower}
        onOpenDetails={(id) => setPoderResumoId(id)}
      />

      <SeletorVinculosModal
        isOpen={modalAcervosAberto}
        onClose={() => setModalAcervosAberto(false)}
        title="Vincular Acervos"
        emptyText="Nenhum acervo encontrado para este domínio."
        options={acervosCompativeis.map((acervo) => ({
          id: acervo.id,
          nome: acervo.nome,
          descricao: acervo.descricao,
          dominio: acervo.dominio.name,
          icone: acervo.icone,
        }))}
        selectedIds={state.powerArrayIds}
        onToggle={togglePowerArray}
        onOpenDetails={(id) => setAcervoResumoId(id)}
      />

      <ResumoItem
        isOpen={modalResumoAberto}
        onClose={() => setModalResumoAberto(false)}
        tipo={state.tipo}
        nome={state.nome.trim()}
        icone={state.icone.trim()}
        descricao={state.descricao.trim()}
        dominios={state.dominios}
        custoBase={state.custoBase}
        nivelCalculado={nivelCalculado}
        custoRealCalculado={custoRealCalculado}
        precoVendaCalculado={precoVendaCalculado}
        selectedPowers={poderesSelecionados}
        selectedPowerArrays={acervosSelecionados}
        onOpenPowerDetails={(id) => setPoderResumoId(id)}
        onOpenPowerArrayDetails={(id) => setAcervoResumoId(id)}
      />

      <ResumoVinculoModal
        isOpen={!!poderResumoSelecionado || !!acervoResumoSelecionado}
        onClose={() => {
          setPoderResumoId(null);
          setAcervoResumoId(null);
        }}
        poder={poderResumoSelecionado}
        acervo={acervoResumoSelecionado}
      />

      <ConfirmDialog
        isOpen={confirmarReset}
        onClose={() => setConfirmarReset(false)}
        onConfirm={() => {
          reset();
          setConfirmarReset(false);
          toast.info(state.editingItemId ? 'Edição cancelada.' : 'Formulário resetado.');
        }}
        title={state.editingItemId ? 'Cancelar Edição' : 'Resetar Formulário'}
        message={state.editingItemId ? 'Tem certeza que deseja cancelar a edição? Todas as alterações não salvas serão perdidas.' : 'Tem certeza que deseja limpar todo o formulário? Esta ação não pode ser desfeita.'}
        variant="warning"
        confirmText={state.editingItemId ? 'Sim, cancelar' : 'Sim, resetar'}
      />
    </div>
  );
}
