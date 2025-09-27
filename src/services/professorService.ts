import { apiClient } from './api';

export interface Professor {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  employeeNumber: string;
  department: string;
  title: string;
  fingerprintId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const professorService = {
  async getAllProfessors(): Promise<Professor[]> {
    return await apiClient.get('/professors');
  },

  async getProfessorById(id: number): Promise<Professor> {
    return await apiClient.get(`/professors/${id}`);
  },

  async createProfessor(professor: Omit<Professor, 'id'>): Promise<Professor> {
    return await apiClient.post('/professors', professor);
  },

  async updateProfessor(id: number, professor: Partial<Professor>): Promise<Professor> {
    return await apiClient.put(`/professors/${id}`, professor);
  },

  async deleteProfessor(id: number): Promise<void> {
    await apiClient.delete(`/professors/${id}`);
  },

  async searchProfessors(query: string): Promise<Professor[]> {
    return await apiClient.get(`/professors/search?q=${encodeURIComponent(query)}`);
  },

  // Biometric verification methods
  async startBiometricEnrollment(professorId: number): Promise<{ success: boolean; sessionId: string }> {
    return await apiClient.post('/professors/biometric/enroll', { professorId });
  },

  async getBiometricStatus(sessionId: string): Promise<any> {
    return await apiClient.get(`/professors/biometric/status/${sessionId}`);
  },

  async cancelBiometricSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/professors/biometric/session/${sessionId}`);
  },

  async verifyProfessorFingerprint(professorId: number): Promise<{ success: boolean; confidence: number }> {
    return await apiClient.post('/professors/biometric/verify', { professorId });
  },
};