import { apiClient } from './client';
import type { Booking } from '@/types';

export const bookingsApi = {
  create: (session_id: number) => apiClient.post<Booking>('/bookings/', { session_id }).then(r => r.data),
  getMy: () => apiClient.get<Booking[]>('/bookings/').then(r => r.data),
  cancel: (id: number) => apiClient.delete(`/bookings/${id}`),
  getAll: () => apiClient.get<Booking[]>('/bookings/all').then(r => r.data),
  updateStatus: (id: number, status: string) =>
    apiClient.patch<Booking>(`/bookings/${id}/status`, { status }).then(r => r.data),
};
