import { apiClient } from './client';
import type { TokenResponse } from '@/types';

export const authApi = {
  register: (name: string, email: string, password: string) =>
    apiClient.post<TokenResponse>('/auth/register', { name, email, password }).then(r => r.data),

  login: (email: string, password: string) =>
    apiClient.post<TokenResponse>('/auth/login', { email, password }).then(r => r.data),
};
