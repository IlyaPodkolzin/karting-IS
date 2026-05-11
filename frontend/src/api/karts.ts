import { apiClient } from './client';
import type { Kart } from '@/types';

export const kartsApi = {
  getAll: (kartodrome_id?: number) =>
    apiClient.get<Kart[]>('/karts/', { params: kartodrome_id ? { kartodrome_id } : {} }).then(r => r.data),
  updateStatus: (id: number, status: string) =>
    apiClient.patch<Kart>(`/karts/${id}/status`, { status }).then(r => r.data),
  create: (data: Partial<Kart>) => apiClient.post<Kart>('/karts/', data).then(r => r.data),
};
