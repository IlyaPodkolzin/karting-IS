import { apiClient } from './client';
import type { Statistic } from '@/types';

export const statisticsApi = {
  getMy: () => apiClient.get<Statistic[]>('/statistics/').then(r => r.data),
  getByUser: (userId: number) => apiClient.get<Statistic[]>(`/statistics/${userId}`).then(r => r.data),
};
