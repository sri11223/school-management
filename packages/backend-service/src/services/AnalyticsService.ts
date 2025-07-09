import { DatabaseManager } from '../database/DatabaseManager';
import { NotFoundError } from '../middleware/errorHandler';

export interface AnalyticsFilters {
  class_id?: number;
  academic_year_id?: number;
  subject_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface StudentPerformanceMetrics {
  student_id: number;
  student_name: string;
  admission_number: string;
  total_exams: number;
  average_marks: number;
  average_percentage: number;
  highest_marks: number;
  lowest_marks: number;
  rank: number;
  grade: string;
  improvement_trend: 'Improving' | 'Declining' | 'Stable';
}

export interface SubjectPerformanceMetrics {
  subject_id: number;
  subject_name: string;
  total_students: number;
  average_marks: number;
  average_percentage: number;
  pass_rate: number;
  highest_marks: number;
  lowest_marks: number;
  grade_distribution: Array<{ grade: string; count: number }>;
}

export interface ClassPerformanceMetrics {
  class_id: number;
  class_name: string;
  grade: number;
  section: string;
  total_students: number;
  average_attendance: number;
  average_performance: number;
  top_performers: Array<{ student_name: string; percentage: number }>;
  subjects_performance: SubjectPerformanceMetrics[];
}

export interface AttendanceAnalytics {
  total_students: number;
  average_attendance_percentage: number;
  attendance_trends: Array<{ date: string; attendance_percentage: number }>;
  low_attendance_students: Array<{ student_name: string; attendance_percentage: number }>;
  monthly_summary: Array<{ month: string; attendance_percentage: number }>;
}

export interface FeeAnalytics {
  total_expected: number;
  total_collected: number;
  total_pending: number;
  collection_percentage: number;
  fee_type_breakdown: Array<{ fee_type: string; collected: number; pending: number }>;
  monthly_collection: Array<{ month: string; amount: number }>;
  overdue_analysis: Array<{ class_name: string; overdue_amount: number; student_count: number }>;
}

export interface TeacherAnalytics {
  teacher_id: number;
  teacher_name: string;
  subjects_taught: number;
  classes_assigned: number;
  average_class_performance: number;
  student_feedback_score?: number;
  exam_results_trend: Array<{ exam_date: string; average_percentage: number }>;
}

export class AnalyticsService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  // Student Performance Analytics
  async getStudentPerformanceMetrics(filters: AnalyticsFilters = {}): Promise<StudentPerformanceMetrics[]> {
    let query = `
      SELECT 
        s.id as student_id,
        s.first_name || ' ' || s.last_name as student_name,
        s.admission_number,
        COUNT(er.id) as total_exams,
        ROUND(AVG(er.marks_obtained), 2) as average_marks,
        ROUND(AVG(er.percentage), 2) as average_percentage,
        MAX(er.marks_obtained) as highest_marks,
        MIN(er.marks_obtained) as lowest_marks,
        AVG(er.rank) as rank
      FROM students s
      LEFT JOIN exam_results er ON s.id = er.student_id
      LEFT JOIN exams e ON er.exam_id = e.id
      WHERE s.status = 'Active'
    `;
    const params: any[] = [];

    if (filters.class_id) {
      query += ` AND s.class_id = ?`;
      params.push(filters.class_id);
    }

    if (filters.academic_year_id) {
      query += ` AND e.academic_year_id = ?`;
      params.push(filters.academic_year_id);
    }

    if (filters.date_from) {
      query += ` AND e.exam_date >= ?`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ` AND e.exam_date <= ?`;
      params.push(filters.date_to);
    }

    query += `
      GROUP BY s.id, s.first_name, s.last_name, s.admission_number
      HAVING total_exams > 0
      ORDER BY average_percentage DESC
    `;

    const results = await this.dbManager.getAll(query, params);

    // Calculate grade and improvement trend for each student
    return results.map((student, index) => ({
      ...student,
      rank: index + 1,
      grade: this.calculateGrade(student.average_percentage),
      improvement_trend: 'Stable' as any // TODO: Calculate actual trend
    }));
  }

