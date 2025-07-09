import { DatabaseManager } from '../database/DatabaseManager';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { AIService } from './AIService';

export interface Exam {
  id?: number;
  name: string;
  exam_type: 'Unit Test' | 'Mid Term' | 'Final' | 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Annual';
  subject_id: number;
  class_id: number;
  academic_year_id: number;
  exam_date: string;
  start_time: string;
  end_time: string;
  total_marks: number;
  pass_marks: number;
  instructions?: string;
  created_by: number;
  status: 'Draft' | 'Published' | 'Completed' | 'Cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface ExamQuestion {
  id?: number;
  exam_id: number;
  question_text: string;
  question_type: 'MCQ' | 'Fill in the Blanks' | 'Short Answer' | 'Long Answer' | 'True/False';
  marks: number;
  difficulty_level: 'Easy' | 'Medium' | 'Hard';
  options?: string[]; // For MCQ
  correct_answer?: string;
  explanation?: string;
  topic?: string;
  bloom_level?: string;
  created_at?: string;
}

export interface ExamResult {
  id?: number;
  exam_id: number;
  student_id: number;
  marks_obtained: number;
  percentage: number;
  grade: string;
  rank?: number;
  status: 'Present' | 'Absent' | 'Malpractice';
  answer_sheet_path?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExamFilters {
  subject_id?: number;
  class_id?: number;
  academic_year_id?: number;
  exam_type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export class ExamService {
  private dbManager: DatabaseManager;
  private aiService: AIService;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.aiService = new AIService();
  }

  async getAllExams(page: number = 1, limit: number = 10, filters: ExamFilters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT e.*, 
             s.name as subject_name,
             s.code as subject_code,
             c.name as class_name,
             c.grade,
             c.section,
             ay.year as academic_year,
             t.first_name || ' ' || t.last_name as created_by_name,
             COUNT(*) OVER() as total_count
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      JOIN classes c ON e.class_id = c.id
      JOIN academic_years ay ON e.academic_year_id = ay.id
      JOIN teachers t ON e.created_by = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Apply filters
    if (filters.subject_id) {
      query += ` AND e.subject_id = ?`;
      params.push(filters.subject_id);
    }

    if (filters.class_id) {
      query += ` AND e.class_id = ?`;
      params.push(filters.class_id);
    }

    if (filters.academic_year_id) {
      query += ` AND e.academic_year_id = ?`;
      params.push(filters.academic_year_id);
    }

    if (filters.exam_type) {
      query += ` AND e.exam_type = ?`;
      params.push(filters.exam_type);
    }

    if (filters.status) {
      query += ` AND e.status = ?`;
      params.push(filters.status);
    }

    if (filters.date_from) {
      query += ` AND e.exam_date >= ?`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ` AND e.exam_date <= ?`;
      params.push(filters.date_to);
    }

    if (filters.search) {
      query += ` AND (e.name LIKE ? OR s.name LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ` ORDER BY e.exam_date DESC, e.start_time LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const exams = await this.dbManager.getAll(query, params);
    const totalCount = exams.length > 0 ? exams[0].total_count : 0;

    // Remove total_count from individual records
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

  async getExamById(id: number): Promise<Exam | null> {
    const query = `
      SELECT e.*, 
             s.name as subject_name,
             s.code as subject_code,
             c.name as class_name,
             c.grade,
             c.section,
             ay.year as academic_year,
             t.first_name || ' ' || t.last_name as created_by_name
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      JOIN classes c ON e.class_id = c.id
      JOIN academic_years ay ON e.academic_year_id = ay.id
      JOIN teachers t ON e.created_by = t.id
      WHERE e.id = ?
    `;
    const exams = await this.dbManager.getAll(query, [id]);
    return exams.length > 0 ? exams[0] : null;
  }

  async createExam(examData: Omit<Exam, 'id' | 'created_at' | 'updated_at'>): Promise<Exam> {
    const query = `
      INSERT INTO exams (
        name, exam_type, subject_id, class_id, academic_year_id,
        exam_date, start_time, end_time, total_marks, pass_marks,
        instructions, created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      examData.name,
      examData.exam_type,
      examData.subject_id,
      examData.class_id,
      examData.academic_year_id,
      examData.exam_date,
      examData.start_time,
      examData.end_time,
      examData.total_marks,
      examData.pass_marks,
      examData.instructions,
      examData.created_by,
      examData.status || 'Draft'
    ];

    const result = await this.dbManager.runQuery(query, params);
    return await this.getExamById(result.lastID!) as Exam;
  }

  async updateExam(id: number, examData: Partial<Exam>): Promise<Exam> {
    const existingExam = await this.getExamById(id);
    if (!existingExam) {
      throw new NotFoundError('Exam not found');
    }

    // Prevent updating published or completed exams
    if (existingExam.status === 'Completed' && examData.status !== 'Completed') {
      throw new ValidationError('Cannot modify completed exam');
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

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE exams SET ${updateFields.join(', ')} WHERE id = ?`;
    await this.dbManager.runQuery(query, params);

    return await this.getExamById(id) as Exam;
  }

  async deleteExam(id: number): Promise<void> {
    const existingExam = await this.getExamById(id);
    if (!existingExam) {
      throw new NotFoundError('Exam not found');
    }

    // Prevent deleting published or completed exams
    if (existingExam.status === 'Published' || existingExam.status === 'Completed') {
      throw new ValidationError('Cannot delete published or completed exam');
    }

    // Delete related questions and results
    await this.dbManager.runQuery('DELETE FROM exam_questions WHERE exam_id = ?', [id]);
    await this.dbManager.runQuery('DELETE FROM exam_results WHERE exam_id = ?', [id]);
    
    const query = `DELETE FROM exams WHERE id = ?`;
    await this.dbManager.runQuery(query, [id]);
  }

  // Question Management
  async getExamQuestions(examId: number): Promise<ExamQuestion[]> {
    const query = `
      SELECT * FROM exam_questions 
      WHERE exam_id = ? 
      ORDER BY id
    `;
    return await this.dbManager.getAll(query, [examId]);
  }

  async addQuestionToExam(examId: number, questionData: Omit<ExamQuestion, 'id' | 'exam_id' | 'created_at'>): Promise<ExamQuestion> {
    const query = `
      INSERT INTO exam_questions (
        exam_id, question_text, question_type, marks, difficulty_level,
        options, correct_answer, explanation, topic, bloom_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      examId,
      questionData.question_text,
      questionData.question_type,
      questionData.marks,
      questionData.difficulty_level,
      JSON.stringify(questionData.options || []),
      questionData.correct_answer,
      questionData.explanation,
      questionData.topic,
      questionData.bloom_level
    ];

    const result = await this.dbManager.runQuery(query, params);
    const questions = await this.dbManager.getAll('SELECT * FROM exam_questions WHERE id = ?', [result.lastID]);
    return questions[0];
  }

  async updateQuestion(questionId: number, questionData: Partial<ExamQuestion>): Promise<ExamQuestion> {
    const updateFields: string[] = [];
    const params: any[] = [];

    Object.entries(questionData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'exam_id' && key !== 'created_at') {
        if (key === 'options') {
          updateFields.push(`${key} = ?`);
          params.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = ?`);
          params.push(value);
        }
      }
    });

    if (updateFields.length > 0) {
      params.push(questionId);
      const query = `UPDATE exam_questions SET ${updateFields.join(', ')} WHERE id = ?`;
      await this.dbManager.runQuery(query, params);
    }

    const questions = await this.dbManager.getAll('SELECT * FROM exam_questions WHERE id = ?', [questionId]);
    return questions[0];
  }

  async deleteQuestion(questionId: number): Promise<void> {
    const query = `DELETE FROM exam_questions WHERE id = ?`;
    const result = await this.dbManager.runQuery(query, [questionId]);
    
    if (result.changes === 0) {
      throw new NotFoundError('Question not found');
    }
  }

  // AI-Powered Question Generation
  async generateQuestionsWithAI(examId: number, topic: string, difficulty: string, count: number = 10): Promise<ExamQuestion[]> {
    const exam = await this.getExamById(examId);
    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    try {
      const questions = await this.aiService.generateExamQuestions({
        classId: exam.class_id,
        subjectId: exam.subject_id,
        examType: exam.exam_type,
        syllabus: topic,
        difficultyLevel: difficulty as 'Easy' | 'Medium' | 'Hard',
        questionTypes: ['MCQ', 'Short Answer', 'Long Answer'],
        totalMarks: exam.total_marks,
        language: 'english'
      });

      const createdQuestions: ExamQuestion[] = [];
      for (const questionData of questions) {
        const createdQuestion = await this.addQuestionToExam(examId, questionData);
        createdQuestions.push(createdQuestion);
      }

      return createdQuestions;
    } catch (error) {
      throw new ValidationError(`Failed to generate questions: ${error}`);
    }
  }

  // Result Management
  async getExamResults(examId: number, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT 
        er.*,
        s.first_name || ' ' || s.last_name as student_name,
        s.admission_number,
        s.roll_number,
        COUNT(*) OVER() as total_count
      FROM exam_results er
      JOIN students s ON er.student_id = s.id
      WHERE er.exam_id = ?
      ORDER BY er.marks_obtained DESC, s.first_name
      LIMIT ? OFFSET ?
    `;
    
    const results = await this.dbManager.getAll(query, [examId, limit, offset]);
    const totalCount = results.length > 0 ? results[0].total_count : 0;

    // Remove total_count from individual records
    results.forEach(result => delete result.total_count);

    return {
      results,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  async addExamResult(resultData: Omit<ExamResult, 'id' | 'created_at' | 'updated_at'>): Promise<ExamResult> {
    // Check if result already exists
    const existingQuery = `
      SELECT COUNT(*) as count 
      FROM exam_results 
      WHERE exam_id = ? AND student_id = ?
    `;
    const existing = await this.dbManager.getAll(existingQuery, [resultData.exam_id, resultData.student_id]);
    
    if (existing[0].count > 0) {
      throw new ValidationError('Result for this student already exists');
    }

    // Calculate grade based on percentage
    const grade = this.calculateGrade(resultData.percentage);

    const query = `
      INSERT INTO exam_results (
        exam_id, student_id, marks_obtained, percentage, grade,
        status, answer_sheet_path, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      resultData.exam_id,
      resultData.student_id,
      resultData.marks_obtained,
      resultData.percentage,
      grade,
      resultData.status,
      resultData.answer_sheet_path,
      resultData.remarks
    ];

    const result = await this.dbManager.runQuery(query, params);
    const results = await this.dbManager.getAll('SELECT * FROM exam_results WHERE id = ?', [result.lastID]);
    
    // Update ranks after adding new result
    await this.updateExamRanks(resultData.exam_id);
    
    return results[0];
  }

  async updateExamResult(resultId: number, resultData: Partial<ExamResult>): Promise<ExamResult> {
    const updateFields: string[] = [];
    const params: any[] = [];

    Object.entries(resultData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(resultId);
      const query = `UPDATE exam_results SET ${updateFields.join(', ')} WHERE id = ?`;
      await this.dbManager.runQuery(query, params);
    }

    const results = await this.dbManager.getAll('SELECT * FROM exam_results WHERE id = ?', [resultId]);
    return results[0];
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

  private async updateExamRanks(examId: number): Promise<void> {
    const query = `
      UPDATE exam_results 
      SET rank = (
        SELECT COUNT(*) + 1 
        FROM exam_results er2 
        WHERE er2.exam_id = exam_results.exam_id 
        AND er2.marks_obtained > exam_results.marks_obtained
      )
      WHERE exam_id = ?
    `;
    await this.dbManager.runQuery(query, [examId]);
  }

  async getExamStatistics(examId: number) {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_students,
        AVG(marks_obtained) as average_marks,
        MAX(marks_obtained) as highest_marks,
        MIN(marks_obtained) as lowest_marks,
        AVG(percentage) as average_percentage,
        COUNT(CASE WHEN status = 'Present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN grade IN ('A+', 'A', 'B+', 'B') THEN 1 END) as pass_count
      FROM exam_results 
      WHERE exam_id = ?
    `;

    const gradeDistQuery = `
      SELECT 
        grade,
        COUNT(*) as count
      FROM exam_results 
      WHERE exam_id = ?
      GROUP BY grade
      ORDER BY grade
    `;

    const [stats, gradeDistribution] = await Promise.all([
      this.dbManager.getAll(statsQuery, [examId]),
      this.dbManager.getAll(gradeDistQuery, [examId])
    ]);

    const examStats = stats[0];
    const passPercentage = examStats.total_students > 0 
      ? (examStats.pass_count / examStats.present_count) * 100 
      : 0;

    return {
      ...examStats,
      pass_percentage: Math.round(passPercentage * 100) / 100,
      grade_distribution: gradeDistribution
    };
  }

  async getUpcomingExams(classId?: number, limit: number = 10) {
    let query = `
      SELECT e.*, 
             s.name as subject_name,
             c.name as class_name,
             c.grade,
             c.section
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      JOIN classes c ON e.class_id = c.id
      WHERE e.exam_date >= DATE('now') AND e.status = 'Published'
    `;
    const params: any[] = [];

    if (classId) {
      query += ` AND e.class_id = ?`;
      params.push(classId);
    }

    query += ` ORDER BY e.exam_date, e.start_time LIMIT ?`;
    params.push(limit);

    return await this.dbManager.getAll(query, params);
  }
}
