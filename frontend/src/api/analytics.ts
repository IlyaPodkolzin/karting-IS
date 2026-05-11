import { apiClient } from './client';
import type { AnalyticsLoad } from '@/types';

export const analyticsApi = {
  getLoad: () => apiClient.get<AnalyticsLoad[]>('/analytics/load').then(r => r.data),
  getKartodromeLoad: (id: number) => apiClient.get(`/analytics/kartodrome/${id}`).then(r => r.data),
};
