import { DatabaseManager } from '../database/DatabaseManager';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export interface Class {
  id?: string; // Updated to UUID
  name: string;
  numeric_level: number;
  academic_year: string;
  strength?: number;
  created_at?: string;
  number_of_students?: number;
  number_of_sections?: number;
}

export interface Section {
  id?: number;
  class_id: number;
  section_name: string;
  class_teacher_id?: number;
  max_students?: number;
  room_number?: string;
  created_at?: string;
}

export interface ClassWithSections extends Class {
  sections?: Section[];
  academic_year: string; // Removed optional modifier to match Class
}

export interface SectionWithDetails extends Section {
  class_name?: string;
  class_teacher_name?: string;
  student_count?: number;
}

export interface ClassFilters {
  numeric_level?: number;
  academic_year?: string;
  search?: string;
}

export interface SectionFilters {
  class_id?: number;
  class_teacher_id?: number;
  search?: string;
}

export interface Student {
  id?: number;
  admission_number: string;
  roll_number?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  section_id: string;
  academic_year: string;
  phone?: string;
  email?: string;
  address: string;
  status?: 'Active' | 'Inactive' | 'Transferred' | 'Dropped';
  created_at?: string;
}

export interface Exam {
  id?: number;
  name: string;
  exam_type_id: number;
  class_id: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  status?: 'Planned' | 'Ongoing' | 'Completed' | 'Cancelled';
  created_at?: string;
}

export interface AttendanceRecord {
  id?: number;
  student_id: number;
  section_id: string;
  attendance_date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Sick Leave' | 'Permission';
  marked_by: number;
  remarks?: string;
  marked_at?: string;
}

