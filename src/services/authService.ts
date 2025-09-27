import { apiClient } from './api';

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

interface RegisterResponse {
  success: boolean;
  message: string;
}

export const authService = {
  async login(identifier: string, password: string): Promise<LoginResponse> {
    return await apiClient.post('/auth/login', { identifier, password });
  },

  async register(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<RegisterResponse> {
    return await apiClient.post('/auth/register', userData);
  },

  async getCurrentUser() {
    return await apiClient.get('/auth/me');
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async refreshToken(): Promise<string> {
    const response = await apiClient.post('/auth/refresh');
    return response.token;
  },
};