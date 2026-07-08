import { api } from "./api";
import { API_ENDPOINTS } from "./constants";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export const authService = {
  async loginWithGoogle(code: string, redirectUri?: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(API_ENDPOINTS.AUTH_GOOGLE, { 
      code, 
      redirect_uri: redirectUri || window.location.origin + "/auth/callback" 
    });
    return response.data;
  },

  async refreshSession(): Promise<{ access_token: string }> {
    const response = await api.post<{ access_token: string }>(API_ENDPOINTS.AUTH_REFRESH);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post(API_ENDPOINTS.AUTH_LOGOUT);
  },

  async getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>(API_ENDPOINTS.AUTH_ME);
    return response.data;
  },
};
