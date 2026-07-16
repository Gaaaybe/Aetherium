import { useEffect, useMemo, useState } from 'react';
import { Package, Save, RefreshCw, Link2, Sword, Shield, FlaskConical, FileText, Plus, Eye, Sparkles, BookOpen, Hammer, Box, Trash2, Tag, Bookmark, Coins, Scale } from 'lucide-react';
import { DOMINIOS } from '@/data';
import { usePeculiaridades } from '@/shared/hooks/usePeculiaridades';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Textarea, toast, DynamicIcon, ConfirmDialog } from '@/shared/ui';
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
    <div className="space-y-6 pb-24">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-900/20 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Package className="w-6 h-6 animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {state.editingItemId ? 'Editar Item' : 'Criador de Itens'}
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {state.editingItemId ? `Editando o item existente no banco de dados` : 'Crie e configure um novo item personalizado para o sistema'}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/30 text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Nível {nivelCalculado}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30 text-sm font-semibold">
            <Coins className="w-4 h-4" />
            <span>Custo: {custoRealCalculado} ᚱ</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 text-sm font-semibold">
            <Scale className="w-4 h-4" />
            <span>Venda: {precoVendaCalculado} ᚱ</span>
          </div>
        </div>
      </div>

      <Card className="border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/30 dark:bg-gray-900/10 border-b border-gray-100 dark:border-gray-800/80">
          <CardTitle className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            1. Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Nome */}
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Nome do Item"
              value={state.nome}
              onChange={(e) => updateField('nome', e.target.value)}
              placeholder="Ex: Espada Solar"
              maxLength={100}
              helperText={`${state.nome.length}/100 caracteres`}
            />
          </div>

          {/* Chips de tipo de item */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Tipo de Item</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {[
                { value: 'weapon', label: 'Arma', icon: Sword },
                { value: 'defensive-equipment', label: 'Defesa', icon: Shield },
                { value: 'consumable', label: 'Consumível', icon: FlaskConical },
                { value: 'artifact', label: 'Artefato', icon: Sparkles },
                { value: 'accessory', label: 'Acessório', icon: Tag },
                { value: 'general', label: 'Item Geral', icon: Box },
                { value: 'upgrade-material', label: 'Material', icon: Hammer },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = state.tipo === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTipo(t.value as typeof state.tipo)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 group relative ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 shadow-md shadow-purple-500/5 ring-1 ring-purple-500/30'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 transition-transform duration-200 group-hover:scale-110 ${
                      isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <span className="text-xs font-bold whitespace-nowrap">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descrição */}
          <Textarea
            label="Descrição"
            value={state.descricao}
            onChange={(e) => updateField('descricao', e.target.value)}
            rows={3}
            placeholder="Descreva o item, sua função e efeitos mecânicos..."
            maxLength={1000}
            helperText={`${state.descricao.length}/1000 caracteres`}
          />

          {/* Custo Base, Ícone URL, Notas, Is Public */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Input
                label="Custo Base (R)"
                type="number"
                min={0}
                value={state.custoBase}
                onChange={(e) => updateField('custoBase', Number(e.target.value || 0))}
              />
              <Input
                label="Ícone (URL da imagem)"
                value={state.icone}
                onChange={(e) => updateField('icone', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-4">
              <Input
                label="Notas Internas / Opcionais"
                value={state.notas}
                onChange={(e) => updateField('notas', e.target.value)}
                placeholder="Notas de Lore ou detalhes adicionais"
              />
              
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="space-y-0.5">
                  <label htmlFor="is-public-item" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                    Publicar na Comunidade
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Permite que outros usem este item.
                  </p>
                </div>
                <button
                  id="is-public-item"
                  type="button"
                  onClick={() => updateField('isPublic', !state.isPublic)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    state.isPublic ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      state.isPublic ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Domínios do Item */}
          <div className="space-y-4 border border-purple-100 dark:border-purple-900/20 p-5 rounded-2xl bg-purple-50/10 dark:bg-purple-950/5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  Domínios Vinculados
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Associe domínios ao item para restringir ou permitir poderes compatíveis.
                </p>
              </div>
              {state.dominios.length < 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addDomain({ name: 'natural' })}
                  className="flex items-center gap-1.5 h-8 text-xs font-bold text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Domínio
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {state.dominios.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic py-2">
                  Nenhum domínio selecionado. Este item não terá domínio vinculado.
                </p>
              )}
              {state.dominios.map((dom, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-purple-100 dark:border-purple-900/30 rounded-xl bg-white dark:bg-gray-900/60 shadow-sm space-y-3 relative group hover:border-purple-200 dark:hover:border-purple-950/60 transition-all duration-200"
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
                        className="h-10 w-10 !p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 rounded-lg border border-transparent hover:border-red-100 dark:hover:border-red-900/20"
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
        </CardContent>
      </Card>

      <Card className="border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/30 dark:bg-gray-900/10 border-b border-gray-100 dark:border-gray-800/80">
          <CardTitle className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <ItemTypeIcon tipo={state.tipo} /> 2. Configurações por Tipo ({state.tipo === 'weapon' ? 'Arma' : state.tipo === 'defensive-equipment' ? 'Equipamento Defensivo' : state.tipo === 'consumable' ? 'Consumível' : state.tipo === 'upgrade-material' ? 'Material de Upgrade' : 'Padrão'})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {state.tipo === 'weapon' && (
            <div className="space-y-6">
              {/* Seção de Danos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-850 pb-2">
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Fórmulas de Dano</h4>
                    <p className="text-xs text-gray-500">Configure os dados, bases de atributos e tipos de dano da arma.</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={addWeaponDamage} className="flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Adicionar Dano
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {state.weapon.danos.map((dano, index) => {
                    const baseNormalizada = dano.base.trim().toUpperCase();
                    const isBasePreset = BASE_PRESETS.includes(baseNormalizada as (typeof BASE_PRESETS)[number]);
                    const baseSelectValue = isBasePreset ? baseNormalizada : BASE_CUSTOM_VALUE;

                    return (
                      <div 
                        key={index} 
                        className="flex flex-col md:flex-row md:items-end gap-3 p-4 rounded-xl border border-gray-200/30 dark:border-gray-800/40 bg-gray-50/20 dark:bg-gray-900/10 relative group hover:border-gray-300/40 dark:hover:border-gray-700/40 transition-all duration-200"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                          <Input
                            label="Dado"
                            value={dano.dado}
                            onChange={(e) => updateWeaponDamage(index, 'dado', e.target.value)}
                            placeholder="1d8"
                          />
                          <Select
                            label="Base de Atributo"
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
                          
                          {baseSelectValue === BASE_CUSTOM_VALUE && (
                            <Input
                              label="Base Personalizada"
                              value={dano.base}
                              onChange={(e) => updateWeaponDamage(index, 'base', e.target.value)}
                              placeholder="Ex: FOR x2"
                            />
                          )}

                          <Input
                            label="Tipo de Dano"
                            value={dano.tipoDano ?? ''}
                            onChange={(e) => updateWeaponDamage(index, 'tipoDano', e.target.value)}
                            placeholder="Ex: Corte, Impacto..."
                          />
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-4 min-w-[140px] h-10 border-t md:border-0 pt-2 md:pt-0 border-gray-200 dark:border-gray-800">
                          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={dano.espiritual}
                              onChange={(e) => updateWeaponDamage(index, 'espiritual', e.target.checked)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span>Espiritual</span>
                          </label>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeWeaponDamage(index)}
                            disabled={state.weapon.danos.length === 1}
                            className="text-red-550 hover:text-red-750 hover:bg-red-50 dark:hover:bg-red-950/30 h-9 w-9 !p-0 rounded-lg shrink-0"
                            title="Remover este dano"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Atributos da Arma */}
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800/80">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Propriedades de Combate</h4>
                
                {/* Agrupamento por Semântica */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Crítico */}
                  <div className="p-4 rounded-xl border border-red-200/20 dark:border-red-900/20 bg-red-50/5 dark:bg-red-950/5 space-y-3">
                    <p className="text-xs font-bold text-red-500/80 dark:text-red-400/85 uppercase tracking-wider">Crítico</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Margem"
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
                    </div>
                  </div>

                  {/* Alcance */}
                  <div className="p-4 rounded-xl border border-blue-200/20 dark:border-blue-900/20 bg-blue-50/5 dark:bg-blue-950/5 space-y-3">
                    <p className="text-xs font-bold text-blue-500/80 dark:text-blue-400/85 uppercase tracking-wider">Alcance</p>
                    <div className="grid grid-cols-1 gap-2">
                      <Select
                        label="Tipo de Alcance"
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
                      {state.weapon.alcance === 'natural' && (
                        <Input
                          label="Extra Natural (m)"
                          type="number"
                          min={0}
                          step={0.5}
                          value={state.weapon.alcanceExtraMetros}
                          onChange={(e) =>
                            updateWeaponField('alcanceExtraMetros', Number(e.target.value || 0))
                          }
                          helperText="Incrementos de 0,5m."
                        />
                      )}
                    </div>
                  </div>

                  {/* Escalonamento & Upgrade */}
                  <div className="p-4 rounded-xl border border-purple-200/20 dark:border-purple-900/20 bg-purple-50/5 dark:bg-purple-950/5 space-y-3">
                    <p className="text-xs font-bold text-purple-500/80 dark:text-purple-400/85 uppercase tracking-wider">Escalonamento & Upgrade</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Atributo"
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
                        disabled={state.editingItemId !== null}
                        helperText={state.editingItemId !== null ? "Apenas na criação" : "0 a 7"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {state.tipo === 'defensive-equipment' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                disabled={state.editingItemId !== null}
                helperText={state.editingItemId !== null ? "Apenas na criação" : "0 a 9"}
              />
            </div>
          )}

          {state.tipo === 'consumable' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
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
              <div className="flex items-center gap-2 mt-4 sm:mt-6">
                <input
                  id="is-refeicao-checkbox"
                  type="checkbox"
                  checked={state.consumable.isRefeicao}
                  onChange={(e) => updateConsumableField('isRefeicao', e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="is-refeicao-checkbox" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                  É refeição
                </label>
              </div>
            </div>
          )}

          {(state.tipo === 'artifact' || state.tipo === 'accessory' || state.tipo === 'general') && (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
              Este tipo de item não requer campos extras obrigatórios. Você já pode vincular poderes ou acervos e salvá-lo.
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
                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/10 p-4 text-sm space-y-1.5">
                    <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Bookmark className="w-4 h-4" /> ᚱ {patamar.nome}
                    </p>
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
        <Card className="border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/30 dark:bg-gray-900/10 border-b border-gray-100 dark:border-gray-800/80">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                <Link2 className="w-4 h-4 text-purple-500" /> Poderes Vinculados ({state.powerIds.length})
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setModalPoderesAberto(true)} className="h-8 text-xs font-bold text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/20">
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            {poderesSelecionados.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-805 rounded-xl bg-gray-50/10">
                <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhum poder vinculado ainda.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {poderesSelecionados.map((poder) => (
                  <div key={poder.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <button
                      type="button"
                      onClick={() => setPoderResumoId(poder.id)}
                      className="min-w-0 flex items-center gap-3 text-left flex-1"
                    >
                      <div className="w-10 h-10 rounded-lg border border-purple-100 dark:border-purple-900/30 overflow-hidden bg-purple-50/40 dark:bg-purple-950/10 shrink-0 flex items-center justify-center">
                        {poder.icone ? (
                          <DynamicIcon name={poder.icone} className="w-full h-full p-1 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-950 dark:text-gray-50 truncate">{poder.nome}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{poder.descricao}</p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="xs" variant="ghost" onClick={() => setPoderResumoId(poder.id)} className="h-8 w-8 !p-0" title="Ver Detalhes">
                        <Eye className="w-4 h-4 text-gray-400 hover:text-purple-500" />
                      </Button>
                      <Button 
                        size="xs" 
                        variant="ghost" 
                        onClick={() => togglePower(poder.id)} 
                        className="h-8 w-8 !p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {poderesCompativeis.length === 0 && poderesSelecionados.length > 0 && (
              <p className="text-xs text-amber-500 dark:text-amber-400 italic">Nenhum outro poder compatível com os domínios atuais.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/30 dark:bg-gray-900/10 border-b border-gray-100 dark:border-gray-800/80">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                <Link2 className="w-4 h-4 text-blue-500" /> Acervos Vinculados ({state.powerArrayIds.length})
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setModalAcervosAberto(true)} className="h-8 text-xs font-bold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            {acervosSelecionados.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-805 rounded-xl bg-gray-50/10">
                <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhum acervo vinculado ainda.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {acervosSelecionados.map((acervo) => (
                  <div key={acervo.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <button
                      type="button"
                      onClick={() => setAcervoResumoId(acervo.id)}
                      className="min-w-0 flex items-center gap-3 text-left flex-1"
                    >
                      <div className="w-10 h-10 rounded-lg border border-blue-100 dark:border-blue-900/30 overflow-hidden bg-blue-50/40 dark:bg-blue-950/10 shrink-0 flex items-center justify-center">
                        {acervo.icone ? (
                          <DynamicIcon name={acervo.icone} className="w-full h-full p-1 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-950 dark:text-gray-50 truncate">{acervo.nome}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{acervo.descricao}</p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="xs" variant="ghost" onClick={() => setAcervoResumoId(acervo.id)} className="h-8 w-8 !p-0" title="Ver Detalhes">
                        <Eye className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                      </Button>
                      <Button 
                        size="xs" 
                        variant="ghost" 
                        onClick={() => togglePowerArray(acervo.id)} 
                        className="h-8 w-8 !p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {acervosCompativeis.length === 0 && acervosSelecionados.length > 0 && (
              <p className="text-xs text-amber-500 dark:text-amber-400 italic">Nenhum outro acervo compatível com os domínios atuais.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Sticky Actions Bar */}
      <div className="sticky bottom-4 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between transition-all duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {state.nome || 'Item Sem Nome'}
            </p>
            <p className="text-xs text-gray-500">
              Nível {nivelCalculado} · {state.tipo === 'weapon' ? 'Arma' : state.tipo === 'defensive-equipment' ? 'Equipamento Defensivo' : state.tipo === 'consumable' ? 'Consumível' : state.tipo === 'upgrade-material' ? 'Material' : 'Outro'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Button variant="outline" onClick={() => setConfirmarReset(true)} className="flex items-center gap-1.5 h-10 border-gray-250 dark:border-gray-805">
            <RefreshCw className="w-4 h-4" /> 
            <span>{state.editingItemId ? 'Cancelar' : 'Resetar'}</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setModalResumoAberto(true)}
            className="flex items-center gap-1.5 h-10 border-gray-250 dark:border-gray-805"
          >
            <FileText className="w-4 h-4" /> 
            <span>Resumo</span>
          </Button>

          <Button 
            onClick={salvarItem} 
            loading={salvando} 
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-10 px-5 rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> 
            <span>{state.editingItemId ? 'Atualizar Item' : 'Salvar Item'}</span>
          </Button>
        </div>
      </div>

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
        itemData={{
          id: state.editingItemId || 'preview',
          userId: null,
          characterId: null,
          tipo: state.tipo,
          nome: state.nome.trim(),
          descricao: state.descricao.trim(),
          isPublic: state.isPublic,
          canStack: false,
          maxStack: 1,
          icone: state.icone.trim(),
          notas: state.notas.trim(),
          dominio: state.dominios[0] || { name: 'general', areaConhecimento: null, peculiarId: null },
          dominios: state.dominios,
          custoBase: state.custoBase,
          nivelItem: nivelCalculado,
          valorBase: custoRealCalculado,
          precoVenda: precoVendaCalculado,
          durabilidade: 'INTACTO',
          powerIds: state.powerIds,
          powerArrayIds: state.powerArrayIds,
          createdAt: new Date().toISOString(),
          updatedAt: null,
          userName: null,
          // Weapon properties
          danos: state.weapon.danos,
          upgradeLevel: state.weapon.upgradeLevel,
          upgradeLevelMax: 7,
          critMargin: state.weapon.critMargin,
          critMultiplier: state.weapon.critMultiplier,
          alcance: state.weapon.alcance,
          alcanceExtraMetros: state.weapon.alcanceExtraMetros,
          atributoEscalonamento: state.tipo === 'weapon' ? state.weapon.atributoEscalonamento : state.tipo === 'defensive-equipment' ? state.defensive.atributoEscalonamento : null,
          // Defensive properties
          tipoEquipamento: state.defensive.tipoEquipamento,
          baseRD: state.defensive.baseRD,
          rdAtual: state.defensive.baseRD,
          // Consumable properties
          descritorEfeito: state.consumable.descritorEfeito,
          qtdDoses: state.consumable.qtdDoses,
          isRefeicao: state.consumable.isRefeicao,
          spoilageState: 'NORMAL',
          // Artifact properties
          isAttuned: false,
          // Upgrade Material properties
          tier: UPGRADE_PATAMARES.find(p => p.id === state.upgradeMaterial.patamarId)?.tier || 1,
          maxUpgradeLimit: UPGRADE_PATAMARES.find(p => p.id === state.upgradeMaterial.patamarId)?.maxUpgradeLimit || 3,
        } as any}
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
