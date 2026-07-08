import { api } from "./api";
import { API_ENDPOINTS } from "./constants";

export interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at?: string | null;
}

export interface ApiKeyCreateResponse extends ApiKeyItem {
  secret_key: string;
}

export const apiKeyService = {
  list: async (): Promise<ApiKeyItem[]> => {
    const res = await api.get(API_ENDPOINTS.API_KEYS);
    return res.data;
  },

  create: async (name: string): Promise<ApiKeyCreateResponse> => {
    const res = await api.post(API_ENDPOINTS.API_KEYS, { name });
    return res.data;
  },

  rename: async (id: string, name: string): Promise<ApiKeyItem> => {
    const res = await api.patch(`${API_ENDPOINTS.API_KEYS}/${id}/rename`, { name });
    return res.data;
  },

  toggleStatus: async (id: string, is_active: boolean): Promise<ApiKeyItem> => {
    const res = await api.patch(`${API_ENDPOINTS.API_KEYS}/${id}/status`, { is_active });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${API_ENDPOINTS.API_KEYS}/${id}`);
  },
};
