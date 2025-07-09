import { DatabaseManager } from '../database/DatabaseManager';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

export interface Teacher {
  id?: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  gender: 'Male' | 'Female' | 'Other';
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  qualification: string;
  experience_years?: number;
  specialization?: string;
  date_of_joining: string;
  salary?: number;
  department?: string;
  designation: string;
  blood_group?: string;
  emergency_contact?: string;
  photo_path?: string;
  resume_path?: string;
  aadhaar_number?: string;
  pan_number?: string;
  bank_account?: string;
  bank_ifsc?: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  created_at?: string;
  updated_at?: string;
}

export interface TeacherFilters {
  department?: string;
  designation?: string;
  status?: string;
  search?: string;
}

export class TeacherService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async getAllTeachers(page: number = 1, limit: number = 10, filters: TeacherFilters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT t.*, 
             COUNT(*) OVER() as total_count
      FROM teachers t
      WHERE 1=1
    `;
    const params: any[] = [];

    // Apply filters
    if (filters.department) {
      query += ` AND t.department = ?`;
      params.push(filters.department);
    }

    if (filters.designation) {
      query += ` AND t.designation = ?`;
      params.push(filters.designation);
    }

    if (filters.status) {
      query += ` AND t.status = ?`;
      params.push(filters.status);
    }

    if (filters.search) {
      query += ` AND (t.first_name LIKE ? OR t.last_name LIKE ? OR t.employee_id LIKE ? OR t.email LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY t.first_name, t.last_name LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const teachers = await this.dbManager.getAll(query, params);
    const totalCount = teachers.length > 0 ? teachers[0].total_count : 0;

    // Remove total_count from individual records
    teachers.forEach(teacher => delete teacher.total_count);

    return {
      teachers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  async getTeacherById(id: number): Promise<Teacher | null> {
    const query = `SELECT * FROM teachers WHERE id = ?`;
    const teachers = await this.dbManager.getAll(query, [id]);
    return teachers.length > 0 ? teachers[0] : null;
  }

  async getTeacherByEmployeeId(employeeId: string): Promise<Teacher | null> {
    const query = `SELECT * FROM teachers WHERE employee_id = ?`;
    const teachers = await this.dbManager.getAll(query, [employeeId]);
    return teachers.length > 0 ? teachers[0] : null;
  }

  async createTeacher(teacherData: Omit<Teacher, 'id' | 'created_at' | 'updated_at'>): Promise<Teacher> {
    // Check if employee ID already exists
    const existingTeacher = await this.getTeacherByEmployeeId(teacherData.employee_id);
    if (existingTeacher) {
      throw new ValidationError('Teacher with this employee ID already exists');
    }

    const query = `
      INSERT INTO teachers (
        employee_id, first_name, last_name, email, phone, date_of_birth,
        gender, address, city, state, pincode, qualification, experience_years,
        specialization, date_of_joining, salary, department, designation,
        blood_group, emergency_contact, photo_path, resume_path,
        aadhaar_number, pan_number, bank_account, bank_ifsc, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      teacherData.employee_id,
      teacherData.first_name,
      teacherData.last_name,
      teacherData.email,
      teacherData.phone,
      teacherData.date_of_birth,
      teacherData.gender,
      teacherData.address,
      teacherData.city,
      teacherData.state,
      teacherData.pincode,
      teacherData.qualification,
      teacherData.experience_years,
      teacherData.specialization,
      teacherData.date_of_joining,
      teacherData.salary,
      teacherData.department,
      teacherData.designation,
      teacherData.blood_group,
      teacherData.emergency_contact,
      teacherData.photo_path,
      teacherData.resume_path,
      teacherData.aadhaar_number,
      teacherData.pan_number,
      teacherData.bank_account,
      teacherData.bank_ifsc,
      teacherData.status || 'Active'
    ];

    const result = await this.dbManager.runQuery(query, params);
    return await this.getTeacherById(result.lastID!) as Teacher;
  }

  async updateTeacher(id: number, teacherData: Partial<Teacher>): Promise<Teacher> {
    const existingTeacher = await this.getTeacherById(id);
    if (!existingTeacher) {
      throw new NotFoundError('Teacher not found');
    }

    // Check if employee ID is being changed and if it already exists
    if (teacherData.employee_id && teacherData.employee_id !== existingTeacher.employee_id) {
      const existingWithEmployeeId = await this.getTeacherByEmployeeId(teacherData.employee_id);
      if (existingWithEmployeeId) {
        throw new ValidationError('Teacher with this employee ID already exists');
      }
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    Object.entries(teacherData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      return existingTeacher;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE teachers SET ${updateFields.join(', ')} WHERE id = ?`;
    await this.dbManager.runQuery(query, params);

    return await this.getTeacherById(id) as Teacher;
  }

  async deleteTeacher(id: number): Promise<void> {
    const existingTeacher = await this.getTeacherById(id);
    if (!existingTeacher) {
      throw new NotFoundError('Teacher not found');
    }

    // Check if teacher has classes assigned
    const classQuery = `SELECT COUNT(*) as count FROM classes WHERE class_teacher_id = ?`;
    const classCount = await this.dbManager.getAll(classQuery, [id]);
    if (classCount[0].count > 0) {
      throw new ValidationError('Cannot delete teacher who is assigned as class teacher');
    }

    // Check if teacher has subjects assigned
    const subjectQuery = `SELECT COUNT(*) as count FROM subject_teachers WHERE teacher_id = ?`;
    const subjectCount = await this.dbManager.getAll(subjectQuery, [id]);
    if (subjectCount[0].count > 0) {
      throw new ValidationError('Cannot delete teacher who has subjects assigned. Remove subject assignments first.');
    }

    const query = `DELETE FROM teachers WHERE id = ?`;
    await this.dbManager.runQuery(query, [id]);
  }

  async getTeachersByDepartment(department: string): Promise<Teacher[]> {
    const query = `SELECT * FROM teachers WHERE department = ? AND status = 'Active' ORDER BY first_name, last_name`;
    return await this.dbManager.getAll(query, [department]);
  }

  async getTeacherSubjects(teacherId: number) {
    const query = `
      SELECT 
        s.id,
        s.name as subject_name,
        s.code as subject_code,
        c.name as class_name,
        c.grade,
        st.assigned_date
      FROM subject_teachers st
      JOIN subjects s ON st.subject_id = s.id
      JOIN classes c ON st.class_id = c.id
      WHERE st.teacher_id = ?
      ORDER BY c.grade, s.name
    `;
    return await this.dbManager.getAll(query, [teacherId]);
  }

  async assignSubjectToTeacher(teacherId: number, subjectId: number, classId: number): Promise<void> {
    // Check if assignment already exists
    const existingQuery = `
      SELECT COUNT(*) as count 
      FROM subject_teachers 
      WHERE teacher_id = ? AND subject_id = ? AND class_id = ?
    `;
    const existing = await this.dbManager.getAll(existingQuery, [teacherId, subjectId, classId]);
    
    if (existing[0].count > 0) {
      throw new ValidationError('Teacher is already assigned to this subject and class');
    }

    const query = `
      INSERT INTO subject_teachers (teacher_id, subject_id, class_id, assigned_date)
      VALUES (?, ?, ?, CURRENT_DATE)
    `;
    await this.dbManager.runQuery(query, [teacherId, subjectId, classId]);
  }

  async removeSubjectFromTeacher(teacherId: number, subjectId: number, classId: number): Promise<void> {
    const query = `
      DELETE FROM subject_teachers 
      WHERE teacher_id = ? AND subject_id = ? AND class_id = ?
    `;
    const result = await this.dbManager.runQuery(query, [teacherId, subjectId, classId]);
    
    if (result.changes === 0) {
      throw new NotFoundError('Subject assignment not found');
    }
  }

  async getTeacherAttendanceStats(teacherId: number, startDate: string, endDate: string) {
    const query = `
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN status = 'Half Day' THEN 1 ELSE 0 END) as half_days
      FROM teacher_attendance 
      WHERE teacher_id = ? AND date BETWEEN ? AND ?
    `;
    const stats = await this.dbManager.getAll(query, [teacherId, startDate, endDate]);
    return stats[0];
  }
}