export class ClassService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  // ==================== CLASS METHODS ====================

  async getAllClasses(page: number = 1, limit: number = 10, filters: ClassFilters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT c.*, 
             COUNT(*) OVER() as total_count
      FROM classes c
      WHERE 1=1
    `;
    const params: any[] = [];

    // Apply filters
    if (filters.numeric_level) {
      query += ` AND c.numeric_level = ?`;
      params.push(filters.numeric_level);
    }

    if (filters.academic_year) {
      query += ` AND c.academic_year = ?`;
      params.push(filters.academic_year);
    }

    if (filters.search) {
      query += ` AND c.name LIKE ?`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm);
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await this.dbManager.getAll(query, params);
    return result;
  }

  async getClassById(id: string, includeSections: boolean = false): Promise<ClassWithSections | null> {
    const query = `
      SELECT c.*, c.created_at
      FROM classes c
      WHERE c.id = ?
    `;
    
    const classRecord = await this.dbManager.getOne(query, [id]);
    if (!classRecord) {
      return null;
    }

    let sections = [];
    if (includeSections) {
      sections = await this.getSectionsByClassId(id);
    }

    return {
      ...classRecord,
      sections
    };
  }

  async createClass(classData: Class): Promise<Class> {
    const query = `
      INSERT INTO classes (id, name, numeric_level, academic_year, strength, number_of_students, number_of_sections, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const id = classData.id || this.generateUUID();

    // Ensure numeric fields are integers
    const numberOfStudents = parseInt(classData.number_of_students as unknown as string, 10) || 0;
    const numberOfSections = parseInt(classData.number_of_sections as unknown as string, 10) || 0;
    const numericLevel = parseInt(classData.numeric_level as unknown as string, 10);

    if (isNaN(numericLevel)) {
      throw new ValidationError('Numeric level is required and must be a valid number');
    }

    logger.info('Validated numeric fields:', {
      numberOfStudents,
      numberOfSections,
      numericLevel
    });

    // Validate required fields
    if (!classData.name || typeof classData.name !== 'string') {
      logger.warn('Class name is missing or invalid. Using fallback name.');
      classData.name = `Class_${id.substring(0, 8)}`; // Generate a default name based on the UUID
    }

    if (!classData.numeric_level || typeof classData.numeric_level !== 'number') {
      throw new ValidationError('Numeric level is required and must be a number');
    }

    if (!classData.academic_year || typeof classData.academic_year !== 'string') {
      throw new ValidationError('Academic year is required and must be a string');
    }

    // Provide default values for optional fields
    classData.strength = classData.strength || 0;
    classData.number_of_students = classData.number_of_students || 0;
    classData.number_of_sections = classData.number_of_sections || 0;

    const params = [
      id,
      classData.name,
      classData.numeric_level,
      classData.academic_year,
      classData.strength,
      numberOfStudents,
      numberOfSections
    ];

    // Logging the class creation details
    logger.info('Executing createClass with data:', classData);
    logger.info('SQL Query:', query);
    logger.info('Parameters:', params);

    await this.dbManager.runQuery(query, params);

    // Dynamically create sections based on number_of_sections
    if (numberOfSections && numberOfSections > 0) {
      for (let i = 1; i <= numberOfSections; i++) {
        const sectionQuery = `
          INSERT INTO sections (id, class_id, section_name, created_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `;
        const sectionId = this.generateUUID();
        const sectionName = `Section ${i}`;
        
        logger.info('Creating section with data:', {
          sectionId,
          classId: id,
          sectionName
        });
        logger.info('Section SQL Query:', sectionQuery);
        logger.info('Section Parameters:', [sectionId, id, sectionName]);
        
        try {
          await this.dbManager.runQuery(sectionQuery, [sectionId, id, sectionName]);
          logger.info(`Section ${i} created successfully`);
        } catch (sectionError) {
          logger.error(`Error creating section ${i}:`, sectionError);
          throw sectionError;
        }
      }
    }

    return { ...classData, id };
  }

  private generateUUID(): string {
    return require('crypto').randomUUID();
  }

  async updateClass(id: string, classData: Partial<Class>): Promise<Class> {
    const existingClass = await this.dbManager.getOne('SELECT * FROM classes WHERE id = ?', [id]);
    if (!existingClass) {
      throw new NotFoundError('Class not found');
    }

    // Check if name and academic year combination is being changed and if it already exists
    if (classData.name || classData.academic_year) {
      const name = classData.name || existingClass.name;
      const academicYear = classData.academic_year || existingClass.academic_year;

      const existingQuery = `
        SELECT COUNT(*) as count 
        FROM classes 
        WHERE name = ? AND academic_year = ? AND id != ?
      `;
      const existing = await this.dbManager.getAll(existingQuery, [name, academicYear, id]);
      
      if (existing[0].count > 0) {
        throw new ValidationError('Class with this name and academic year already exists');
      }
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    Object.entries(classData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      return existingClass;
    }

    params.push(id);
    const query = `UPDATE classes SET ${updateFields.join(', ')} WHERE id = ?`;
    await this.dbManager.runQuery(query, params);

    const updatedClass = await this.dbManager.getOne('SELECT * FROM classes WHERE id = ?', [id]);
    return updatedClass as Class;
  }

  async deleteClass(id: string): Promise<void> {
    const existingClass = await this.dbManager.getOne('SELECT * FROM classes WHERE id = ?', [id]);
    if (!existingClass) {
      throw new NotFoundError('Class not found');
    }

    // Check if class has sections
    const sectionQuery = `SELECT COUNT(*) as count FROM sections WHERE class_id = ?`;
    const sectionCount = await this.dbManager.getAll(sectionQuery, [id]);
    if (sectionCount[0].count > 0) {
      throw new ValidationError('Cannot delete class that has sections. Delete sections first.');
    }

    // Check if class has students (through sections)
    const studentQuery = `
      SELECT COUNT(*) as count 
      FROM students s 
      JOIN sections sec ON s.section_id = sec.id 
      WHERE sec.class_id = ?
    `;
    const studentCount = await this.dbManager.getAll(studentQuery, [id]);
    if (studentCount[0].count > 0) {
      throw new ValidationError('Cannot delete class that has students. Move students to another class first.');
    }

    const query = `DELETE FROM classes WHERE id = ?`;
    await this.dbManager.runQuery(query, [id]);
  }

  // ==================== SECTION METHODS ====================

  async getAllSections(page: number = 1, limit: number = 10, filters: SectionFilters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT s.*, 
             c.name as class_name,
             c.numeric_level,
             u.first_name || ' ' || u.last_name as class_teacher_name,
             COUNT(st.id) as student_count,
             COUNT(*) OVER() as total_count
      FROM sections s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN users u ON s.class_teacher_id = u.id
      LEFT JOIN students st ON st.section_id = s.id AND st.status = 'Active'
      WHERE 1=1
    `;
    const params: any[] = [];

    // Apply filters
    if (filters.class_id) {
      query += ` AND s.class_id = ?`;
      params.push(filters.class_id);
    }

    if (filters.class_teacher_id) {
      query += ` AND s.class_teacher_id = ?`;
      params.push(filters.class_teacher_id);
    }

    if (filters.search) {
      query += ` AND (s.section_name LIKE ? OR c.name LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ` 
      GROUP BY s.id 
      ORDER BY c.numeric_level, s.section_name 
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const sections = await this.dbManager.getAll(query, params);
    const totalCount = sections.length > 0 ? sections[0].total_count : 0;

    // Remove total_count from individual records
    sections.forEach(section => delete section.total_count);

    return {
      sections,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  async getSectionsByClassId(classId: string): Promise<Section[]> {
    const query = `
      SELECT s.*
      FROM sections s
      WHERE s.class_id = ?
    `;

    const sections = await this.dbManager.getAll(query, [classId]);
    return sections;
  }

  async getSectionById(id: number): Promise<SectionWithDetails | null> {
    const query = `
      SELECT s.*, 
             c.name as class_name,
             c.numeric_level,
             u.first_name || ' ' || u.last_name as class_teacher_name,
             COUNT(st.id) as student_count
      FROM sections s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN users u ON s.class_teacher_id = u.id
      LEFT JOIN students st ON st.section_id = s.id AND st.status = 'Active'
      WHERE s.id = ?
      GROUP BY s.id
    `;
    
    const section = await this.dbManager.getOne(query, [id]);
    return section || null;
  }

  async createSection(sectionData: Omit<Section, 'id' | 'created_at'>): Promise<Section> {
    // Check if section with same name in the same class already exists
    const existingQuery = `
      SELECT COUNT(*) as count 
      FROM sections 
      WHERE class_id = ? AND section_name = ?
    `;
    const existing = await this.dbManager.getAll(existingQuery, [
      sectionData.class_id, 
      sectionData.section_name
    ]);
    
    if (existing[0].count > 0) {
      throw new ValidationError('Section with this name already exists in this class');
    }

    const query = `
      INSERT INTO sections (
        class_id, section_name, class_teacher_id, 
        max_students, room_number
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      sectionData.class_id,
      sectionData.section_name,
      sectionData.class_teacher_id || null,
      sectionData.max_students || 50,
      sectionData.room_number || null
    ];

    const result = await this.dbManager.runQuery(query, params);
    const newSection = await this.dbManager.getOne(
      'SELECT * FROM sections WHERE id = ?', 
      [result.lastID!]
    );
    return newSection as Section;
  }

  async updateSection(id: number, sectionData: Partial<Section>): Promise<Section> {
    const existingSection = await this.dbManager.getOne('SELECT * FROM sections WHERE id = ?', [id]);
    if (!existingSection) {
      throw new NotFoundError('Section not found');
    }

    // Check if class_id and section_name combination is being changed and if it already exists
    if (sectionData.class_id || sectionData.section_name) {
      const classId = sectionData.class_id || existingSection.class_id;
      const sectionName = sectionData.section_name || existingSection.section_name;

      const existingQuery = `
        SELECT COUNT(*) as count 
        FROM sections 
        WHERE class_id = ? AND section_name = ? AND id != ?
      `;
      const existing = await this.dbManager.getAll(existingQuery, [classId, sectionName, id]);
      
      if (existing[0].count > 0) {
        throw new ValidationError('Section with this name already exists in this class');
      }
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    Object.entries(sectionData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      return existingSection;
    }

    params.push(id);
    const query = `UPDATE sections SET ${updateFields.join(', ')} WHERE id = ?`;
    await this.dbManager.runQuery(query, params);

    const updatedSection = await this.dbManager.getOne('SELECT * FROM sections WHERE id = ?', [id]);
    return updatedSection as Section;
  }

  async deleteSection(id: number): Promise<void> {
    const existingSection = await this.dbManager.getOne('SELECT * FROM sections WHERE id = ?', [id]);
    if (!existingSection) {
      throw new NotFoundError('Section not found');
    }

    // Check if section has students
    const studentQuery = `SELECT COUNT(*) as count FROM students WHERE section_id = ?`;
    const studentCount = await this.dbManager.getAll(studentQuery, [id]);
    if (studentCount[0].count > 0) {
      throw new ValidationError('Cannot delete section that has students. Move students to another section first.');
    }

    const query = `DELETE FROM sections WHERE id = ?`;
    await this.dbManager.runQuery(query, [id]);
  }

  // ==================== STUDENT METHODS ====================

  async getStudentsByClassId(classId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT s.*, 
             sec.section_name,
             COUNT(*) OVER() as total_count
      FROM students s
      JOIN sections sec ON s.section_id = sec.id
      WHERE sec.class_id = ? AND s.status = 'Active'
      ORDER BY sec.section_name, s.roll_number, s.first_name
      LIMIT ? OFFSET ?
    `;
    
    const students = await this.dbManager.getAll(query, [classId, limit, offset]);
    const totalCount = students.length > 0 ? students[0].total_count : 0;

    // Remove total_count from individual records
    students.forEach(student => delete student.total_count);

    return {
      students,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  async getStudentsBySectionId(sectionId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT s.*, 
             COUNT(*) OVER() as total_count
      FROM students s
      WHERE s.section_id = ? AND s.status = 'Active'
      ORDER BY s.roll_number, s.first_name, s.last_name
      LIMIT ? OFFSET ?
    `;
    
    const students = await this.dbManager.getAll(query, [sectionId, limit, offset]);
    const totalCount = students.length > 0 ? students[0].total_count : 0;

    students.forEach(student => delete student.total_count);

    return {
      students,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  async createStudent(studentData: Student): Promise<Student> {
    const query = `
      INSERT INTO students (
        admission_number, roll_number, first_name, last_name, 
        date_of_birth, gender, section_id, academic_year,
        phone, email, address, admission_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      studentData.admission_number,
      studentData.roll_number || null,
      studentData.first_name,
      studentData.last_name,
      studentData.date_of_birth,
      studentData.gender,
      studentData.section_id,
      studentData.academic_year,
      studentData.phone || null,
      studentData.email || null,
      studentData.address,
      new Date().toISOString().split('T')[0], // Current date as admission_date
      studentData.status || 'Active'
    ];

    const result = await this.dbManager.runQuery(query, params);
    const newStudent = await this.dbManager.getOne(
      'SELECT * FROM students WHERE id = ?', 
      [result.lastID!]
    );
    return newStudent as Student;
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<Student> {
    const existingStudent = await this.dbManager.getOne('SELECT * FROM students WHERE id = ?', [id]);
    if (!existingStudent) {
      throw new NotFoundError('Student not found');
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    Object.entries(studentData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      return existingStudent;
    }

    params.push(id);
    const query = `UPDATE students SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await this.dbManager.runQuery(query, params);

    const updatedStudent = await this.dbManager.getOne('SELECT * FROM students WHERE id = ?', [id]);
    return updatedStudent as Student;
  }

  async deleteStudent(id: number): Promise<void> {
    const existingStudent = await this.dbManager.getOne('SELECT * FROM students WHERE id = ?', [id]);
    if (!existingStudent) {
      throw new NotFoundError('Student not found');
    }

    // Soft delete by updating status
    await this.dbManager.runQuery('UPDATE students SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['Inactive', id]);
  }

  // ==================== EXAM METHODS ====================

  async getExamsByClassId(classId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT e.*, 
             et.name as exam_type_name,
             COUNT(*) OVER() as total_count
      FROM exams e
      JOIN exam_types et ON e.exam_type_id = et.id
      WHERE e.class_id = ?
      ORDER BY e.start_date DESC
      LIMIT ? OFFSET ?
    `;
    
    const exams = await this.dbManager.getAll(query, [classId, limit, offset]);
    const totalCount = exams.length > 0 ? exams[0].total_count : 0;

    exams.forEach(exam => delete exam.total_count);

    return {
      exams,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  async createExam(examData: Exam): Promise<Exam> {
    const query = `
      INSERT INTO exams (
        name, exam_type_id, class_id, academic_year,
        start_date, end_date, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      examData.name,
      examData.exam_type_id,
      examData.class_id,
      examData.academic_year,
      examData.start_date,
      examData.end_date,
      examData.status || 'Planned',
      1 // Default created_by user ID
    ];

    const result = await this.dbManager.runQuery(query, params);
    const newExam = await this.dbManager.getOne(
      'SELECT * FROM exams WHERE id = ?', 
      [result.lastID!]
    );
    return newExam as Exam;
  }

  async updateExam(id: number, examData: Partial<Exam>): Promise<Exam> {
    const existingExam = await this.dbManager.getOne('SELECT * FROM exams WHERE id = ?', [id]);
    if (!existingExam) {
      throw new NotFoundError('Exam not found');
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    Object.entries(examData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      return existingExam;
    }

    params.push(id);
    const query = `UPDATE exams SET ${updateFields.join(', ')} WHERE id = ?`;
    await this.dbManager.runQuery(query, params);

    const updatedExam = await this.dbManager.getOne('SELECT * FROM exams WHERE id = ?', [id]);
    return updatedExam as Exam;
  }

  async deleteExam(id: number): Promise<void> {
    const existingExam = await this.dbManager.getOne('SELECT * FROM exams WHERE id = ?', [id]);
    if (!existingExam) {
      throw new NotFoundError('Exam not found');
    }

    await this.dbManager.runQuery('DELETE FROM exams WHERE id = ?', [id]);
  }

  // ==================== ATTENDANCE METHODS ====================

  async getAttendanceByClassId(classId: string, date: string, page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT ar.*, 
             s.first_name, s.last_name, s.roll_number,
             sec.section_name,
             COUNT(*) OVER() as total_count
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      JOIN sections sec ON ar.section_id = sec.id
      WHERE sec.class_id = ? AND ar.attendance_date = ?
      ORDER BY sec.section_name, s.roll_number
      LIMIT ? OFFSET ?
    `;
    
    const attendance = await this.dbManager.getAll(query, [classId, date, limit, offset]);
    const totalCount = attendance.length > 0 ? attendance[0].total_count : 0;

    attendance.forEach(record => delete record.total_count);

    return {
      attendance,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  async markAttendance(attendanceData: AttendanceRecord): Promise<AttendanceRecord> {
    // Check if attendance already exists for this student and date
    const existingQuery = `
      SELECT id FROM attendance_records 
      WHERE student_id = ? AND attendance_date = ?
    `;
    const existing = await this.dbManager.getOne(existingQuery, [
      attendanceData.student_id, 
      attendanceData.attendance_date
    ]);

    if (existing) {
      // Update existing record
      const updateQuery = `
        UPDATE attendance_records 
        SET status = ?, remarks = ?, marked_by = ?, marked_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      await this.dbManager.runQuery(updateQuery, [
        attendanceData.status,
        attendanceData.remarks || null,
        attendanceData.marked_by,
        existing.id
      ]);

      return await this.dbManager.getOne('SELECT * FROM attendance_records WHERE id = ?', [existing.id]) as AttendanceRecord;
    } else {
      // Create new record
      const insertQuery = `
        INSERT INTO attendance_records (
          student_id, section_id, attendance_date, status, marked_by, remarks
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;
      const params = [
        attendanceData.student_id,
        attendanceData.section_id,
        attendanceData.attendance_date,
        attendanceData.status,
        attendanceData.marked_by,
        attendanceData.remarks || null
      ];

      const result = await this.dbManager.runQuery(insertQuery, params);
      const newRecord = await this.dbManager.getOne(
        'SELECT * FROM attendance_records WHERE id = ?', 
        [result.lastID!]
      );
      return newRecord as AttendanceRecord;
    }
  }

  async getStudentAttendanceStats(studentId: number, month: number, year: number) {
    const query = `
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days
      FROM attendance_records 
      WHERE student_id = ? 
        AND strftime('%m', attendance_date) = ? 
        AND strftime('%Y', attendance_date) = ?
    `;
    
    const stats = await this.dbManager.getOne(query, [
      studentId, 
      month.toString().padStart(2, '0'), 
      year.toString()
    ]);
    
    const percentage = stats.total_days > 0 ? 
      Math.round((stats.present_days / stats.total_days) * 100) : 0;

    return {
      ...stats,
      percentage
    };
  }

  // ==================== PERFORMANCE METHODS ====================

  async getClassPerformanceStats(classId: string) {
    const query = `
      SELECT 
        AVG(sm.marks_obtained) as average_marks,
        COUNT(DISTINCT s.id) as total_students,
        COUNT(DISTINCT e.id) as total_exams,
        AVG(attendance_summary.percentage) as average_attendance
      FROM students s
      JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN student_marks sm ON s.id = sm.student_id
      LEFT JOIN exam_subjects es ON sm.exam_subject_id = es.id
      LEFT JOIN exams e ON es.exam_id = e.id
      LEFT JOIN attendance_summary ON s.id = attendance_summary.student_id
      WHERE sec.class_id = ? AND s.status = 'Active'
    `;
    
    return await this.dbManager.getOne(query, [classId]);
  }

  async getStudentPerformanceAnalysis(studentId: number) {
    const marksQuery = `
      SELECT 
        e.name as exam_name,
        sub.name as subject_name,
        sm.marks_obtained,
        es.max_marks,
        sm.grade,
        e.start_date
      FROM student_marks sm
      JOIN exam_subjects es ON sm.exam_subject_id = es.id
      JOIN exams e ON es.exam_id = e.id
      JOIN subjects sub ON es.subject_id = sub.id
      WHERE sm.student_id = ?
      ORDER BY e.start_date DESC
      LIMIT 10
    `;

    const attendanceQuery = `
      SELECT 
        strftime('%Y-%m', attendance_date) as month,
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days
      FROM attendance_records
      WHERE student_id = ?
      GROUP BY strftime('%Y-%m', attendance_date)
      ORDER BY month DESC
      LIMIT 6
    `;

    const [marks, attendance] = await Promise.all([
      this.dbManager.getAll(marksQuery, [studentId]),
      this.dbManager.getAll(attendanceQuery, [studentId])
    ]);

    return {
      recentMarks: marks,
      attendanceTrend: attendance.map(a => ({
        ...a,
        percentage: Math.round((a.present_days / a.total_days) * 100)
      }))
    };
  }

  async getClassStatistics(classId: string) {
    const query = `
      SELECT 
        c.*,
        COUNT(DISTINCT s.id) as student_count,
        COUNT(DISTINCT sec.id) as section_count,
        AVG(CASE WHEN ar.status = 'Present' THEN 1.0 ELSE 0.0 END) * 100 as attendance_percentage
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      LEFT JOIN sections sec ON sec.class_id = c.id  
      LEFT JOIN attendance_records ar ON ar.student_id = s.id 
        AND ar.attendance_date >= date('now', '-30 days')
      WHERE c.id = ?
      GROUP BY c.id
    `;

    return await this.dbManager.getOne(query, [classId]);
  }

  async getClassesByNumericLevel(level: number) {
    const query = `
      SELECT c.*, COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      WHERE c.numeric_level = ?
      GROUP BY c.id
      ORDER BY c.name
    `;

    return await this.dbManager.getAll(query, [level]);
  }

  async getSectionStudents(classId: string, sectionId?: number, page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT s.*, sec.section_name, c.name as class_name,
             COUNT(*) OVER() as total_count
      FROM students s
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN classes c ON sec.class_id = c.id
      WHERE c.id = ?
    `;
    const params: any[] = [classId];

    if (sectionId) {
      query += ` AND s.section_id = ?`;
      params.push(sectionId);
    }

    query += ` ORDER BY s.first_name, s.last_name LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await this.dbManager.getAll(query, params);
  }

  async getSectionStatistics(sectionId: number) {
    const query = `
      SELECT 
        sec.*,
        c.name as class_name,
        COUNT(s.id) as student_count,
        AVG(CASE WHEN ar.status = 'Present' THEN 1.0 ELSE 0.0 END) * 100 as attendance_percentage
      FROM sections sec
      JOIN classes c ON sec.class_id = c.id
      LEFT JOIN students s ON s.section_id = sec.id
      LEFT JOIN attendance_records ar ON ar.student_id = s.id 
        AND ar.attendance_date >= date('now', '-30 days')
      WHERE sec.id = ?
      GROUP BY sec.id
    `;

    return await this.dbManager.getOne(query, [sectionId]);
  }

  async getSectionsByTeacher(teacherId: number) {
    const query = `
      SELECT sec.*, c.name as class_name,
             COUNT(s.id) as student_count
      FROM sections sec
      JOIN classes c ON sec.class_id = c.id
      LEFT JOIN students s ON s.section_id = sec.id
      WHERE sec.class_teacher_id = ?
      GROUP BY sec.id
      ORDER BY c.numeric_level, sec.section_name
    `;

    return await this.dbManager.getAll(query, [teacherId]);
  }

  async getStudentsBySection(sectionId: number, page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT s.*, sec.section_name, c.name as class_name,
             COUNT(*) OVER() as total_count
      FROM students s
      JOIN sections sec ON s.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      WHERE s.section_id = ?
      ORDER BY s.first_name, s.last_name
      LIMIT ? OFFSET ?
    `;

    return await this.dbManager.getAll(query, [sectionId, limit, offset]);
  }
}
