import { DatabaseManager } from '../database/DatabaseManager';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

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

export interface SectionWithDetails extends Section {
  class_name?: string;
  class_teacher_name?: string;
  student_count?: number;
}

export interface ClassFilters {
  numeric_level?: number;
  academic_year_id?: number;
  search?: string;
}

export interface SectionFilters {
  class_id?: number;
  class_teacher_id?: number;
  search?: string;
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
             ay.year_name as academic_year,
             COUNT(*) OVER() as total_count
      FROM classes c
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Apply filters
    if (filters.numeric_level) {
      query += ` AND c.numeric_level = ?`;
      params.push(filters.numeric_level);
    }

    if (filters.academic_year_id) {
      query += ` AND c.academic_year_id = ?`;
      params.push(filters.academic_year_id);
    }

    if (filters.search) {
      query += ` AND c.name LIKE ?`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm);
    }

    query += ` ORDER BY c.numeric_level LIMIT ? OFFSET ?`;
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

  async getClassById(id: number): Promise<ClassWithSections | null> {
    const query = `
      SELECT c.*, 
             ay.year_name as academic_year
      FROM classes c
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE c.id = ?
    `;
    
    const classRecord = await this.dbManager.getOne(query, [id]);
    if (!classRecord) {
      return null;
    }

    // Get sections for this class
    const sections = await this.getSectionsByClassId(id);
    
    return {
      ...classRecord,
      sections
    };
  }

  async createClass(classData: Omit<Class, 'id' | 'created_at'>): Promise<Class> {
    // Check if class with same name and academic year already exists
    const existingQuery = `
      SELECT COUNT(*) as count 
      FROM classes 
      WHERE name = ? AND academic_year_id = ?
    `;
    const existing = await this.dbManager.getAll(existingQuery, [
      classData.name, 
      classData.academic_year_id
    ]);
    
    if (existing[0].count > 0) {
      throw new ValidationError('Class with this name and academic year already exists');
    }

    const query = `
      INSERT INTO classes (name, numeric_level, academic_year_id) 
      VALUES (?, ?, ?)
    `;

    const params = [
      classData.name,
      classData.numeric_level,
      classData.academic_year_id
    ];

    const result = await this.dbManager.runQuery(query, params);
    const newClass = await this.dbManager.getOne(
      'SELECT * FROM classes WHERE id = ?', 
      [result.lastID!]
    );
    return newClass as Class;
  }

  async updateClass(id: number, classData: Partial<Class>): Promise<Class> {
    const existingClass = await this.dbManager.getOne('SELECT * FROM classes WHERE id = ?', [id]);
    if (!existingClass) {
      throw new NotFoundError('Class not found');
    }

    // Check if name and academic year combination is being changed and if it already exists
    if (classData.name || classData.academic_year_id) {
      const name = classData.name || existingClass.name;
      const academicYearId = classData.academic_year_id || existingClass.academic_year_id;

      const existingQuery = `
        SELECT COUNT(*) as count 
        FROM classes 
        WHERE name = ? AND academic_year_id = ? AND id != ?
      `;
      const existing = await this.dbManager.getAll(existingQuery, [name, academicYearId, id]);
      
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

  async deleteClass(id: number): Promise<void> {
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

  async getSectionsByClassId(classId: number): Promise<Section[]> {
    const query = `
      SELECT s.*, 
             u.first_name || ' ' || u.last_name as class_teacher_name,
             COUNT(st.id) as student_count
      FROM sections s
      LEFT JOIN users u ON s.class_teacher_id = u.id
      LEFT JOIN students st ON st.section_id = s.id AND st.status = 'Active'
      WHERE s.class_id = ?
      GROUP BY s.id
      ORDER BY s.section_name
    `;
    return await this.dbManager.getAll(query, [classId]);
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

  // ==================== UTILITY METHODS ====================

  async getClassesByNumericLevel(numericLevel: number): Promise<Class[]> {
    const query = `
      SELECT c.*, ay.year_name as academic_year
      FROM classes c
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE c.numeric_level = ?
      ORDER BY c.name
    `;
    return await this.dbManager.getAll(query, [numericLevel]);
  }

  async getSectionsByTeacher(teacherId: number): Promise<SectionWithDetails[]> {
    const query = `
      SELECT s.*, 
             c.name as class_name,
             c.numeric_level,
             COUNT(st.id) as student_count
      FROM sections s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN students st ON st.section_id = s.id AND st.status = 'Active'
      WHERE s.class_teacher_id = ?
      GROUP BY s.id
      ORDER BY c.numeric_level, s.section_name
    `;
    return await this.dbManager.getAll(query, [teacherId]);
  }

  async getSectionStudents(sectionId: number, page: number = 1, limit: number = 10) {
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

  async getClassStatistics(classId: number) {
    const totalSectionsQuery = `
      SELECT COUNT(*) as total_sections 
      FROM sections 
      WHERE class_id = ?
    `;
    
    const totalStudentsQuery = `
      SELECT COUNT(*) as total_students 
      FROM students st
      JOIN sections s ON st.section_id = s.id
      WHERE s.class_id = ? AND st.status = 'Active'
    `;
    
    const genderStatsQuery = `
      SELECT 
        st.gender,
        COUNT(*) as count
      FROM students st
      JOIN sections s ON st.section_id = s.id
      WHERE s.class_id = ? AND st.status = 'Active'
      GROUP BY st.gender
    `;

    const averageAgeQuery = `
      SELECT 
        AVG((julianday('now') - julianday(st.date_of_birth)) / 365.25) as average_age
      FROM students st
      JOIN sections s ON st.section_id = s.id
      WHERE s.class_id = ? AND st.status = 'Active'
    `;

    const [totalSections, totalStudents, genderStats, averageAge] = await Promise.all([
      this.dbManager.getAll(totalSectionsQuery, [classId]),
      this.dbManager.getAll(totalStudentsQuery, [classId]),
      this.dbManager.getAll(genderStatsQuery, [classId]),
      this.dbManager.getAll(averageAgeQuery, [classId])
    ]);

    return {
      totalSections: totalSections[0]?.total_sections || 0,
      totalStudents: totalStudents[0]?.total_students || 0,
      genderDistribution: genderStats,
      averageAge: Math.round((averageAge[0]?.average_age || 0) * 10) / 10
    };
  }

  async getSectionStatistics(sectionId: number) {
    const totalStudentsQuery = `
      SELECT COUNT(*) as total_students 
      FROM students 
      WHERE section_id = ? AND status = 'Active'
    `;
    
    const genderStatsQuery = `
      SELECT 
        gender,
        COUNT(*) as count
      FROM students 
      WHERE section_id = ? AND status = 'Active'
      GROUP BY gender
    `;

    const averageAgeQuery = `
      SELECT 
        AVG((julianday('now') - julianday(date_of_birth)) / 365.25) as average_age
      FROM students 
      WHERE section_id = ? AND status = 'Active'
    `;

    const capacityQuery = `
      SELECT max_students
      FROM sections 
      WHERE id = ?
    `;

    const [totalStudents, genderStats, averageAge, capacity] = await Promise.all([
      this.dbManager.getAll(totalStudentsQuery, [sectionId]),
      this.dbManager.getAll(genderStatsQuery, [sectionId]),
      this.dbManager.getAll(averageAgeQuery, [sectionId]),
      this.dbManager.getAll(capacityQuery, [sectionId])
    ]);

    const maxStudents = capacity[0]?.max_students || 50;
    const currentStudents = totalStudents[0]?.total_students || 0;

    return {
      totalStudents: currentStudents,
      maxStudents,
      capacityUtilization: Math.round((currentStudents / maxStudents) * 100),
      genderDistribution: genderStats,
      averageAge: Math.round((averageAge[0]?.average_age || 0) * 10) / 10
    };
  }
}
