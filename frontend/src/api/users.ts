import { apiClient } from './client';
import type { User } from '@/types';

export const usersApi = {
  getMe: () => apiClient.get<User>('/users/me').then(r => r.data),
  updateMe: (name: string) => apiClient.put<User>('/users/me', { name }).then(r => r.data),
  getAll: () => apiClient.get<User[]>('/users/').then(r => r.data),
};
