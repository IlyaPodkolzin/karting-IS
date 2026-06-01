import { apiClient } from './client';

export const uploadsApi = {
  uploadKartodromeImage: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<{ image_url: string }>(`/uploads/kartodrome/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  uploadKartImage: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<{ image_url: string }>(`/uploads/kart/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  uploadUserAvatar: (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<{ image_url: string }>(`/uploads/user/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
};
