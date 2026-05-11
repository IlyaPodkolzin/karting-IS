import { apiClient } from './client';
import type { Kartodrome } from '@/types';

export const kartodromesApi = {
  getAll: () => apiClient.get<Kartodrome[]>('/kartodromes/').then(r => r.data),
  getById: (id: number) => apiClient.get<Kartodrome>(`/kartodromes/${id}`).then(r => r.data),
  create: (data: Partial<Kartodrome>) => apiClient.post<Kartodrome>('/kartodromes/', data).then(r => r.data),
  update: (id: number, data: Partial<Kartodrome>) => apiClient.put<Kartodrome>(`/kartodromes/${id}`, data).then(r => r.data),
};
