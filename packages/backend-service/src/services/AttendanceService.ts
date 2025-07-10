import { DatabaseManager } from '../database/DatabaseManager';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

export interface Attendance {
  id?: number;
  student_id: number;
  class_id: string; // Changed to string for UUID
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Excused';
  check_in_time?: string;
  check_out_time?: string;
  remarks?: string;
  marked_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceFilters {
  class_id?: string; // Changed to string for UUID
  student_id?: number;
  date_from?: string;
  date_to?: string;
  status?: string;
}

export interface AttendanceStats {
  student_id: number;
  student_name: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_days: number;
  attendance_percentage: number;
}

export class AttendanceService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async markAttendance(attendanceData: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>): Promise<Attendance> {
    // Check if attendance for this student and date already exists
    const existingQuery = `
      SELECT COUNT(*) as count 
      FROM attendance_records 
      WHERE student_id = ? AND date = ?
    `;
    const existing = await this.dbManager.getAll(existingQuery, [attendanceData.student_id, attendanceData.date]);
    
    if (existing[0].count > 0) {
      throw new ValidationError('Attendance for this student and date already exists');
    }

    const query = `
      INSERT INTO attendance_records (
        student_id, class_id, date, status, check_in_time,
        check_out_time, remarks, marked_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      attendanceData.student_id,
      attendanceData.class_id,
      attendanceData.date,
      attendanceData.status,
      attendanceData.check_in_time,
      attendanceData.check_out_time,
      attendanceData.remarks,
      attendanceData.marked_by
    ];

    const result = await this.dbManager.runQuery(query, params);
    const attendance = await this.dbManager.getAll('SELECT * FROM attendance_records WHERE id = ?', [result.lastID]);
    return attendance[0];
  }

  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance> {
    const existingAttendance = await this.getAttendanceById(id);
    if (!existingAttendance) {
      throw new NotFoundError('Attendance record not found');
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    Object.entries(attendanceData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      return existingAttendance;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE attendance SET ${updateFields.join(', ')} WHERE id = ?`;
    await this.dbManager.runQuery(query, params);

    return await this.getAttendanceById(id) as Attendance;
  }

  async getAttendanceById(id: number): Promise<Attendance | null> {
    const query = `SELECT * FROM attendance_records WHERE id = ?`;
    const attendance = await this.dbManager.getAll(query, [id]);
    return attendance.length > 0 ? attendance[0] : null;
  }

  async markBulkAttendance(classId: string, date: string, attendanceList: Array<{student_id: number, status: string, remarks?: string}>, markedBy: number): Promise<void> {
    // Begin transaction
    await this.dbManager.beginTransaction();
    
    try {
      for (const record of attendanceList) {
        await this.markAttendance({
          student_id: record.student_id,
          class_id: classId,
          date,
          status: record.status as any,
          remarks: record.remarks,
          marked_by: markedBy
        });
      }
      
      await this.dbManager.commit();
    } catch (error) {
      await this.dbManager.rollback();
      throw error;
    }
  }

  async getClassAttendance(classId: string, date: string): Promise<any[]> {
    const query = `
      SELECT 
        s.id as student_id,
        s.first_name || ' ' || s.last_name as student_name,
        s.admission_number,
        s.roll_number,
        ar.id as attendance_id,
        ar.status,
        ar.check_in_time,
        ar.check_out_time,
        ar.remarks
      FROM students s
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN classes c ON sec.class_id = c.id
      LEFT JOIN attendance_records ar ON s.id = ar.student_id AND ar.date = ?
      WHERE c.id = ?
      ORDER BY s.roll_number, s.first_name
    `;
    
    return await this.dbManager.getAll(query, [date, classId]);
  }

