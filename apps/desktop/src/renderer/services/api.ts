import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_BASE_URL, PaginatedResponse } from '../types';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic GET request
  async get<T>(url: string, params?: any): Promise<T> {
    try {
      const response = await this.client.get<T>(url, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic POST request
  async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic PUT request
  async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic DELETE request
  async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.client.delete<T>(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // File upload
  async uploadFile(url: string, file: File, additionalData?: any): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (additionalData) {
        Object.keys(additionalData).forEach(key => {
          formData.append(key, additionalData[key]);
        });
      }

      const response = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || error.response.data?.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other error
      return new Error('An unexpected error occurred');
    }
  }
}

export const apiClient = new APIClient();

// Health Check
export const healthAPI = {
  check: () => apiClient.get('/health'),
  checkAPI: () => apiClient.get('/api/health'),
};

// Student APIs
export const studentAPI = {
  getAll: (params?: any) => apiClient.get<PaginatedResponse<any>>('/students', params),
  getById: (id: number) => apiClient.get(`/students/${id}`),
  getByAdmissionNumber: (admissionNumber: string) => apiClient.get(`/students/admission-number/${admissionNumber}`),
  create: (data: any) => apiClient.post('/students', data),
  update: (id: number, data: any) => apiClient.put(`/students/${id}`, data),
  delete: (id: number) => apiClient.delete(`/students/${id}`),
  getParents: (id: number) => apiClient.get(`/students/${id}/parents`),
  addParent: (id: number, data: any) => apiClient.post(`/students/${id}/parents`, data),
};

// Class APIs
export const classAPI = {
  getAll: (params?: any) => apiClient.get<PaginatedResponse<any>>('/classes', params),
  getById: (id: number) => apiClient.get(`/classes/${id}`),
  create: (data: any) => apiClient.post('/classes', data),
  update: (id: number, data: any) => apiClient.put(`/classes/${id}`, data),
  delete: (id: number) => apiClient.delete(`/classes/${id}`),
  getStatistics: (id: number) => apiClient.get(`/classes/${id}/statistics`),
  getByLevel: (level: number) => apiClient.get(`/classes/level/${level}`),
  
  // Section APIs
  getAllSections: (params?: any) => apiClient.get<PaginatedResponse<any>>('/classes/sections/all', params),
  getSectionsByClass: (classId: number) => apiClient.get(`/classes/${classId}/sections`),
  getSectionById: (sectionId: number) => apiClient.get(`/classes/sections/${sectionId}`),
  createSection: (data: any) => apiClient.post('/classes/sections', data),
  updateSection: (sectionId: number, data: any) => apiClient.put(`/classes/sections/${sectionId}`, data),
  deleteSection: (sectionId: number) => apiClient.delete(`/classes/sections/${sectionId}`),
  getSectionStudents: (sectionId: number, params?: any) => apiClient.get(`/classes/sections/${sectionId}/students`, params),
  getSectionStatistics: (sectionId: number) => apiClient.get(`/classes/sections/${sectionId}/statistics`),
  getSectionsByTeacher: (teacherId: number) => apiClient.get(`/classes/teacher/${teacherId}/sections`),
};

// Teacher APIs
export const teacherAPI = {
  getAll: (params?: any) => apiClient.get<PaginatedResponse<any>>('/teachers', params),
  getById: (id: number) => apiClient.get(`/teachers/${id}`),
  create: (data: any) => apiClient.post('/teachers', data),
  update: (id: number, data: any) => apiClient.put(`/teachers/${id}`, data),
  delete: (id: number) => apiClient.delete(`/teachers/${id}`),
};

// Attendance APIs
export const attendanceAPI = {
  getRecords: (params?: any) => apiClient.get('/attendance', params),
  markAttendance: (data: any) => apiClient.post('/attendance', data),
  getStudentSummary: (studentId: number, params?: any) => apiClient.get(`/attendance/student/${studentId}/summary`, params),
};

// Exam APIs
export const examAPI = {
  getAll: (params?: any) => apiClient.get<PaginatedResponse<any>>('/exams', params),
  getById: (id: number) => apiClient.get(`/exams/${id}`),
  create: (data: any) => apiClient.post('/exams', data),
  update: (id: number, data: any) => apiClient.put(`/exams/${id}`, data),
  delete: (id: number) => apiClient.delete(`/exams/${id}`),
  getResults: (id: number) => apiClient.get(`/exams/${id}/results`),
  enterMarks: (data: any) => apiClient.post('/exams/marks', data),
};

// Fee APIs
export const feeAPI = {
  getStructure: (params?: any) => apiClient.get('/fees/structure', params),
  getStudentStatus: (studentId: number) => apiClient.get(`/fees/student/${studentId}/status`),
  recordPayment: (data: any) => apiClient.post('/fees/payment', data),
};

// Analytics APIs
export const analyticsAPI = {
  getDashboard: () => apiClient.get('/analytics/dashboard'),
  getStudentPerformance: (studentId: number) => apiClient.get(`/analytics/student/${studentId}/performance`),
  getClassPerformance: (classId: number) => apiClient.get(`/analytics/class/${classId}/performance`),
};

// AI APIs
export const aiAPI = {
  generateStudyMaterial: (data: any) => apiClient.post('/ai/generate-study-material', data),
  tutoring: (data: any) => apiClient.post('/ai/tutoring', data),
  generateLearningPath: (data: any) => apiClient.post('/ai/learning-path', data),
};

// WhatsApp APIs
export const whatsappAPI = {
  sendMessage: (data: any) => apiClient.post('/whatsapp/send', data),
  sendTemplate: (data: any) => apiClient.post('/whatsapp/send-template', data),
  getMessageStatus: (id: number) => apiClient.get(`/whatsapp/status/${id}`),
};

// File APIs
export const fileAPI = {
  upload: (file: File, additionalData?: any) => apiClient.uploadFile('/files/upload', file, additionalData),
  getInfo: (id: number) => apiClient.get(`/files/${id}`),
  download: (id: number) => apiClient.get(`/files/${id}/download`, { responseType: 'blob' }),
};

// Auth APIs
export const authAPI = {
  login: (credentials: { username: string; password: string }) => apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/profile'),
};
