import { useState, useEffect, useCallback } from 'react';
import { charactersService } from '@/services/characters.service';
import type { CharacterResponse, PowerAcquisitionOptions, SyncCharacterData } from '@/services/characters.types';
import type { EquipSlot } from '@/services/characters.types';
import { toast } from '@/shared/ui';

type PendingAction = {
  title?: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => Promise<void>;
} | null;

export function useCharacterSheet(characterId: string) {
  const [character, setCharacter] = useState<CharacterResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const fetchCharacter = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await charactersService.getCharacterById(characterId);
      setCharacter(data);
    } catch (err) {
      toast.error('Erro ao carregar personagem');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

  const sync = async (data: SyncCharacterData) => {
    if (!character) return;
    
    setIsSyncing(true);
    try {
      const updated = await charactersService.syncCharacter(characterId, data);
      setCharacter(updated);
    } catch (err) {
      toast.error('Erro ao sincronizar dados');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const levelUp = () => {
    if (!character) return;
    setPendingAction({
      title: 'Subir de Nível',
      message: 'Tem certeza que deseja subir de nível?',
      confirmText: 'Subir de Nível',
      variant: 'info',
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          const updated = await charactersService.levelUp(characterId);
          setCharacter(updated);
          toast.success('Personagem subiu de nível!');
        } catch (err) {
          toast.error('Erro ao subir de nível');
          console.error(err);
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  const acquireDomainMastery = async (domainId: string, masteryLevel: 'INICIANTE' | 'PRATICANTE' | 'MESTRE') => {
    if (!character) return;
    
    setIsSyncing(true);
    try {
      const updated = await charactersService.acquireDomainMastery(characterId, domainId, masteryLevel);
      setCharacter(updated);
      toast.success(`Domínio ${domainId} atualizado!`);
    } catch (err) {
      toast.error('Erro ao adquirir maestria de domínio');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const discardDomainMastery = (domainId: string) => {
    if (!character) return;
    setPendingAction({
      title: 'Remover Domínio',
      message: 'Deseja realmente remover este domínio?',
      confirmText: 'Remover',
      variant: 'danger',
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          const updated = await charactersService.discardDomainMastery(characterId, domainId);
          setCharacter(updated);
          toast.success('Domínio removido!');
        } catch (err) {
          toast.error('Erro ao remover domínio');
          console.error(err);
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  const acquirePower = async (powerId: string, acquisition?: PowerAcquisitionOptions) => {
    if (!character) return;
    
    setIsSyncing(true);
    try {
      const updated = await charactersService.acquirePower(characterId, powerId, acquisition);
      setCharacter(updated);
      toast.success('Poder adicionado ao acervo do personagem!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao adicionar poder');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const acquirePowerArray = async (powerArrayId: string, acquisition?: PowerAcquisitionOptions) => {
    if (!character) return;
    
    setIsSyncing(true);
    try {
      const updated = await charactersService.acquirePowerArray(characterId, powerArrayId, acquisition);
      setCharacter(updated);
      toast.success('Acervo adicionado ao personagem!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao adicionar acervo');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const equipPower = async (powerId: string) => {
    if (!character) return;
    setIsSyncing(true);
    try {
      const updated = await charactersService.equipPower(characterId, powerId);
      setCharacter(updated);
      toast.success('Poder equipado!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao equipar poder');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const unequipPower = async (powerId: string) => {
    if (!character) return;
    setIsSyncing(true);
    try {
      const updated = await charactersService.unequipPower(characterId, powerId);
      setCharacter(updated);
      toast.success('Poder desequipado!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao desequipar poder');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const equipPowerArray = async (powerArrayId: string) => {
    if (!character) return;
    setIsSyncing(true);
    try {
      const updated = await charactersService.equipPowerArray(characterId, powerArrayId);
      setCharacter(updated);
      toast.success('Acervo equipado!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao equipar acervo');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const unequipPowerArray = async (powerArrayId: string) => {
    if (!character) return;
    setIsSyncing(true);
    try {
      const updated = await charactersService.unequipPowerArray(characterId, powerArrayId);
      setCharacter(updated);
      toast.success('Acervo desequipado!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao desequipar acervo');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const removePower = (powerId: string) => {
    if (!character) return;
    setPendingAction({
      title: 'Remover Poder',
      message: 'Tem certeza que deseja remover este poder da ficha? Ele será apagado do seu acervo de personagem.',
      confirmText: 'Remover',
      variant: 'danger',
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          const updated = await charactersService.removePower(characterId, powerId);
          setCharacter(updated);
          toast.success('Poder removido da ficha!');
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Erro ao remover poder');
          console.error(err);
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  const removePowerArray = (powerArrayId: string) => {
    if (!character) return;
    setPendingAction({
      title: 'Remover Acervo',
      message: 'Tem certeza que deseja remover este acervo da ficha?',
      confirmText: 'Remover',
      variant: 'danger',
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          const updated = await charactersService.removePowerArray(characterId, powerArrayId);
          setCharacter(updated);
          toast.success('Acervo removido da ficha!');
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Erro ao remover acervo');
          console.error(err);
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  const addItemToInventory = async (itemId: string, quantity: number = 1) => {
    if (!character) return;
    setIsSyncing(true);
    try {
      const updated = await charactersService.addItemToInventory(characterId, itemId, quantity);
      setCharacter(updated);
      toast.success('Item adicionado ao inventário!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao adicionar item');
    } finally {
      setIsSyncing(false);
    }
  };

  const changeItemQuantity = async (itemId: string, quantity: number) => {
    if (!character) return;
    setIsSyncing(true);
    try {
      const updated = await charactersService.changeItemQuantity(characterId, itemId, quantity);
      setCharacter(updated);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao alterar quantidade do item');
    } finally {
      setIsSyncing(false);
    }
  };

  const removeFromInventory = (itemId: string, quantity: number = 1) => {
    if (!character) return;
    setPendingAction({
      title: 'Remover Item',
      message: 'Tem certeza que deseja remover este item do inventário?',
      confirmText: 'Remover',
      variant: 'danger',
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          const updated = await charactersService.removeFromInventory(characterId, itemId, quantity);
          setCharacter(updated);
          toast.success('Item removido do inventário!');
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Erro ao remover item');
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  const equipItem = async (itemId: string, slot: EquipSlot, quantity: number = 1) => {
    if (!character) return;
    setIsSyncing(true);
    try {
      const updated = await charactersService.equipItem(characterId, itemId, slot, quantity);
      setCharacter(updated);
      toast.success('Item equipado!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao equipar item');
    } finally {
      setIsSyncing(false);
    }
  };

  const unequipItem = async (itemId: string, slot: EquipSlot, quantity: number = 1) => {
    if (!character) return;
    setIsSyncing(true);
    try {
      const updated = await charactersService.unequipItem(characterId, itemId, slot, quantity);
      setCharacter(updated);
      toast.success('Item desequipado!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao desequipar item');
    } finally {
      setIsSyncing(false);
    }
  };

  const upgradeItem = async (itemId: string, materialId: string, runicsCost: number) => {
    if (!character) return;
    setIsSyncing(true);
    try {
      const updated = await charactersService.upgradeItem(characterId, itemId, materialId, runicsCost);
      setCharacter(updated);
      toast.success('Item aprimorado com sucesso!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao aprimorar item');
    } finally {
      setIsSyncing(false);
    }
  };

  const addRunics = async (amount: number) => {
    if (!character) return;
    setIsSyncing(true);
    try {
      const updated = await charactersService.addRunics(characterId, amount);
      setCharacter(updated);
      toast.success(`+${amount} ᚱ adicionados!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao adicionar rúnicos');
    } finally {
      setIsSyncing(false);
    }
  };

  const spendRunics = async (amount: number) => {
    if (!character) return;
    setIsSyncing(true);
    try {
      const updated = await charactersService.spendRunics(characterId, amount);
      setCharacter(updated);
      toast.success(`${amount} ᚱ gastos!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Saldo de rúnicos insuficiente');
    } finally {
      setIsSyncing(false);
    }
  };

  const acquireBenefit = async (benefitName: string, targetDegree: number) => {
    if (!character) return;
    setIsSyncing(true);
    try {
      const updated = await charactersService.acquireBenefit(characterId, benefitName, targetDegree);
      setCharacter(updated);
      toast.success(`Benefício ${benefitName} (Grau ${targetDegree}) adquirido!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao adquirir benefício');
    } finally {
      setIsSyncing(false);
    }
  };

  const updateUnarmedMastery = async (mastery: any) => {
    if (!character) return;
    setIsSyncing(true);
    try {
      const updated = await charactersService.updateUnarmedMastery(characterId, mastery);
      setCharacter(updated);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar domínio desarmado');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const removeBenefit = (benefitId: string) => {
    if (!character) return;
    setPendingAction({
      title: 'Remover Benefício',
      message: 'Deseja realmente remover este benefício? O PdA será totalmente reembolsado.',
      confirmText: 'Remover e Reembolsar',
      variant: 'danger',
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          const updated = await charactersService.removeBenefit(characterId, benefitId);
          setCharacter(updated);
          toast.success('Benefício removido e PdA reembolsado!');
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Erro ao remover benefício');
          console.error(err);
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  const rest = async (payload: {
    quality: 'RUIM' | 'NORMAL' | 'CONFORTAVEL' | 'LUXUOSA';
    durationHours: number;
    hasCare?: boolean;
    useGastronomicRule?: boolean;
    consumedMeal?: boolean;
    customMaxPV?: number;
    customMaxPE?: number;
  }) => {
    if (!character) return null;
    setIsSyncing(true);
    try {
      const updated = await charactersService.rest(characterId, payload);
      setCharacter(updated);
      toast.success('Descanso concluído com sucesso!');
      return updated;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao realizar descanso');
      console.error(err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    character,
    isLoading,
    isSyncing,
    sync,
    rest,
    levelUp,
    acquireDomainMastery,
    discardDomainMastery,
    acquirePower,
    acquirePowerArray,
    equipPower,
    unequipPower,
    equipPowerArray,
    unequipPowerArray,
    removePower,
    removePowerArray,
    addItemToInventory,
    changeItemQuantity,
    removeFromInventory,
    equipItem,
    unequipItem,
    upgradeItem,
    addRunics,
    spendRunics,
    acquireBenefit,
    removeBenefit,
    updateUnarmedMastery,
    refresh: fetchCharacter,
    pendingAction,
    clearPendingAction: () => setPendingAction(null),
  };
}
