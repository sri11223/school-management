import { DatabaseManager } from '../database/DatabaseManager';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export interface Student {
  id?: number;
  admission_number: string;
  roll_number?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  blood_group?: string;
  religion?: string;
  caste?: string;
  category?: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
  phone?: string;
  email?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  section_id?: number;
  admission_date: string;
  academic_year_id?: number;
  previous_school?: string;
  medical_conditions?: string;
  allergies?: string;
  emergency_contact?: string;
  photo_path?: string;
  birth_certificate_path?: string;
  aadhar_number?: string;
  status?: 'Active' | 'Inactive' | 'Transferred' | 'Dropped';
  created_at?: string;
  updated_at?: string;
}

export interface Parent {
  id?: number;
  student_id: number;
  relationship: 'Father' | 'Mother' | 'Guardian' | 'Other';
  name: string;
  occupation?: string;
  education?: string;
  phone: string;
  email?: string;
  address?: string;
  annual_income?: number;
  is_primary_contact?: boolean;
  created_at?: string;
}

export interface StudentFilters {
  section_id?: number;
  academic_year_id?: number;
  status?: string;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class StudentService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  public async getAllStudents(
    page: number = 1,
    limit: number = 10,
    filters: StudentFilters = {}
  ): Promise<PaginatedResult<Student>> {
    const offset = (page - 1) * limit;
    let whereConditions: string[] = [];
    let params: any[] = [];

    // Build WHERE clause based on filters
    if (filters.section_id) {
      whereConditions.push('s.section_id = ?');
      params.push(filters.section_id);
    }

    if (filters.academic_year_id) {
      whereConditions.push('s.academic_year_id = ?');
      params.push(filters.academic_year_id);
    }

    if (filters.status) {
      whereConditions.push('s.status = ?');
      params.push(filters.status);
    }

    if (filters.search) {
      whereConditions.push(
        '(s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)'
      );
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM students s 
      ${whereClause}
    `;
    const countResult = await this.dbManager.getOne(countQuery, params);
    const total = countResult.total;

    // Get paginated data - use simpler query that doesn't require all tables
    let dataQuery;
    try {
      // First try a simpler query without joins to test if tables exist
      await this.dbManager.getOne("SELECT 1 FROM sections LIMIT 1");
      await this.dbManager.getOne("SELECT 1 FROM academic_years LIMIT 1");
      
      // If we get here, both tables exist
      dataQuery = `
        SELECT s.*, sec.section_name, c.name as class_name,
               ay.year_name as academic_year
        FROM students s
        LEFT JOIN sections sec ON s.section_id = sec.id
        LEFT JOIN classes c ON sec.class_id = c.id
        LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `;
    } catch (error) {
      // If tables don't exist yet, use a simpler query
      logger.warn('Some tables do not exist yet. Using simplified student query.');
      dataQuery = `
        SELECT s.*
        FROM students s
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `;
    }
    
    const students = await this.dbManager.getAll(dataQuery, [...params, limit, offset]);

    return {
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  public async getStudentById(id: number): Promise<Student | null> {
    const query = `
      SELECT s.*, sec.section_name, c.name as class_name,
             ay.year_name as academic_year
      FROM students s
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN classes c ON sec.class_id = c.id
      LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
      WHERE s.id = ?
    `;
    
    const student = await this.dbManager.getOne(query, [id]);
    return student || null;
  }

  public async getStudentByAdmissionNumber(admissionNumber: string): Promise<Student | null> {
    const query = `
      SELECT s.*, sec.section_name, c.name as class_name,
             ay.year_name as academic_year
      FROM students s
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN classes c ON sec.class_id = c.id
      LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
      WHERE s.admission_number = ?
    `;
    
    const student = await this.dbManager.getOne(query, [admissionNumber]);
    return student || null;
  }

  public async createStudent(studentData: Student): Promise<Student> {
    // Check if admission number already exists
    const existingStudent = await this.getStudentByAdmissionNumber(studentData.admission_number);
    if (existingStudent) {
      throw new ValidationError(`Student with admission number ${studentData.admission_number} already exists`);
    }

    const query = `
      INSERT INTO students (
        admission_number, roll_number, first_name, last_name, date_of_birth,
        gender, blood_group, religion, caste, category, phone, email, address,
        city, state, pincode, section_id, admission_date, academic_year_id,
        previous_school, medical_conditions, allergies, emergency_contact,
        photo_path, birth_certificate_path, aadhar_number, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      studentData.admission_number,
      studentData.roll_number,
      studentData.first_name,
      studentData.last_name,
      studentData.date_of_birth,
      studentData.gender,
      studentData.blood_group,
      studentData.religion,
      studentData.caste,
      studentData.category,
      studentData.phone,
      studentData.email,
      studentData.address,
      studentData.city,
      studentData.state,
      studentData.pincode,
      studentData.section_id,
      studentData.admission_date,
      studentData.academic_year_id,
      studentData.previous_school,
      studentData.medical_conditions,
      studentData.allergies,
      studentData.emergency_contact,
      studentData.photo_path,
      studentData.birth_certificate_path,
      studentData.aadhar_number,
      studentData.status || 'Active'
    ];

    const result = await this.dbManager.runQuery(query, params);
    const newStudent = await this.getStudentById(result.lastID);
    
    if (!newStudent) {
      throw new Error('Failed to create student');
    }

    return newStudent;
  }

  public async updateStudent(id: number, studentData: Partial<Student>): Promise<Student | null> {
    const existingStudent = await this.getStudentById(id);
    if (!existingStudent) {
      throw new NotFoundError('Student not found');
    }

    // Check if admission number conflicts with another student
    if (studentData.admission_number && studentData.admission_number !== existingStudent.admission_number) {
      const conflictingStudent = await this.getStudentByAdmissionNumber(studentData.admission_number);
      if (conflictingStudent && conflictingStudent.id !== id) {
        throw new ValidationError(`Student with admission number ${studentData.admission_number} already exists`);
      }
    }

    const fields = Object.keys(studentData).filter(key => key !== 'id' && studentData[key as keyof Student] !== undefined);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => studentData[field as keyof Student]);

    const query = `
      UPDATE students 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    await this.dbManager.runQuery(query, [...values, id]);
    return await this.getStudentById(id);
  }

  public async deleteStudent(id: number): Promise<void> {
    const existingStudent = await this.getStudentById(id);
    if (!existingStudent) {
      throw new NotFoundError('Student not found');
    }

    // Soft delete - update status to 'Inactive'
    await this.dbManager.runQuery(
      'UPDATE students SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['Inactive', id]
    );
  }

  public async getStudentParents(studentId: number): Promise<Parent[]> {
    const query = 'SELECT * FROM parents WHERE student_id = ? ORDER BY is_primary_contact DESC, created_at';
    return await this.dbManager.getAll(query, [studentId]);
  }

  public async addStudentParent(studentId: number, parentData: Omit<Parent, 'id' | 'student_id' | 'created_at'>): Promise<Parent> {
    const query = `
      INSERT INTO parents (
        student_id, relationship, name, occupation, education, phone, 
        email, address, annual_income, is_primary_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      studentId,
      parentData.relationship,
      parentData.name,
      parentData.occupation,
      parentData.education,
      parentData.phone,
      parentData.email,
      parentData.address,
      parentData.annual_income,
      parentData.is_primary_contact || false
    ];

    const result = await this.dbManager.runQuery(query, params);
    
    const newParent = await this.dbManager.getOne(
      'SELECT * FROM parents WHERE id = ?',
      [result.lastID]
    );

    return newParent;
  }
}
