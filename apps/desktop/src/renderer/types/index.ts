// API Configuration and Types
export const API_BASE_URL = 'http://localhost:3001/api';

// Student Types
export interface Student {
  id?: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  phone?: string;
  email?: string;
  admission_date: string;
  academic_year_id: number;
  section_id?: number;
  category: string;
  status?: 'Active' | 'Inactive' | 'Transferred';
  created_at?: string;
}

// Class Types
export interface Class {
  id?: number;
  name: string;
  numeric_level: number;
  academic_year_id: number;
  created_at?: string;
}

export interface Section {
  id?: number;
  class_id: number;
  name: string;
  section_name: string;
  class_teacher_id?: number;
  max_students?: number;
  room_number?: string;
  created_at?: string;
}

export interface ClassWithSections extends Class {
  sections?: Section[];
  academic_year?: string;
}

// Teacher Types
export interface Teacher {
  id?: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  employee_id?: string;
  department?: string;
  subjects_taught?: string[];
  status?: 'Active' | 'Inactive';
  created_at?: string;
}

// Attendance Types
export interface AttendanceRecord {
  id?: number;
  student_id: number;
  section_id: number;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks?: string;
  marked_by?: number;
  created_at?: string;
}

// Exam Types
export interface Exam {
  id?: number;
  name: string;
  description?: string;
  exam_type: 'quiz' | 'test' | 'midterm' | 'final' | 'assignment';
  exam_type_id: number;
  class_id: number;
  section_id: number;
  subject: string;
  date: string;
  duration: number; // in minutes
  max_marks: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  academic_year_id: number;
  start_date: string;
  end_date: string;
  instructions?: string;
  created_at?: string;
}

export interface ExamResult {
  id?: number;
  exam_id: number;
  student_id: number;
  marks_obtained: number;
  grade?: string;
  remarks?: string;
  created_at?: string;
  exam?: Exam;
  student?: Student;
}

// Fee Types
export interface FeeStructure {
  id?: number;
  class_id: number;
  academic_year_id: number;
  fee_category_id: number;
  amount: number;
  due_date: string;
  is_mandatory: boolean;
  created_at?: string;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Dashboard Analytics Types
export interface DashboardAnalytics {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceToday: number;
  monthlyAttendance: {
    month: string;
    percentage: number;
  }[];
  recentActivities: {
    type: string;
    message: string;
    timestamp: string;
  }[];
}

// Common UI Types
export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType;
  badge?: number;
}

export interface TableColumn {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea';
  required?: boolean;
  options?: { value: string | number; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Theme Colors for Indian Schools
export const THEME_COLORS = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
  },
  secondary: {
    main: '#ff9800',
    light: '#ffb74d',
    dark: '#f57c00',
  },
  success: {
    main: '#4caf50',
    light: '#81c784',
    dark: '#388e3c',
  },
  warning: {
    main: '#ff9800',
    light: '#ffb74d',
    dark: '#f57c00',
  },
  error: {
    main: '#f44336',
    light: '#e57373',
    dark: '#d32f2f',
  },
  info: {
    main: '#2196f3',
    light: '#64b5f6',
    dark: '#1976d2',
  },
};

// Status Colors
export const STATUS_COLORS = {
  Active: '#4caf50',
  Inactive: '#f44336',
  Present: '#4caf50',
  Absent: '#f44336',
  Late: '#ff9800',
  Excused: '#2196f3',
  Paid: '#4caf50',
  Pending: '#ff9800',
  Overdue: '#f44336',
};
