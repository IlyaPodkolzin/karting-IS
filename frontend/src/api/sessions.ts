import { apiClient } from './client';
import type { Session } from '@/types';

export const sessionsApi = {
  getAll: (params?: { kartodrome_id?: number; date?: string }) =>
    apiClient.get<Session[]>('/sessions/', { params }).then(r => r.data),
  getById: (id: number) => apiClient.get<Session>(`/sessions/${id}`).then(r => r.data),
  create: (data: Partial<Session>) => apiClient.post<Session>('/sessions/', data).then(r => r.data),
  delete: (id: number) => apiClient.delete(`/sessions/${id}`),
};
