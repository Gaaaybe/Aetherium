import { api } from '@/lib/api';
import type { CreatePoderPayload, PoderResponse, UpdatePoderPayload } from './types';

// ─── Tipos do motor de automação ─────────────────────────────────────────────

export interface CasterState {
  id: string;
  keyPhysicalModifier: number;
  keyMentalModifier: number;
  level: number;
}

export interface GameMutation {
  type: string;
  targetId: string | null;
  formula?: string;
  damageType?: string;
  markerId?: string;
  label?: string;
  duracao?: string;
  condicaoId?: string;
  trigger?: { evento: string; condicao: string; efeitosFilhos: string[] };
  sourcePowerId?: string;
  isSelfInflicted?: boolean;
}

export interface ResolvePowerResponse {
  resolutionMode: 'ON_USE' | 'PASSIVE' | 'NARRATIVE';
  mutations: GameMutation[];
  isDanoAcoplado?: boolean;
  isRecuperacaoAcoplada?: boolean;
}

export interface ResolvePowerInput {
  sceneId: string;
  candidateTargetIds: string[];
  selectedTargetIds?: string[];
  casterState: CasterState;
  attackSucceeded?: boolean;
}

export async function fetchMyPowers(page = 1): Promise<PoderResponse[]> {
  const { data } = await api.get<PoderResponse[]>('/powers/me', { params: { page } });
  return data;
}

export async function fetchPublicPowers(page = 1): Promise<PoderResponse[]> {
  const { data } = await api.get<PoderResponse[]>('/powers', { params: { page } });
  return data;
}

export async function getPowerById(id: string): Promise<PoderResponse> {
  const { data } = await api.get<PoderResponse>(`/powers/${id}`);
  return data;
}

export async function createPower(payload: CreatePoderPayload): Promise<PoderResponse> {
  const { data } = await api.post<PoderResponse>('/powers', payload);
  return data;
}

export async function updatePower(id: string, payload: UpdatePoderPayload): Promise<PoderResponse> {
  const { data } = await api.put<PoderResponse>(`/powers/${id}`, payload);
  return data;
}

export async function deletePower(id: string): Promise<void> {
  await api.delete(`/powers/${id}`);
}

export async function copyPublicPower(powerId: string): Promise<PoderResponse> {
  const { data } = await api.post<PoderResponse>(`/powers/${powerId}/copy`);
  return data;
}

/**
 * Chama o motor de automação e retorna as mutações calculadas.
 * Não aplica nada — o resultado é usado para informar o jogador e confirmar.
 */
export async function resolvePower(
  powerId: string,
  input: ResolvePowerInput,
): Promise<ResolvePowerResponse> {
  const { data } = await api.post<ResolvePowerResponse>(`/powers/${powerId}/resolve`, input);
  return data;
}

/**
 * Aplica as mutações confirmadas de volta ao servidor.
 * Usado após o jogador confirmar o uso do poder no PowerUsageModal.
 */
export async function applyMutations(
  sceneId: string,
  sourceCharacterId: string,
  mutations: GameMutation[],
): Promise<void> {
  await api.post('/powers/apply-mutations', { sceneId, sourceCharacterId, mutations });
}

export async function fetchAdminPowers(): Promise<PoderResponse[]> {
  const { data } = await api.get<PoderResponse[]>('/admin/powers');
  return data;
}

export async function promotePowerToOfficial(id: string): Promise<PoderResponse> {
  const { data } = await api.patch<PoderResponse>(`/admin/powers/${id}/promote`);
  return data;
}
