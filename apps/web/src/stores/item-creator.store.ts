import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DomainName,
  ItemResponse,
  ItemType,
} from '@/services/types';

export const UPGRADE_PATAMARES = [
  { id: 1, nome: 'Fragmento', tier: 1, maxUpgradeLimit: 2, custoBase: 500 },
  { id: 2, nome: 'Estilhaço', tier: 2, maxUpgradeLimit: 4, custoBase: 5000 },
  { id: 3, nome: 'Pedaço', tier: 3, maxUpgradeLimit: 6, custoBase: 50000 },
  { id: 4, nome: 'Placa', tier: 4, maxUpgradeLimit: 9, custoBase: 100000 },
] as const;

export type UpgradePatamarId = (typeof UPGRADE_PATAMARES)[number]['id'];

export interface ItemBuilderState {
  tipo: ItemType;
  nome: string;
  descricao: string;
  dominios: {
    name: DomainName;
    areaConhecimento?: string;
    peculiarId?: string;
  }[];
  custoBase: number;
  isPublic: boolean;
  icone: string;
  notas: string;
  powerIds: string[];
  powerArrayIds: string[];
  editingItemId: string | null;
  weapon: {
    danos: { dado: string; base: string; espiritual: boolean; tipoDano?: string }[];
    critMargin: number;
    critMultiplier: number;
    alcance: 'adjacente' | 'natural' | 'curto' | 'medio' | 'longo';
    alcanceExtraMetros: number;
    atributoEscalonamento: string;
    upgradeLevel: number;
  };
  defensive: {
    tipoEquipamento: 'traje' | 'protecao';
    baseRD: number;
    atributoEscalonamento: string;
    upgradeLevel: number;
  };
  consumable: {
    descritorEfeito: string;
    qtdDoses: number;
    isRefeicao: boolean;
  };
  upgradeMaterial: {
    patamarId: UpgradePatamarId;
    tier: number;
    maxUpgradeLimit: number;
  };
}

const createInitialState = (): ItemBuilderState => ({
  tipo: 'weapon',
  nome: '',
  descricao: '',
  dominios: [{ name: 'natural' }],
  custoBase: 1,
  isPublic: false,
  icone: '',
  notas: '',
  powerIds: [],
  powerArrayIds: [],
  editingItemId: null,
  weapon: {
    danos: [{ dado: '1d6', base: 'FOR', espiritual: false, tipoDano: '' }],
    critMargin: 20,
    critMultiplier: 2,
    alcance: 'natural',
    alcanceExtraMetros: 0,
    atributoEscalonamento: '',
    upgradeLevel: 0,
  },
  defensive: {
    tipoEquipamento: 'protecao',
    baseRD: 2,
    atributoEscalonamento: '',
    upgradeLevel: 0,
  },
  consumable: {
    descritorEfeito: '',
    qtdDoses: 1,
    isRefeicao: false,
  },
  upgradeMaterial: {
    patamarId: 1 as UpgradePatamarId,
    tier: 1,
    maxUpgradeLimit: 2,
  },
});

interface ItemCreatorStore {
  state: ItemBuilderState;
  updateField: <K extends keyof ItemBuilderState>(key: K, value: ItemBuilderState[K]) => void;
  addDomain: (dominio: { name: DomainName; areaConhecimento?: string; peculiarId?: string }) => void;
  removeDomain: (index: number) => void;
  updateDomain: (index: number, partial: Partial<{ name: DomainName; areaConhecimento?: string; peculiarId?: string }>) => void;
  setTipo: (tipo: ItemType) => void;
  togglePower: (powerId: string) => void;
  togglePowerArray: (powerArrayId: string) => void;
  updateWeaponDamage: (index: number, key: 'dado' | 'base' | 'espiritual' | 'tipoDano', value: string | boolean) => void;
  addWeaponDamage: () => void;
  removeWeaponDamage: (index: number) => void;
  updateWeaponField: (
    key: 'critMargin' | 'critMultiplier' | 'alcance' | 'alcanceExtraMetros' | 'atributoEscalonamento' | 'upgradeLevel',
    value: number | string
  ) => void;
  updateDefensiveField: (
    key: 'tipoEquipamento' | 'baseRD' | 'atributoEscalonamento' | 'upgradeLevel',
    value: number | string
  ) => void;
  updateConsumableField: (
    key: 'descritorEfeito' | 'qtdDoses' | 'isRefeicao',
    value: string | number | boolean
  ) => void;
  setUpgradeMaterialPatamar: (patamarId: UpgradePatamarId) => void;
  hydrateFromItem: (item: ItemResponse, asTemplate?: boolean) => void;
  reset: () => void;
}