  async getStudentPerformanceTrend(studentId: number, subjectId?: number): Promise<Array<{ exam_date: string; percentage: number; subject_name: string }>> {
    let query = `
      SELECT 
        e.exam_date,
        er.percentage,
        s.name as subject_name
      FROM exam_results er
      JOIN exams e ON er.exam_id = e.id
      JOIN subjects s ON e.subject_id = s.id
      WHERE er.student_id = ?
    `;
    const params: any[] = [studentId];

    if (subjectId) {
      query += ` AND e.subject_id = ?`;
      params.push(subjectId);
    }

    query += ` ORDER BY e.exam_date DESC LIMIT 10`;

    return await this.dbManager.getAll(query, params);
  }

  // Subject Performance Analytics
  async getSubjectPerformanceMetrics(filters: AnalyticsFilters = {}): Promise<SubjectPerformanceMetrics[]> {
    let query = `
      SELECT 
        s.id as subject_id,
        s.name as subject_name,
        COUNT(DISTINCT er.student_id) as total_students,
        ROUND(AVG(er.marks_obtained), 2) as average_marks,
        ROUND(AVG(er.percentage), 2) as average_percentage,
        ROUND((COUNT(CASE WHEN er.percentage >= 35 THEN 1 END) * 100.0) / COUNT(*), 2) as pass_rate,
        MAX(er.marks_obtained) as highest_marks,
        MIN(er.marks_obtained) as lowest_marks
      FROM subjects s
      JOIN exams e ON s.id = e.subject_id
      JOIN exam_results er ON e.id = er.exam_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.class_id) {
      query += ` AND e.class_id = ?`;
      params.push(filters.class_id);
    }

    if (filters.academic_year_id) {
      query += ` AND e.academic_year_id = ?`;
      params.push(filters.academic_year_id);
    }

    if (filters.subject_id) {
      query += ` AND s.id = ?`;
      params.push(filters.subject_id);
    }

    query += `
      GROUP BY s.id, s.name
      ORDER BY average_percentage DESC
    `;

    const subjects = await this.dbManager.getAll(query, params);

    // Get grade distribution for each subject
    for (const subject of subjects) {
      const gradeQuery = `
        SELECT 
          er.grade,
          COUNT(*) as count
        FROM exam_results er
        JOIN exams e ON er.exam_id = e.id
        WHERE e.subject_id = ?
        GROUP BY er.grade
        ORDER BY er.grade
      `;
      subject.grade_distribution = await this.dbManager.getAll(gradeQuery, [subject.subject_id]);
    }

    return subjects;
  }

  // Class Performance Analytics
  async getClassPerformanceMetrics(filters: AnalyticsFilters = {}): Promise<ClassPerformanceMetrics[]> {
    let query = `
      SELECT 
        c.id as class_id,
        c.name as class_name,
        c.grade,
        c.section,
        COUNT(DISTINCT s.id) as total_students,
        ROUND(AVG(attendance_stats.attendance_percentage), 2) as average_attendance,
        ROUND(AVG(exam_stats.average_percentage), 2) as average_performance
      FROM classes c
      LEFT JOIN students s ON c.id = s.class_id AND s.status = 'Active'
      LEFT JOIN (
        SELECT 
          student_id,
          ROUND((COUNT(CASE WHEN status IN ('Present', 'Late', 'Half Day') THEN 1 END) * 100.0) / COUNT(*), 2) as attendance_percentage
        FROM attendance 
        GROUP BY student_id
      ) attendance_stats ON s.id = attendance_stats.student_id
      LEFT JOIN (
        SELECT 
          er.student_id,
          AVG(er.percentage) as average_percentage
        FROM exam_results er
        GROUP BY er.student_id
      ) exam_stats ON s.id = exam_stats.student_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.class_id) {
      query += ` AND c.id = ?`;
      params.push(filters.class_id);
    }

    query += `
      GROUP BY c.id, c.name, c.grade, c.section
      ORDER BY c.grade, c.section
    `;

    const classes = await this.dbManager.getAll(query, params);

