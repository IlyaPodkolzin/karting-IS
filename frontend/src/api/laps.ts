import { apiClient } from './client';
import type { Lap } from '@/types';

export const lapsApi = {
  add: (booking_id: number, lap_number: number, lap_time: number) =>
    apiClient.post<Lap>('/laps/', { booking_id, lap_number, lap_time }).then(r => r.data),
  getByBooking: (booking_id: number) =>
    apiClient.get<Lap[]>('/laps/', { params: { booking_id } }).then(r => r.data),
};
