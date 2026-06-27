import { api } from '../lib/api';
import type { ItemResponse, PoderResponse, AcervoResponse } from './types';
import type { CharacterResponse, SyncCharacterData } from './characters.types';

export const charactersService = {
  // ─── CRUD Básico ─────────────────────────────────────────────────────────────

  async fetchUserCharacters(): Promise<CharacterResponse[]> {
    const { data } = await api.get<CharacterResponse[]>('/characters/me');
    return data;
  },

  async fetchAdminCharacters(): Promise<CharacterResponse[]> {
    const { data } = await api.get<CharacterResponse[]>('/admin/characters');
    return data;
  },

  async getCharacterById(id: string): Promise<CharacterResponse> {
    const { data } = await api.get<CharacterResponse>(`/characters/${id}`);
    return data;
  },

  async createCharacter(payload: {
    narrative: CharacterResponse['narrative'];
    attributes: Omit<CharacterResponse['attributes'], 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'> & {
      strength: number;
      dexterity: number;
      constitution: number;
      intelligence: number;
      wisdom: number;
      charisma: number;
    };
    skills?: {
      name: string;
      state: 'INEFFICIENT' | 'NEUTRAL' | 'EFFICIENT';
      trainingBonusIncrease?: number;
    }[];
    spiritualPrinciple: { isUnlocked: boolean; stage?: 'NORMAL' | 'DIVINE' };
    symbol?: string | null;
    art?: string | null;
  }): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>('/characters', payload);
    return data;
  },

  async deleteCharacter(id: string): Promise<void> {
    await api.delete(`/characters/${id}`);
  },

  // ─── Sync & Macros ───────────────────────────────────────────────────────────

  async syncCharacter(id: string, payload: SyncCharacterData): Promise<CharacterResponse> {
    const { data } = await api.patch<CharacterResponse>(`/characters/${id}/sync`, payload);
    return data;
  },

  async levelUp(id: string): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/level-up`);
    return data;
  },

  async rest(
    id: string,
    payload: {
      quality: 'RUIM' | 'NORMAL' | 'CONFORTAVEL' | 'LUXUOSA';
      durationHours: number;
      hasCare?: boolean;
      useGastronomicRule?: boolean;
      consumedMeal?: boolean;
    }
  ): Promise<CharacterResponse & { restChange?: { pvChange: number; peChange: number } }> {
    const { data } = await api.post<CharacterResponse & { restChange?: { pvChange: number; peChange: number } }>(`/characters/${id}/rest`, payload);
    return data;
  },

  async tickDeathCounter(id: string): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/death-tick`);
    return data;
  },

  async unlockSpiritualPrinciple(id: string, payload: { stage: 'NORMAL' | 'DIVINE' }): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/spiritual-awakening`, payload);
    return data;
  },

  async evolveSpiritualPrinciple(id: string): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/spiritual-evolution`);
    return data;
  },

  // ─── Economia (Runics) ───────────────────────────────────────────────────────

  async addRunics(id: string, amount: number): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/runics/add`, { amount });
    return data;
  },

  async spendRunics(id: string, amount: number): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/runics/spend`, { amount });
    return data;
  },

  // ─── Itens ───────────────────────────────────────────────────────────────────

  async fetchCharacterItems(id: string): Promise<ItemResponse[]> {
    const { data } = await api.get<{ items: ItemResponse[] }>(`/characters/${id}/items`);
    return data.items;
  },

  async addItemToInventory(id: string, itemId: string, quantity: number = 1): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/items`, { itemId, quantity });
    return data;
  },

  async removeFromInventory(id: string, itemId: string, quantity: number = 1): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/items/${itemId}/remove`, { quantity });
    return data;
  },

  async changeItemQuantity(id: string, itemId: string, quantity: number): Promise<CharacterResponse> {
    const { data } = await api.patch<CharacterResponse>(`/characters/${id}/items/${itemId}/quantity`, { quantity });
    return data;
  },

  async equipItem(id: string, itemId: string, slot: 'suit' | 'accessory' | 'hand' | 'quick-access', quantity: number = 1): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/items/${itemId}/equip`, { slot, quantity });
    return data;
  },

  async unequipItem(id: string, itemId: string, slot: 'suit' | 'accessory' | 'hand' | 'quick-access', quantity: number = 1): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/items/${itemId}/unequip`, { slot, quantity });
    return data;
  },

  async upgradeItem(id: string, itemId: string, materialId: string, runicsCost: number): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/items/${itemId}/upgrade`, { materialId, runicsCost });
    return data;
  },

  // ─── Poderes ─────────────────────────────────────────────────────────────────

  async fetchCharacterPowers(id: string): Promise<PoderResponse[]> {
    const { data } = await api.get<{ powers: PoderResponse[] }>(`/characters/${id}/powers/full`);
    return data.powers;
  },

  async acquirePower(id: string, powerId: string): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/powers`, { powerId });
    return data;
  },

  async equipPower(id: string, powerId: string): Promise<CharacterResponse> {
    const { data } = await api.patch<CharacterResponse>(`/characters/${id}/powers/${powerId}/equip`);
    return data;
  },

  async unequipPower(id: string, powerId: string): Promise<CharacterResponse> {
    const { data } = await api.patch<CharacterResponse>(`/characters/${id}/powers/${powerId}/unequip`);
    return data;
  },

  async removePower(id: string, powerId: string): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/powers/${powerId}/remove`);
    return data;
  },

  async updateCharacterPower(_id: string, powerId: string, payload: any): Promise<void> {
    await api.put(`/powers/${powerId}`, payload);
  },

  // ─── Acervos ─────────────────────────────────────────────────────────────────

  async fetchCharacterPowerArrays(id: string): Promise<AcervoResponse[]> {
    const { data } = await api.get<{ powerArrays: AcervoResponse[] }>(`/characters/${id}/power-arrays/full`);
    return data.powerArrays;
  },

  async acquirePowerArray(id: string, powerArrayId: string): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/power-arrays`, { powerArrayId });
    return data;
  },

  async equipPowerArray(id: string, powerArrayId: string): Promise<CharacterResponse> {
    const { data } = await api.patch<CharacterResponse>(`/characters/${id}/power-arrays/${powerArrayId}/equip`);
    return data;
  },

  async unequipPowerArray(id: string, powerArrayId: string): Promise<CharacterResponse> {
    const { data } = await api.patch<CharacterResponse>(`/characters/${id}/power-arrays/${powerArrayId}/unequip`);
    return data;
  },

  async removePowerArray(id: string, powerArrayId: string): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/power-arrays/${powerArrayId}/remove`);
    return data;
  },

  // ─── Domínios e Benefícios ───────────────────────────────────────────────────

  async acquireDomainMastery(id: string, domainId: string, masteryLevel: 'INICIANTE' | 'PRATICANTE' | 'MESTRE'): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/domains`, { domainId, masteryLevel });
    return data;
  },

  async discardDomainMastery(id: string, domainId: string): Promise<CharacterResponse> {
    const { data } = await api.delete<CharacterResponse>(`/characters/${id}/domains/${domainId}`);
    return data;
  },

  async acquireBenefit(id: string, benefitName: string, targetDegree: number): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/benefits`, { benefitName, targetDegree });
    return data;
  },

  async removeBenefit(id: string, benefitId: string): Promise<CharacterResponse> {
    const { data } = await api.delete<CharacterResponse>(`/characters/${id}/benefits/${benefitId}`);
    return data;
  },

  async updateUnarmedMastery(id: string, payload: any): Promise<CharacterResponse> {
    const { data } = await api.post<CharacterResponse>(`/characters/${id}/unarmed-mastery`, payload);
    return data;
  },
};
