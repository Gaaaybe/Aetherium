import { api } from '@/lib/api';
import type {
  CreatePeculiaridadePayload,
  PeculiaridadeResponse,
  UpdatePeculiaridadePayload,
} from './types';

export async function fetchMyPeculiarities(page = 1): Promise<PeculiaridadeResponse[]> {
  const { data } = await api.get<PeculiaridadeResponse[]>('/peculiarities', { params: { page } });
  return data;
}

export async function getPeculiarityById(id: string): Promise<PeculiaridadeResponse> {
  const { data } = await api.get<PeculiaridadeResponse>(`/peculiarities/${id}`);
  return data;
}

export async function createPeculiarity(
  payload: CreatePeculiaridadePayload,
): Promise<PeculiaridadeResponse> {
  const { data } = await api.post<PeculiaridadeResponse>('/peculiarities', payload);
  return data;
}

export async function updatePeculiarity(
  id: string,
  payload: UpdatePeculiaridadePayload,
): Promise<PeculiaridadeResponse> {
  const { data } = await api.put<PeculiaridadeResponse>(`/peculiarities/${id}`, payload);
  return data;
}

export async function deletePeculiarity(id: string): Promise<void> {
  await api.delete(`/peculiarities/${id}`);
}

export async function fetchPublicPeculiarities(page = 1): Promise<PeculiaridadeResponse[]> {
  const { data } = await api.get<PeculiaridadeResponse[]>('/peculiarities/public', { params: { page } });
  return data;
}

export async function copyPeculiarity(id: string): Promise<PeculiaridadeResponse> {
  const { data } = await api.post<PeculiaridadeResponse>(`/peculiarities/${id}/copy`);
  return data;
}

export async function fetchAdminPeculiarities(): Promise<PeculiaridadeResponse[]> {
  const { data } = await api.get<PeculiaridadeResponse[]>('/admin/peculiarities');
  return data;
}

export async function promotePeculiarityToOfficial(id: string): Promise<PeculiaridadeResponse> {
  const { data } = await api.patch<PeculiaridadeResponse>(`/admin/peculiarities/${id}/promote`);
  return data;
}