  async getStudentAttendance(studentId: number, page: number = 1, limit: number = 10, filters: AttendanceFilters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        a.*,
        c.name as class_name,
        COUNT(*) OVER() as total_count
      FROM attendance_records a
      JOIN classes c ON a.class_id = c.id
      WHERE a.student_id = ?
    `;
    const params: any[] = [studentId];

    // Apply filters
    if (filters.date_from) {
      query += ` AND a.date >= ?`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ` AND a.date <= ?`;
      params.push(filters.date_to);
    }

    if (filters.status) {
      query += ` AND a.status = ?`;
      params.push(filters.status);
    }

    query += ` ORDER BY a.date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const attendance = await this.dbManager.getAll(query, params);
    const totalCount = attendance.length > 0 ? attendance[0].total_count : 0;

    // Remove total_count from individual records
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

  async getAttendanceReport(classId: number, startDate: string, endDate: string): Promise<AttendanceStats[]> {
    const query = `
      SELECT 
        s.id as student_id,
        s.first_name || ' ' || s.last_name as student_name,
        s.admission_number,
        s.roll_number,
        COUNT(CASE WHEN a.date BETWEEN ? AND ? THEN 1 END) as total_days,
        COUNT(CASE WHEN a.status = 'Present' AND a.date BETWEEN ? AND ? THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'Absent' AND a.date BETWEEN ? AND ? THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'Late' AND a.date BETWEEN ? AND ? THEN 1 END) as late_days,
        COUNT(CASE WHEN a.status = 'Half Day' AND a.date BETWEEN ? AND ? THEN 1 END) as half_days,
        ROUND(
          (COUNT(CASE WHEN a.status IN ('Present', 'Late', 'Half Day') AND a.date BETWEEN ? AND ? THEN 1 END) * 100.0) / 
          NULLIF(COUNT(CASE WHEN a.date BETWEEN ? AND ? THEN 1 END), 0), 2
        ) as attendance_percentage
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id
      WHERE s.class_id = ? AND s.status = 'Active'
      GROUP BY s.id, s.first_name, s.last_name, s.admission_number, s.roll_number
      ORDER BY s.roll_number, s.first_name
    `;

    const params = [
      startDate, endDate, // total_days
      startDate, endDate, // present_days  
      startDate, endDate, // absent_days
      startDate, endDate, // late_days
      startDate, endDate, // half_days
      startDate, endDate, // attendance_percentage numerator
      startDate, endDate, // attendance_percentage denominator
      classId
    ];

    return await this.dbManager.getAll(query, params);
  }

  async getStudentAttendanceStats(studentId: number, startDate: string, endDate: string): Promise<AttendanceStats> {
    const query = `
      SELECT 
        s.id as student_id,
        s.first_name || ' ' || s.last_name as student_name,
        COUNT(CASE WHEN a.date BETWEEN ? AND ? THEN 1 END) as total_days,
        COUNT(CASE WHEN a.status = 'Present' AND a.date BETWEEN ? AND ? THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'Absent' AND a.date BETWEEN ? AND ? THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'Late' AND a.date BETWEEN ? AND ? THEN 1 END) as late_days,
        COUNT(CASE WHEN a.status = 'Half Day' AND a.date BETWEEN ? AND ? THEN 1 END) as half_days,
        ROUND(
          (COUNT(CASE WHEN a.status IN ('Present', 'Late', 'Half Day') AND a.date BETWEEN ? AND ? THEN 1 END) * 100.0) / 
          NULLIF(COUNT(CASE WHEN a.date BETWEEN ? AND ? THEN 1 END), 0), 2
        ) as attendance_percentage
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id
      WHERE s.id = ?
    `;

    const params = [
      startDate, endDate, // total_days
      startDate, endDate, // present_days
      startDate, endDate, // absent_days
      startDate, endDate, // late_days
      startDate, endDate, // half_days
      startDate, endDate, // attendance_percentage numerator
      startDate, endDate, // attendance_percentage denominator
      studentId
    ];

    const stats = await this.dbManager.getAll(query, params);
    return stats[0];
  }

  async getAttendanceTrends(classId: number, startDate: string, endDate: string) {
    const query = `
      SELECT 
        a.date,
        COUNT(*) as total_students,
        COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN a.status = 'Late' THEN 1 END) as late_count,
        ROUND(
          (COUNT(CASE WHEN a.status IN ('Present', 'Late', 'Half Day') THEN 1 END) * 100.0) / COUNT(*), 2
        ) as attendance_percentage
      FROM attendance_records a
      WHERE a.class_id = ? AND a.date BETWEEN ? AND ?
      GROUP BY a.date
      ORDER BY a.date
    `;

    return await this.dbManager.getAll(query, [classId, startDate, endDate]);
  }

  async getLowAttendanceStudents(classId: number, startDate: string, endDate: string, threshold: number = 75): Promise<AttendanceStats[]> {
    const stats = await this.getAttendanceReport(classId, startDate, endDate);
    return stats.filter(student => student.attendance_percentage < threshold);
  }

  async deleteAttendance(id: number): Promise<void> {
    const existingAttendance = await this.getAttendanceById(id);
    if (!existingAttendance) {
      throw new NotFoundError('Attendance record not found');
    }

    const query = `DELETE FROM attendance_records WHERE id = ?`;
    await this.dbManager.runQuery(query, [id]);
  }

  async getMonthlyAttendanceSummary(classId: number, year: number, month: number) {
    const query = `
      SELECT 
        COUNT(DISTINCT a.student_id) as total_students,
        COUNT(DISTINCT a.date) as school_days,
        COUNT(CASE WHEN a.status = 'Present' THEN 1 END) as total_present,
        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) as total_absent,
        ROUND(
          (COUNT(CASE WHEN a.status IN ('Present', 'Late', 'Half Day') THEN 1 END) * 100.0) / 
          COUNT(*), 2
        ) as overall_attendance_percentage
      FROM attendance_records a
      WHERE a.class_id = ? 
      AND strftime('%Y', a.date) = ? 
      AND strftime('%m', a.date) = ?
    `;

    const monthStr = month.toString().padStart(2, '0');
    const stats = await this.dbManager.getAll(query, [classId, year.toString(), monthStr]);
    return stats[0];
  }

  async getTeacherAttendance(teacherId: number, page: number = 1, limit: number = 10, filters: { date_from?: string; date_to?: string; status?: string } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        ta.*,
        t.first_name || ' ' || t.last_name as teacher_name,
        t.employee_id,
        COUNT(*) OVER() as total_count
      FROM teacher_attendance ta
      JOIN teachers t ON ta.teacher_id = t.id
      WHERE ta.teacher_id = ?
    `;
    const params: any[] = [teacherId];

    // Apply filters
    if (filters.date_from) {
      query += ` AND ta.date >= ?`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ` AND ta.date <= ?`;
      params.push(filters.date_to);
    }

    if (filters.status) {
      query += ` AND ta.status = ?`;
      params.push(filters.status);
    }

    query += ` ORDER BY ta.date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const attendance = await this.dbManager.getAll(query, params);
    const totalCount = attendance.length > 0 ? attendance[0].total_count : 0;

    // Remove total_count from individual records
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

  async markTeacherAttendance(teacherId: number, date: string, status: string, remarks?: string): Promise<void> {
    // Check if attendance for this teacher and date already exists
    const existingQuery = `
      SELECT COUNT(*) as count 
      FROM teacher_attendance 
      WHERE teacher_id = ? AND date = ?
    `;
    const existing = await this.dbManager.getAll(existingQuery, [teacherId, date]);
    
    if (existing[0].count > 0) {
      throw new ValidationError('Attendance for this teacher and date already exists');
    }

    const query = `
      INSERT INTO teacher_attendance (teacher_id, date, status, remarks)
      VALUES (?, ?, ?, ?)
    `;

    await this.dbManager.runQuery(query, [teacherId, date, status, remarks]);
  }
}
