import { apiClient } from './api';

export interface AccessLogEntry {
  id: number | string;
  userId?: number | string | null;
  userName?: string | null;
  role?: string | null;
  timestamp: string; // ISO string
  method?: string; // e.g., 'fingerprint', 'card', 'manual'
  result?: 'granted' | 'denied' | string;
  details?: any;
}

export type AccessRange = 'day' | 'week' | 'month' | 'all';

export const accessLogService = {
  async getLogs(range: AccessRange = 'day'): Promise<AccessLogEntry[]> {
    if (range === 'all') {
      return await apiClient.get('/access-logs');
    }

    return await apiClient.get(`/access-logs?range=${range}`);
  },

  async getLatest(limit = 50): Promise<AccessLogEntry[]> {
    return await apiClient.get(`/access-logs/latest?limit=${limit}`);
  },
};

export default accessLogService;
