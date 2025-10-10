import { apiClient } from './api';

export interface Student {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  studentNumber: string;
  major?: string;
  year: number;
  fingerprintId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BiometricVerificationRequest {
  studentId: number;
  action: 'enroll' | 'verify';
}

export interface BiometricStatus {
  status: 'waiting' | 'processing' | 'success' | 'error' | 'retry';
  message: string;
  attempts: number;
  maxAttempts: number;
}

export const studentService = {
  async getAllStudents(): Promise<Student[]> {
    return await apiClient.get('/students');
  },

  async getStudentById(id: number): Promise<Student> {
    return await apiClient.get(`/students/${id}`);
  },

  async createStudent(student: Omit<Student, 'id'>): Promise<Student> {
    return await apiClient.post('/students', student);
  },

  async updateStudent(id: number, student: Partial<Student>): Promise<Student> {
    return await apiClient.put(`/students/${id}`, student);
  },

  async deleteStudent(id: number): Promise<void> {
    await apiClient.delete(`/students/${id}`);
  },

  async searchStudents(query: string): Promise<Student[]> {
    return await apiClient.get(`/students/search?q=${encodeURIComponent(query)}`);
  },

  // Biometric verification methods
  async startBiometricEnrollment(studentId: number): Promise<{ success: boolean; sessionId: string }> {
    return await apiClient.post('/students/biometric/enroll', { studentId });
  },

  async getBiometricStatus(sessionId: string): Promise<BiometricStatus> {
    return await apiClient.get(`/students/biometric/status/${sessionId}`);
  },

  async cancelBiometricSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/students/biometric/session/${sessionId}`);
  },

  async verifyStudentFingerprint(studentId: number): Promise<{ success: boolean; confidence: number }> {
    return await apiClient.post('/students/biometric/verify', { studentId });
  },
};