import { api } from '@/lib/api';
import type { AcervoResponse, CreateAcervoPayload, UpdateAcervoPayload } from './types';

export async function fetchMyPowerArrays(page = 1): Promise<AcervoResponse[]> {
  const { data } = await api.get<AcervoResponse[]>('/power-arrays/me', { params: { page } });
  return data;
}

export async function fetchPublicPowerArrays(page = 1): Promise<AcervoResponse[]> {
  const { data } = await api.get<AcervoResponse[]>('/power-arrays', { params: { page } });
  return data;
}

export async function getPowerArrayById(id: string): Promise<AcervoResponse> {
  const { data } = await api.get<AcervoResponse>(`/power-arrays/${id}`);
  return data;
}

export async function createPowerArray(payload: CreateAcervoPayload): Promise<AcervoResponse> {
  const { data } = await api.post<AcervoResponse>('/power-arrays', payload);
  return data;
}

export async function updatePowerArray(id: string, payload: UpdateAcervoPayload): Promise<AcervoResponse> {
  const { data } = await api.put<AcervoResponse>(`/power-arrays/${id}`, payload);
  return data;
}

export async function deletePowerArray(id: string): Promise<void> {
  await api.delete(`/power-arrays/${id}`);
}

export async function copyPowerArray(id: string): Promise<AcervoResponse> {
  const { data } = await api.post<AcervoResponse>(`/power-arrays/${id}/copy`);
  return data;
}

export async function fetchAdminPowerArrays(): Promise<AcervoResponse[]> {
  const { data } = await api.get<AcervoResponse[]>('/admin/power-arrays');
  return data;
}

export async function promotePowerArrayToOfficial(id: string): Promise<AcervoResponse> {
  const { data } = await api.patch<AcervoResponse>(`/admin/power-arrays/${id}/promote`);
  return data;
}
