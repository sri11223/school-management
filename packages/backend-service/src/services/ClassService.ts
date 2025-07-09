import { DatabaseManager } from '../database/DatabaseManager';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

export interface Class {
  id?: number;
  name: string;
  grade: number;
  section: string;
  academic_year_id: number;
  class_teacher_id?: number;
  capacity?: number;
  room_number?: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
}

export interface ClassFilters {
  grade?: number;
  academic_year_id?: number;
  class_teacher_id?: number;
  status?: string;
  search?: string;
}

export class ClassService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async getAllClasses(page: number = 1, limit: number = 10, filters: ClassFilters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT c.*, 
             t.first_name || ' ' || t.last_name as class_teacher_name,
             ay.year as academic_year,
             COUNT(*) OVER() as total_count
      FROM classes c
      LEFT JOIN teachers t ON c.class_teacher_id = t.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Apply filters
    if (filters.grade) {
      query += ` AND c.grade = ?`;
      params.push(filters.grade);
    }

    if (filters.academic_year_id) {
      query += ` AND c.academic_year_id = ?`;
      params.push(filters.academic_year_id);
    }

    if (filters.class_teacher_id) {
      query += ` AND c.class_teacher_id = ?`;
      params.push(filters.class_teacher_id);
    }

    if (filters.status) {
      query += ` AND c.status = ?`;
      params.push(filters.status);
    }

    if (filters.search) {
      query += ` AND (c.name LIKE ? OR c.section LIKE ? OR c.room_number LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY c.grade, c.section LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const classes = await this.dbManager.getAll(query, params);
    const totalCount = classes.length > 0 ? classes[0].total_count : 0;

    // Remove total_count from individual records
    classes.forEach(cls => delete cls.total_count);

    return {
      classes,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  async getClassById(id: number): Promise<Class | null> {
    const query = `
      SELECT c.*, 
             t.first_name || ' ' || t.last_name as class_teacher_name,
             ay.year as academic_year
      FROM classes c
      LEFT JOIN teachers t ON c.class_teacher_id = t.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE c.id = ?
    `;
    const classes = await this.dbManager.getAll(query, [id]);
    return classes.length > 0 ? classes[0] : null;
  }

  async createClass(classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>): Promise<Class> {
    // Check if class with same grade, section, and academic year already exists
    const existingQuery = `
      SELECT COUNT(*) as count 
      FROM classes 
      WHERE grade = ? AND section = ? AND academic_year_id = ?
    `;
    const existing = await this.dbManager.getAll(existingQuery, [
      classData.grade, 
      classData.section, 
      classData.academic_year_id
    ]);
    
    if (existing[0].count > 0) {
      throw new ValidationError('Class with this grade, section, and academic year already exists');
    }

    const query = `
      INSERT INTO classes (
        name, grade, section, academic_year_id, class_teacher_id,
        capacity, room_number, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      classData.name,
      classData.grade,
      classData.section,
      classData.academic_year_id,
      classData.class_teacher_id,
      classData.capacity,
      classData.room_number,
      classData.status || 'Active'
    ];

    const result = await this.dbManager.runQuery(query, params);
    return await this.getClassById(result.lastID!) as Class;
  }

  async updateClass(id: number, classData: Partial<Class>): Promise<Class> {
    const existingClass = await this.getClassById(id);
    if (!existingClass) {
      throw new NotFoundError('Class not found');
    }

    // Check if grade, section, academic year combination is being changed and if it already exists
    if (classData.grade || classData.section || classData.academic_year_id) {
      const grade = classData.grade || existingClass.grade;
      const section = classData.section || existingClass.section;
      const academicYearId = classData.academic_year_id || existingClass.academic_year_id;

      const existingQuery = `
        SELECT COUNT(*) as count 
        FROM classes 
        WHERE grade = ? AND section = ? AND academic_year_id = ? AND id != ?
      `;
      const existing = await this.dbManager.getAll(existingQuery, [grade, section, academicYearId, id]);
      
      if (existing[0].count > 0) {
        throw new ValidationError('Class with this grade, section, and academic year already exists');
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

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE classes SET ${updateFields.join(', ')} WHERE id = ?`;
    await this.dbManager.runQuery(query, params);

    return await this.getClassById(id) as Class;
  }

  async deleteClass(id: number): Promise<void> {
    const existingClass = await this.getClassById(id);
    if (!existingClass) {
      throw new NotFoundError('Class not found');
    }

    // Check if class has students
    const studentQuery = `SELECT COUNT(*) as count FROM students WHERE class_id = ?`;
    const studentCount = await this.dbManager.getAll(studentQuery, [id]);
    if (studentCount[0].count > 0) {
      throw new ValidationError('Cannot delete class that has students. Move students to another class first.');
    }

    const query = `DELETE FROM classes WHERE id = ?`;
    await this.dbManager.runQuery(query, [id]);
  }

  async getClassesByGrade(grade: number): Promise<Class[]> {
    const query = `
      SELECT c.*, 
             t.first_name || ' ' || t.last_name as class_teacher_name
      FROM classes c
      LEFT JOIN teachers t ON c.class_teacher_id = t.id
      WHERE c.grade = ? AND c.status = 'Active'
      ORDER BY c.section
    `;
    return await this.dbManager.getAll(query, [grade]);
  }

  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    const query = `
      SELECT c.*, 
             ay.year as academic_year
      FROM classes c
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE c.class_teacher_id = ?
      ORDER BY c.grade, c.section
    `;
    return await this.dbManager.getAll(query, [teacherId]);
  }

  async getClassStudents(classId: number, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT s.*, 
             COUNT(*) OVER() as total_count
      FROM students s
      WHERE s.class_id = ? AND s.status = 'Active'
      ORDER BY s.roll_number, s.first_name, s.last_name
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

  async getClassSubjects(classId: number) {
    const query = `
      SELECT 
        s.id,
        s.name as subject_name,
        s.code as subject_code,
        s.credits,
        t.first_name || ' ' || t.last_name as teacher_name,
        st.assigned_date
      FROM class_subjects cs
      JOIN subjects s ON cs.subject_id = s.id
      LEFT JOIN subject_teachers st ON s.id = st.subject_id AND st.class_id = cs.class_id
      LEFT JOIN teachers t ON st.teacher_id = t.id
      WHERE cs.class_id = ?
      ORDER BY s.name
    `;
    return await this.dbManager.getAll(query, [classId]);
  }

  async assignSubjectToClass(classId: number, subjectId: number): Promise<void> {
    // Check if assignment already exists
    const existingQuery = `
      SELECT COUNT(*) as count 
      FROM class_subjects 
      WHERE class_id = ? AND subject_id = ?
    `;
    const existing = await this.dbManager.getAll(existingQuery, [classId, subjectId]);
    
    if (existing[0].count > 0) {
      throw new ValidationError('Subject is already assigned to this class');
    }

    const query = `
      INSERT INTO class_subjects (class_id, subject_id, assigned_date)
      VALUES (?, ?, CURRENT_DATE)
    `;
    await this.dbManager.runQuery(query, [classId, subjectId]);
  }

  async removeSubjectFromClass(classId: number, subjectId: number): Promise<void> {
    const query = `
      DELETE FROM class_subjects 
      WHERE class_id = ? AND subject_id = ?
    `;
    const result = await this.dbManager.runQuery(query, [classId, subjectId]);
    
    if (result.changes === 0) {
      throw new NotFoundError('Subject assignment not found');
    }
  }

  async getClassStatistics(classId: number) {
    const totalStudentsQuery = `
      SELECT COUNT(*) as total_students 
      FROM students 
      WHERE class_id = ? AND status = 'Active'
    `;
    
    const genderStatsQuery = `
      SELECT 
        gender,
        COUNT(*) as count
      FROM students 
      WHERE class_id = ? AND status = 'Active'
      GROUP BY gender
    `;

    const averageAgeQuery = `
      SELECT 
        AVG((julianday('now') - julianday(date_of_birth)) / 365.25) as average_age
      FROM students 
      WHERE class_id = ? AND status = 'Active'
    `;

    const [totalStudents, genderStats, averageAge] = await Promise.all([
      this.dbManager.getAll(totalStudentsQuery, [classId]),
      this.dbManager.getAll(genderStatsQuery, [classId]),
      this.dbManager.getAll(averageAgeQuery, [classId])
    ]);

    return {
      totalStudents: totalStudents[0]?.total_students || 0,
      genderDistribution: genderStats,
      averageAge: Math.round((averageAge[0]?.average_age || 0) * 10) / 10
    };
  }
}
