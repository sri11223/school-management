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
  getById: (id: string) => apiClient.get(`/classes/${id}`),
  create: (data: any) => apiClient.post('/classes', data),
  update: (id: string, data: any) => apiClient.put(`/classes/${id}`, data),
  delete: (id: string) => apiClient.delete(`/classes/${id}`),
  getStatistics: (id: string) => apiClient.get(`/classes/${id}/statistics`),
  getPerformance: (id: string) => apiClient.get(`/classes/${id}/performance`),
  getByLevel: (level: number) => apiClient.get(`/classes/level/${level}`),
  
  // Students in class
  getStudents: (id: string, params?: any) => apiClient.get(`/classes/${id}/students`, params),
  createStudent: (data: any) => apiClient.post('/classes/students', data),
  updateStudent: (studentId: number, data: any) => apiClient.put(`/classes/students/${studentId}`, data),
  deleteStudent: (studentId: number) => apiClient.delete(`/classes/students/${studentId}`),
  getStudentPerformance: (studentId: number) => apiClient.get(`/classes/students/${studentId}/performance`),
  getStudentAttendanceStats: (studentId: number, params: { month: number; year: number }) => 
    apiClient.get(`/classes/students/${studentId}/attendance-stats`, params),
  
  // Exams
  getExams: (id: string, params?: any) => apiClient.get(`/classes/${id}/exams`, params),
  createExam: (data: any) => apiClient.post('/classes/exams', data),
  updateExam: (examId: number, data: any) => apiClient.put(`/classes/exams/${examId}`, data),
  deleteExam: (examId: number) => apiClient.delete(`/classes/exams/${examId}`),
  
  // Attendance
  getAttendance: (id: string, params: { date: string; page?: number; limit?: number }) => 
    apiClient.get(`/classes/${id}/attendance`, params),
  markAttendance: (data: any) => apiClient.post('/classes/attendance', data),
  
  // Section APIs
  getAllSections: (params?: any) => apiClient.get<PaginatedResponse<any>>('/classes/sections/all', params),
  getSectionStudents: (sectionId: string, params?: any) => apiClient.get(`/classes/sections/${sectionId}/students`, params),
  getSectionById: (sectionId: string) => apiClient.get(`/classes/sections/${sectionId}`),
  createSection: (data: any) => apiClient.post('/classes/sections', data),
  updateSection: (sectionId: string, data: any) => apiClient.put(`/classes/sections/${sectionId}`, data),
  deleteSection: (sectionId: string) => apiClient.delete(`/classes/sections/${sectionId}`),
  getSectionStatistics: (sectionId: string) => apiClient.get(`/classes/sections/${sectionId}/statistics`),
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
  // Student attendance
  getStudentAttendance: (studentId: number, params?: any) => 
    apiClient.get<PaginatedResponse<any>>(`/attendance/student/${studentId}`, params),
  getStudentStats: (studentId: number, params: { startDate: string; endDate: string }) => 
    apiClient.get(`/attendance/stats/${studentId}`, params),
  
  // Class attendance
  getClassAttendance: (classId: number, date: string) => 
    apiClient.get(`/attendance/class/${classId}/${date}`),
  markAttendance: (data: any) => apiClient.post('/attendance/mark', data),
  markBulkAttendance: (data: any) => apiClient.post('/attendance/bulk', data),
  
  // Reports and analytics
  getAttendanceReport: (classId: number, params: { startDate: string; endDate: string }) => 
    apiClient.get(`/attendance/report/${classId}`, params),
  getAttendanceTrends: (classId: number, params: { startDate: string; endDate: string }) => 
    apiClient.get(`/attendance/trends/${classId}`, params),
  getLowAttendanceStudents: (classId: number, params: { startDate: string; endDate: string; threshold?: number }) => 
    apiClient.get(`/attendance/low-attendance/${classId}`, params),
  getMonthlyAttendance: (classId: number, year: number, month: number) => 
    apiClient.get(`/attendance/monthly/${classId}/${year}/${month}`),
  
  // CRUD operations
  updateAttendance: (id: number, data: any) => apiClient.put(`/attendance/${id}`, data),
  deleteAttendance: (id: number) => apiClient.delete(`/attendance/${id}`)
};

// Exam APIs
export const examAPI = {
  // Basic CRUD
  getAll: (params?: any) => apiClient.get<PaginatedResponse<any>>('/exams', params),
  getById: (id: number) => apiClient.get(`/exams/${id}`),
  create: (data: any) => apiClient.post('/exams', data),
  update: (id: number, data: any) => apiClient.put(`/exams/${id}`, data),
  delete: (id: number) => apiClient.delete(`/exams/${id}`),
  
  // Questions
  getQuestions: (examId: number) => apiClient.get(`/exams/${examId}/questions`),
  addQuestion: (examId: number, data: any) => apiClient.post(`/exams/${examId}/questions`, data),
  updateQuestion: (questionId: number, data: any) => apiClient.put(`/exams/questions/${questionId}`, data),
  deleteQuestion: (questionId: number) => apiClient.delete(`/exams/questions/${questionId}`),
  generateQuestionsWithAI: (examId: number, data: any) => apiClient.post(`/exams/${examId}/generate-questions`, data),
  
  // Results
  getResults: (examId: number, params?: any) => apiClient.get(`/exams/${examId}/results`, params),
  addResult: (data: any) => apiClient.post('/exams/results', data),
  updateResult: (resultId: number, data: any) => apiClient.put(`/exams/results/${resultId}`, data),
  
  // Statistics and analytics
  getStatistics: (examId: number) => apiClient.get(`/exams/${examId}/statistics`),
  getUpcomingExams: (classId?: number, limit?: number) => apiClient.get('/exams/upcoming', { classId, limit })
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
