import { apiClient } from './api';

export interface SerialPort {
  port: string;
  name: string;
  description: string;
  manufacturer?: string;
}

export interface ArduinoStatus {
  connected: boolean;
  port: string | null;
  lastSeen: string | null;
  firmware: string | null;
}

export const arduinoService = {
  async getAvailablePorts(): Promise<SerialPort[]> {
    return await apiClient.get('/arduino/ports');
  },

  async getConnectionStatus(): Promise<ArduinoStatus> {
    return await apiClient.get('/arduino/status');
  },

  async connectToPort(port: string): Promise<{ success: boolean; message: string }> {
    return await apiClient.post('/arduino/connect', { port });
  },

  async disconnect(): Promise<{ success: boolean; message: string }> {
    return await apiClient.post('/arduino/disconnect');
  },

  async testConnection(): Promise<{ success: boolean; response: string }> {
    return await apiClient.post('/arduino/test-capture');
  },

  async refreshPorts(): Promise<SerialPort[]> {
    return await apiClient.get('/arduino/refresh-ports');
  },

  async getFirmwareInfo(): Promise<{ version: string; build: string; features: string[] }> {
    return await apiClient.get('/arduino/firmware');
  },
};