    // Get top performers and subjects performance for each class
    for (const classInfo of classes) {
      // Top performers
      const topPerformersQuery = `
        SELECT 
          s.first_name || ' ' || s.last_name as student_name,
          ROUND(AVG(er.percentage), 2) as percentage
        FROM students s
        JOIN exam_results er ON s.id = er.student_id
        WHERE s.class_id = ?
        GROUP BY s.id, s.first_name, s.last_name
        ORDER BY percentage DESC
        LIMIT 5
      `;
      classInfo.top_performers = await this.dbManager.getAll(topPerformersQuery, [classInfo.class_id]);

      // Subjects performance
      classInfo.subjects_performance = await this.getSubjectPerformanceMetrics({ class_id: classInfo.class_id });
    }

    return classes;
  }

  // Attendance Analytics
  async getAttendanceAnalytics(filters: AnalyticsFilters = {}): Promise<AttendanceAnalytics> {
    let baseWhere = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.class_id) {
      baseWhere += ' AND a.class_id = ?';
      params.push(filters.class_id);
    }

    if (filters.date_from) {
      baseWhere += ' AND a.date >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      baseWhere += ' AND a.date <= ?';
      params.push(filters.date_to);
    }

    // Overall statistics
    const overallQuery = `
      SELECT 
        COUNT(DISTINCT a.student_id) as total_students,
        ROUND((COUNT(CASE WHEN a.status IN ('Present', 'Late', 'Half Day') THEN 1 END) * 100.0) / COUNT(*), 2) as average_attendance_percentage
      FROM attendance a
      ${baseWhere}
    `;
    const overall = await this.dbManager.getAll(overallQuery, params);

    // Attendance trends
    const trendsQuery = `
      SELECT 
        a.date,
        ROUND((COUNT(CASE WHEN a.status IN ('Present', 'Late', 'Half Day') THEN 1 END) * 100.0) / COUNT(*), 2) as attendance_percentage
      FROM attendance a
      ${baseWhere}
      GROUP BY a.date
      ORDER BY a.date DESC
      LIMIT 30
    `;
    const trends = await this.dbManager.getAll(trendsQuery, params);

    // Low attendance students
    const lowAttendanceQuery = `
      SELECT 
        s.first_name || ' ' || s.last_name as student_name,
        ROUND((COUNT(CASE WHEN a.status IN ('Present', 'Late', 'Half Day') THEN 1 END) * 100.0) / COUNT(*), 2) as attendance_percentage
      FROM students s
      JOIN attendance a ON s.id = a.student_id
      ${baseWhere.replace('WHERE 1=1', 'WHERE s.status = \'Active\'')}
      GROUP BY s.id, s.first_name, s.last_name
      HAVING attendance_percentage < 75
      ORDER BY attendance_percentage ASC
    `;
    const lowAttendance = await this.dbManager.getAll(lowAttendanceQuery, params);

    // Monthly summary
    const monthlyQuery = `
      SELECT 
        strftime('%Y-%m', a.date) as month,
        ROUND((COUNT(CASE WHEN a.status IN ('Present', 'Late', 'Half Day') THEN 1 END) * 100.0) / COUNT(*), 2) as attendance_percentage
      FROM attendance a
      ${baseWhere}
      GROUP BY strftime('%Y-%m', a.date)
      ORDER BY month DESC
      LIMIT 12
    `;
    const monthly = await this.dbManager.getAll(monthlyQuery, params);

    return {
      total_students: overall[0]?.total_students || 0,
      average_attendance_percentage: overall[0]?.average_attendance_percentage || 0,
      attendance_trends: trends,
      low_attendance_students: lowAttendance,
      monthly_summary: monthly
    };
  }

  // Fee Analytics
  async getFeeAnalytics(filters: AnalyticsFilters = {}): Promise<FeeAnalytics> {
    let baseWhere = 'WHERE s.status = \'Active\'';
    const params: any[] = [];

    if (filters.class_id) {
      baseWhere += ' AND fs.class_id = ?';
      params.push(filters.class_id);
    }

    if (filters.academic_year_id) {
      baseWhere += ' AND fs.academic_year_id = ?';
      params.push(filters.academic_year_id);
    }

    // Overall fee statistics
    const overallQuery = `
      SELECT 
        SUM(fs.amount) as total_expected,
        COALESCE(SUM(fp.amount_paid), 0) as total_collected,
        (SUM(fs.amount) - COALESCE(SUM(fp.amount_paid), 0) - COALESCE(SUM(fp.discount), 0)) as total_pending
      FROM fee_structures fs
      JOIN students s ON s.class_id = fs.class_id
      LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.student_id = s.id
      ${baseWhere}
    `;
    const overall = await this.dbManager.getAll(overallQuery, params);

    // Fee type breakdown
    const feeTypeQuery = `
      SELECT 
        fs.fee_type,
        COALESCE(SUM(fp.amount_paid), 0) as collected,
        (SUM(fs.amount) - COALESCE(SUM(fp.amount_paid), 0) - COALESCE(SUM(fp.discount), 0)) as pending
      FROM fee_structures fs
      JOIN students s ON s.class_id = fs.class_id
      LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.student_id = s.id
      ${baseWhere}
      GROUP BY fs.fee_type
      ORDER BY collected DESC
    `;
    const feeTypeBreakdown = await this.dbManager.getAll(feeTypeQuery, params);

    // Monthly collection
    let monthlyQuery = `
      SELECT 
        strftime('%Y-%m', fp.payment_date) as month,
        SUM(fp.amount_paid) as amount
      FROM fee_payments fp
      JOIN students s ON fp.student_id = s.id
      WHERE fp.payment_date IS NOT NULL
    `;
    const monthlyParams = [...params];
    
    if (filters.class_id) {
      monthlyQuery += ' AND s.class_id = ?';
    }

    const monthlyCollection = await this.dbManager.getAll(
      monthlyQuery + ' GROUP BY strftime(\'%Y-%m\', fp.payment_date) ORDER BY month DESC LIMIT 12',
      monthlyParams
    );

    // Overdue analysis
    const overdueQuery = `
      SELECT 
        c.name as class_name,
        SUM(fs.amount - COALESCE(fp.amount_paid, 0) - COALESCE(fp.discount, 0)) as overdue_amount,
        COUNT(DISTINCT s.id) as student_count
      FROM fee_structures fs
      JOIN students s ON s.class_id = fs.class_id
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.student_id = s.id
      WHERE fs.due_date < DATE('now') 
      AND s.status = 'Active'
      AND (fs.amount - COALESCE(fp.amount_paid, 0) - COALESCE(fp.discount, 0)) > 0
      GROUP BY c.id, c.name
      ORDER BY overdue_amount DESC
    `;
    const overdueAnalysis = await this.dbManager.getAll(overdueQuery, []);

    const totalExpected = overall[0]?.total_expected || 0;
    const totalCollected = overall[0]?.total_collected || 0;

    return {
      total_expected: totalExpected,
      total_collected: totalCollected,
      total_pending: overall[0]?.total_pending || 0,
      collection_percentage: totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0,
      fee_type_breakdown: feeTypeBreakdown,
      monthly_collection: monthlyCollection,
      overdue_analysis: overdueAnalysis
    };
  }

  // Teacher Analytics
  async getTeacherAnalytics(teacherId?: number): Promise<TeacherAnalytics[]> {
    let query = `
      SELECT 
        t.id as teacher_id,
        t.first_name || ' ' || t.last_name as teacher_name,
        COUNT(DISTINCT st.subject_id) as subjects_taught,
        COUNT(DISTINCT c.id) as classes_assigned
      FROM teachers t
      LEFT JOIN subject_teachers st ON t.id = st.teacher_id
      LEFT JOIN classes c ON t.id = c.class_teacher_id
      WHERE t.status = 'Active'
    `;
    const params: any[] = [];

    if (teacherId) {
      query += ' AND t.id = ?';
      params.push(teacherId);
    }

    query += ' GROUP BY t.id, t.first_name, t.last_name ORDER BY t.first_name';

    const teachers = await this.dbManager.getAll(query, params);

    // Get class performance for each teacher
    for (const teacher of teachers) {
      const performanceQuery = `
        SELECT 
          AVG(er.percentage) as average_class_performance
        FROM teachers t
        JOIN subject_teachers st ON t.id = st.teacher_id
        JOIN exams e ON st.subject_id = e.subject_id AND st.class_id = e.class_id
        JOIN exam_results er ON e.id = er.exam_id
        WHERE t.id = ?
      `;
      const performance = await this.dbManager.getAll(performanceQuery, [teacher.teacher_id]);
      teacher.average_class_performance = performance[0]?.average_class_performance || 0;

      // Get exam results trend
      const trendQuery = `
        SELECT 
          e.exam_date,
          AVG(er.percentage) as average_percentage
        FROM teachers t
        JOIN subject_teachers st ON t.id = st.teacher_id
        JOIN exams e ON st.subject_id = e.subject_id AND st.class_id = e.class_id
        JOIN exam_results er ON e.id = er.exam_id
        WHERE t.id = ?
        GROUP BY e.exam_date
        ORDER BY e.exam_date DESC
        LIMIT 10
      `;
      teacher.exam_results_trend = await this.dbManager.getAll(trendQuery, [teacher.teacher_id]);
    }

    return teachers;
  }

  // Dashboard Summary
  async getDashboardSummary(academicYearId?: number) {
    const params = academicYearId ? [academicYearId] : [];
    const yearFilter = academicYearId ? 'AND ay.id = ?' : '';

    // Student statistics
    const studentStatsQuery = `
      SELECT 
        COUNT(*) as total_students,
        COUNT(CASE WHEN s.status = 'Active' THEN 1 END) as active_students,
        COUNT(CASE WHEN s.gender = 'Male' THEN 1 END) as male_students,
        COUNT(CASE WHEN s.gender = 'Female' THEN 1 END) as female_students
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE 1=1 ${yearFilter}
    `;

    // Teacher statistics
    const teacherStatsQuery = `
      SELECT 
        COUNT(*) as total_teachers,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_teachers
      FROM teachers
    `;

    // Recent exams
    const recentExamsQuery = `
      SELECT 
        e.name,
        e.exam_date,
        s.name as subject_name,
        c.name as class_name,
        COUNT(er.id) as students_appeared,
        AVG(er.percentage) as average_percentage
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      JOIN classes c ON e.class_id = c.id
      LEFT JOIN exam_results er ON e.id = er.exam_id
      WHERE e.status = 'Completed'
      GROUP BY e.id, e.name, e.exam_date, s.name, c.name
      ORDER BY e.exam_date DESC
      LIMIT 5
    `;

    // Attendance today
    const todayAttendanceQuery = `
      SELECT 
        COUNT(*) as total_marked,
        COUNT(CASE WHEN status IN ('Present', 'Late', 'Half Day') THEN 1 END) as present_count,
        ROUND((COUNT(CASE WHEN status IN ('Present', 'Late', 'Half Day') THEN 1 END) * 100.0) / COUNT(*), 2) as attendance_percentage
      FROM attendance 
      WHERE date = DATE('now')
    `;

    // Fee collection this month
    const monthlyFeeQuery = `
      SELECT 
        COUNT(*) as transactions_count,
        SUM(amount_paid) as total_collected
      FROM fee_payments 
      WHERE strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now')
    `;

    const [studentStats, teacherStats, recentExams, todayAttendance, monthlyFee] = await Promise.all([
      this.dbManager.getAll(studentStatsQuery, params),
      this.dbManager.getAll(teacherStatsQuery, []),
      this.dbManager.getAll(recentExamsQuery, []),
      this.dbManager.getAll(todayAttendanceQuery, []),
      this.dbManager.getAll(monthlyFeeQuery, [])
    ]);

    return {
      students: studentStats[0],
      teachers: teacherStats[0],
      recent_exams: recentExams,
      today_attendance: todayAttendance[0],
      monthly_fee_collection: monthlyFee[0]
    };
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 35) return 'D';
    return 'F';
  }

  // AI-Powered Predictions (placeholder for AI integration)
  async getPerformancePredictions(studentId: number) {
    // This would integrate with AI service for actual predictions
    // For now, return mock data structure
    return {
      next_exam_prediction: {
        predicted_percentage: 75,
        confidence: 0.85,
        factors: ['Recent improvement in attendance', 'Strong performance in practice tests']
      },
      semester_prediction: {
        predicted_grade: 'B+',
        confidence: 0.78,
        recommendations: ['Focus on weak subjects', 'Maintain current study pattern']
      }
    };
  }
}
