import { api } from '@/lib/api';
import type { CreateItemPayload, ItemResponse, UpdateItemPayload, ItemType } from './types';

interface ItemQueryParams {
  page?: number;
  tipo?: ItemType;
}

export async function fetchMyItems(params: ItemQueryParams = {}): Promise<ItemResponse[]> {
  const { data } = await api.get<ItemResponse[]>('/items/me', { params });
  return data;
}

export async function fetchPublicItems(params: ItemQueryParams = {}): Promise<ItemResponse[]> {
  const { data } = await api.get<ItemResponse[]>('/items', { params });
  return data;
}

export async function getItemById(id: string): Promise<ItemResponse> {
  const { data } = await api.get<ItemResponse>(`/items/${id}`);
  return data;
}

export async function createItem(payload: CreateItemPayload): Promise<ItemResponse> {
  const { data } = await api.post<ItemResponse>('/items', payload);
  return data;
}

export async function updateItem(id: string, payload: UpdateItemPayload): Promise<ItemResponse> {
  const { data } = await api.put<ItemResponse>(`/items/${id}`, payload);
  return data;
}

export async function deleteItem(id: string): Promise<void> {
  await api.delete(`/items/${id}`);
}

export async function copyPublicItem(id: string): Promise<ItemResponse> {
  const { data } = await api.post<ItemResponse>(`/items/${id}/copy`);
  return data;
}

export async function exportItem(id: string): Promise<any> {
  const { data } = await api.get(`/items/${id}/export`);
  return data;
}

export async function importItem(payload: any): Promise<ItemResponse> {
  const { data } = await api.post<ItemResponse>('/items/import', payload);
  return data;
}

export async function fetchAdminItems(): Promise<ItemResponse[]> {
  const { data } = await api.get<ItemResponse[]>('/admin/items');
  return data;
}

export async function promoteItemToOfficial(id: string): Promise<ItemResponse> {
  const { data } = await api.patch<ItemResponse>(`/admin/items/${id}/promote`);
  return data;
}