export const useItemCreatorStore = create<ItemCreatorStore>()(
  persist(
    (set) => ({
      state: createInitialState(),

      updateField: (key, value) => set((prev) => ({
        state: {
          ...prev.state,
          [key]: value,
        },
      })),

      addDomain: (dominio) => set((prev) => ({
        state: {
          ...prev.state,
          dominios: [...prev.state.dominios, dominio],
        },
      })),

      removeDomain: (index) => set((prev) => ({
        state: {
          ...prev.state,
          dominios: prev.state.dominios.filter((_, i) => i !== index),
        },
      })),

      updateDomain: (index, partial) => set((prev) => ({
        state: {
          ...prev.state,
          dominios: prev.state.dominios.map((d, i) =>
            i === index ? { ...d, ...partial } : d
          ),
        },
      })),

      setTipo: (tipo) => set((prev) => ({
        state: {
          ...prev.state,
          tipo,
        },
      })),

      togglePower: (powerId) => set((prev) => ({
        state: {
          ...prev.state,
          powerIds: prev.state.powerIds.includes(powerId)
            ? prev.state.powerIds.filter((id) => id !== powerId)
            : [...prev.state.powerIds, powerId],
        },
      })),

      togglePowerArray: (powerArrayId) => set((prev) => ({
        state: {
          ...prev.state,
          powerArrayIds: prev.state.powerArrayIds.includes(powerArrayId)
            ? prev.state.powerArrayIds.filter((id) => id !== powerArrayId)
            : [...prev.state.powerArrayIds, powerArrayId],
        },
      })),

      updateWeaponDamage: (index, key, value) => set((prev) => ({
        state: {
          ...prev.state,
          weapon: {
            ...prev.state.weapon,
            danos: prev.state.weapon.danos.map((dano, i) =>
              i === index ? { ...dano, [key]: value } : dano
            ),
          },
        },
      })),

      addWeaponDamage: () => set((prev) => ({
        state: {
          ...prev.state,
          weapon: {
            ...prev.state.weapon,
            danos: [...prev.state.weapon.danos, { dado: '1d6', base: 'FOR', espiritual: false, tipoDano: '' }],
          },
        },
      })),

      removeWeaponDamage: (index) => set((prev) => ({
        state: {
          ...prev.state,
          weapon: {
            ...prev.state.weapon,
            danos: prev.state.weapon.danos.length === 1
              ? prev.state.weapon.danos
              : prev.state.weapon.danos.filter((_, i) => i !== index),
          },
        },
      })),

      updateWeaponField: (key, value) => set((prev) => ({
        state: {
          ...prev.state,
          weapon: {
            ...prev.state.weapon,
            [key]: value,
          },
        },
      })),

      updateDefensiveField: (key, value) => set((prev) => ({
        state: {
          ...prev.state,
          defensive: {
            ...prev.state.defensive,
            [key]: value,
          },
        },
      })),

      updateConsumableField: (key, value) => set((prev) => ({
        state: {
          ...prev.state,
          consumable: {
            ...prev.state.consumable,
            [key]: value,
          },
        },
      })),

      setUpgradeMaterialPatamar: (patamarId) => set((prev) => {
        const patamar = UPGRADE_PATAMARES.find((p) => p.id === patamarId);
        if (!patamar) return {};
        return {
          state: {
            ...prev.state,
            custoBase: patamar.custoBase,
            upgradeMaterial: {
              patamarId,
              tier: patamar.tier,
              maxUpgradeLimit: patamar.maxUpgradeLimit,
            },
          },
        };
      }),

      hydrateFromItem: (item, asTemplate) => set((prev) => {
        const next = {
          ...createInitialState(),
          tipo: item.tipo,
          nome: item.nome,
          descricao: item.descricao,
          dominios: item.dominios
            ? item.dominios.map(d => ({
                name: d.name as DomainName,
                areaConhecimento: d.areaConhecimento ?? undefined,
                peculiarId: d.peculiarId ?? undefined,
              }))
            : item.dominio
              ? [{
                  name: item.dominio.name as DomainName,
                  areaConhecimento: item.dominio.areaConhecimento ?? undefined,
                  peculiarId: item.dominio.peculiarId ?? undefined,
                }]
              : [],
          custoBase: item.custoBase,
          isPublic: item.isPublic,
          icone: item.icone ?? '',
          notas: item.notas ?? '',
          powerIds: item.powerIds ?? [],
          powerArrayIds: item.powerArrayIds ?? [],
          editingItemId: asTemplate ? null : item.id,
          weapon: prev.state.tipo === item.tipo ? prev.state.weapon : createInitialState().weapon,
          defensive: prev.state.tipo === item.tipo ? prev.state.defensive : createInitialState().defensive,
          consumable: prev.state.tipo === item.tipo ? prev.state.consumable : createInitialState().consumable,
          upgradeMaterial: prev.state.tipo === item.tipo ? prev.state.upgradeMaterial : createInitialState().upgradeMaterial,
        } satisfies ItemBuilderState;

        if (item.tipo === 'weapon') {
          const weaponItem = item as any;
          next.weapon = {
            danos: (weaponItem.baseDanos ?? weaponItem.danos ?? []).map((d: any) => ({
              dado: d.dado,
              base: d.base,
              espiritual: !!d.espiritual,
              tipoDano: d.tipoDano ?? '',
            })),
            critMargin: weaponItem.critMargin ?? 20,
            critMultiplier: weaponItem.critMultiplier ?? 2,
            alcance: weaponItem.alcance ?? 'natural',
            alcanceExtraMetros: weaponItem.alcanceExtraMetros ?? 0,
            atributoEscalonamento: weaponItem.atributoEscalonamento ?? '',
            upgradeLevel: weaponItem.upgradeLevel ?? 0,
          };
        }

        if (item.tipo === 'defensive-equipment') {
          const defensiveItem = item as any;
          next.defensive = {
            tipoEquipamento: defensiveItem.tipoEquipamento ?? 'protecao',
            baseRD: defensiveItem.baseRD ?? 2,
            atributoEscalonamento: defensiveItem.atributoEscalonamento ?? '',
            upgradeLevel: defensiveItem.upgradeLevel ?? 0,
          };
        }

        if (item.tipo === 'consumable') {
          const consumableItem = item as any;
          next.consumable = {
            descritorEfeito: consumableItem.descritorEfeito ?? '',
            qtdDoses: consumableItem.qtdDoses ?? 1,
            isRefeicao: consumableItem.isRefeicao ?? false,
          };
        }

        if (item.tipo === 'upgrade-material') {
          const matItem = item as any;
          const patamar = UPGRADE_PATAMARES.find((p) => p.tier === matItem.tier) ?? UPGRADE_PATAMARES[0];
          next.upgradeMaterial = {
            patamarId: patamar.id,
            tier: matItem.tier ?? 1,
            maxUpgradeLimit: matItem.maxUpgradeLimit ?? 2,
          };
        }

        return { state: next };
      }),

      reset: () => set(() => ({
        state: createInitialState(),
      })),
    }),
    {
      name: 'criador-de-item-store',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 && persistedState && persistedState.state) {
          const oldState = persistedState.state;
          let oldDominio = oldState.dominio;
          let dominios: any[] = [];
          if (oldDominio) {
            if (typeof oldDominio === 'string') {
              dominios = [{ name: oldDominio }];
            } else if (typeof oldDominio === 'object') {
              dominios = [{
                name: oldDominio.name || 'natural',
                areaConhecimento: oldDominio.areaConhecimento,
                peculiarId: oldDominio.peculiarId,
              }];
            }
          } else {
            dominios = [{ name: 'natural' }];
          }
          delete oldState.dominio;
          oldState.dominios = dominios;
        }
        return persistedState;
      },
    }
  )
);
