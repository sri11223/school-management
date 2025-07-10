import { DatabaseManager } from '../database/DatabaseManager';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { AIService } from './AIService';

export interface Exam {
  id?: number;
  name: string;
  subject_id?: number;
  class_id: string; // UUID as string
  subject_name?: string;
  exam_type?: string;
  exam_date: string; // Using exam_date to match schema
  start_time?: string;
  end_time?: string;
  total_marks?: number;
  pass_marks?: number;
  instructions?: string;
  status?: 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled';
  created_by?: number;
  created_at?: string;
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
  class_id?: string;
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
             COUNT(*) OVER() as total_count
      FROM exams e
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
      query += ` AND (e.name LIKE ? OR e.subject_name LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ` ORDER BY e.exam_date DESC LIMIT ? OFFSET ?`;
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
      SELECT e.*
      FROM exams e
      WHERE e.id = ?
    `;
    
    const exam = await this.dbManager.getOne(query, [id]);
    return exam || null;
  }

  async getExamsByClassId(classId: string): Promise<Exam[]> {
    const query = `
      SELECT e.*
      FROM exams e
      WHERE e.class_id = ?
      ORDER BY e.exam_date DESC
    `;
    
    return await this.dbManager.getAll(query, [classId]);
  }

  async createExam(examData: Omit<Exam, 'id' | 'created_at'>): Promise<Exam> {
    // Validate required fields
    if (!examData.name || !examData.class_id || !examData.exam_date) {
      throw new ValidationError('Name, class_id, and exam_date are required');
    }

    const query = `
      INSERT INTO exams (
        name, subject_id, class_id, subject_name, exam_type, 
        exam_date, start_time, end_time, total_marks, pass_marks, 
        instructions, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      examData.name,
      examData.subject_id || null,
      examData.class_id,
      examData.subject_name || null,
      examData.exam_type || 'Test',
      examData.exam_date,
      examData.start_time || null,
      examData.end_time || null,
      examData.total_marks || 100,
      examData.pass_marks || 40,
      examData.instructions || null,
      examData.status || 'Scheduled',
      examData.created_by || null
    ];

    const result = await this.dbManager.runQuery(query, params);
    const newExam = await this.getExamById(result.lastID);
    
    if (!newExam) {
      throw new Error('Failed to create exam');
    }

    return newExam;
  }

  async updateExam(id: number, examData: Partial<Exam>): Promise<Exam> {
    const existingExam = await this.getExamById(id);
    if (!existingExam) {
      throw new NotFoundError('Exam not found');
    }

    // Check if exam can be edited (not completed or cancelled)
    if (existingExam.status === 'Completed') {
      throw new ValidationError('Cannot edit completed exam');
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    if (examData.name !== undefined) {
      updateFields.push('name = ?');
      params.push(examData.name);
    }

    if (examData.subject_id !== undefined) {
      updateFields.push('subject_id = ?');
      params.push(examData.subject_id);
    }

    if (examData.subject_name !== undefined) {
      updateFields.push('subject_name = ?');
      params.push(examData.subject_name);
    }

    if (examData.exam_type !== undefined) {
      updateFields.push('exam_type = ?');
      params.push(examData.exam_type);
    }

    if (examData.exam_date !== undefined) {
      updateFields.push('exam_date = ?');
      params.push(examData.exam_date);
    }

    if (examData.start_time !== undefined) {
      updateFields.push('start_time = ?');
      params.push(examData.start_time);
    }

    if (examData.end_time !== undefined) {
      updateFields.push('end_time = ?');
      params.push(examData.end_time);
    }

    if (examData.total_marks !== undefined) {
      updateFields.push('total_marks = ?');
      params.push(examData.total_marks);
    }

    if (examData.pass_marks !== undefined) {
      updateFields.push('pass_marks = ?');
      params.push(examData.pass_marks);
    }

    if (examData.instructions !== undefined) {
      updateFields.push('instructions = ?');
      params.push(examData.instructions);
    }

    if (examData.status !== undefined) {
      updateFields.push('status = ?');
      params.push(examData.status);
    }

    if (updateFields.length === 0) {
      return existingExam; // No changes
    }

    const query = `
      UPDATE exams 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    params.push(id);

    await this.dbManager.runQuery(query, params);
    const updatedExam = await this.getExamById(id);
    
    if (!updatedExam) {
      throw new Error('Failed to update exam');
    }

    return updatedExam;
  }

  async deleteExam(id: number): Promise<void> {
    const existingExam = await this.getExamById(id);
    if (!existingExam) {
      throw new NotFoundError('Exam not found');
    }

    // Check if exam can be deleted (not completed)
    if (existingExam.status === 'Completed') {
      throw new ValidationError('Cannot delete completed exam');
    }

    // Check if there are any results for this exam
    const resultsQuery = 'SELECT COUNT(*) as count FROM exam_results WHERE exam_id = ?';
    const resultsCount = await this.dbManager.getOne(resultsQuery, [id]);
    
    if (resultsCount && resultsCount.count > 0) {
      throw new ValidationError('Cannot delete exam with existing results');
    }

    // Delete exam questions first
    await this.dbManager.runQuery('DELETE FROM exam_questions WHERE exam_id = ?', [id]);
    
    // Delete the exam
    await this.dbManager.runQuery('DELETE FROM exams WHERE id = ?', [id]);
  }

  // Exam Questions
  async getExamQuestions(examId: number): Promise<ExamQuestion[]> {
    const query = `
      SELECT * FROM exam_questions 
      WHERE exam_id = ? 
      ORDER BY id
    `;
    return await this.dbManager.getAll(query, [examId]);
  }

  async createExamQuestion(questionData: Omit<ExamQuestion, 'id' | 'created_at'>): Promise<ExamQuestion> {
    const query = `
      INSERT INTO exam_questions (
        exam_id, question_text, question_type, marks, 
        difficulty_level, options, correct_answer, explanation, 
        topic, bloom_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      questionData.exam_id,
      questionData.question_text,
      questionData.question_type,
      questionData.marks,
      questionData.difficulty_level,
      questionData.options ? JSON.stringify(questionData.options) : null,
      questionData.correct_answer || null,
      questionData.explanation || null,
      questionData.topic || null,
      questionData.bloom_level || null
    ];

    const result = await this.dbManager.runQuery(query, params);
    const newQuestion = await this.dbManager.getOne(
      'SELECT * FROM exam_questions WHERE id = ?', 
      [result.lastID]
    );
    
    if (!newQuestion) {
      throw new Error('Failed to create exam question');
    }

    // Parse options if they exist
    if (newQuestion.options) {
      try {
        newQuestion.options = JSON.parse(newQuestion.options);
      } catch (e) {
        newQuestion.options = null;
      }
    }

    return newQuestion;
  }

  // Exam Results
  async getExamResults(examId: number): Promise<ExamResult[]> {
    const query = `
      SELECT er.*, s.first_name, s.last_name, s.roll_number
      FROM exam_results er
      JOIN students s ON er.student_id = s.id
      WHERE er.exam_id = ?
      ORDER BY er.marks_obtained DESC
    `;
    return await this.dbManager.getAll(query, [examId]);
  }

  async createExamResult(resultData: Omit<ExamResult, 'id' | 'created_at' | 'updated_at'>): Promise<ExamResult> {
    const query = `
      INSERT INTO exam_results (
        exam_id, student_id, marks_obtained, percentage, 
        grade, rank, status, answer_sheet_path, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      resultData.exam_id,
      resultData.student_id,
      resultData.marks_obtained,
      resultData.percentage,
      resultData.grade,
      resultData.rank || null,
      resultData.status,
      resultData.answer_sheet_path || null,
      resultData.remarks || null
    ];

    const result = await this.dbManager.runQuery(query, params);
    const newResult = await this.dbManager.getOne(
      'SELECT * FROM exam_results WHERE id = ?', 
      [result.lastID]
    );
    
    if (!newResult) {
      throw new Error('Failed to create exam result');
    }

    return newResult;
  }

  // Analytics methods
  async getExamAnalytics(examId: number) {
    const exam = await this.getExamById(examId);
    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    const results = await this.getExamResults(examId);
    
    if (results.length === 0) {
      return {
        examId,
        examName: exam.name,
        totalStudents: 0,
        appeared: 0,
        absent: 0,
        averageMarks: 0,
        averagePercentage: 0,
        highestMarks: 0,
        lowestMarks: 0,
        passRate: 0,
        gradeDistribution: {},
        statistics: {}
      };
    }

    const appeared = results.filter(r => r.status === 'Present').length;
    const absent = results.filter(r => r.status === 'Absent').length;
    const presentResults = results.filter(r => r.status === 'Present');
    
    const totalMarks = presentResults.reduce((sum, r) => sum + r.marks_obtained, 0);
    const averageMarks = presentResults.length > 0 ? totalMarks / presentResults.length : 0;
    const averagePercentage = presentResults.length > 0 ? 
      presentResults.reduce((sum, r) => sum + r.percentage, 0) / presentResults.length : 0;
    
    const marksArray = presentResults.map(r => r.marks_obtained);
    const highestMarks = marksArray.length > 0 ? Math.max(...marksArray) : 0;
    const lowestMarks = marksArray.length > 0 ? Math.min(...marksArray) : 0;
    
    const passed = presentResults.filter(r => r.marks_obtained >= (exam.pass_marks || 40)).length;
    const passRate = presentResults.length > 0 ? (passed / presentResults.length) * 100 : 0;
    
    // Grade distribution
    const gradeDistribution: {[key: string]: number} = {};
    presentResults.forEach(result => {
      gradeDistribution[result.grade] = (gradeDistribution[result.grade] || 0) + 1;
    });

    return {
      examId,
      examName: exam.name,
      totalStudents: appeared + absent,
      appeared,
      absent,
      averageMarks: Math.round(averageMarks * 100) / 100,
      averagePercentage: Math.round(averagePercentage * 100) / 100,
      highestMarks,
      lowestMarks,
      passRate: Math.round(passRate * 100) / 100,
      gradeDistribution,
      statistics: {
        totalMarks: exam.total_marks,
        passMarks: exam.pass_marks,
        examDate: exam.exam_date,
        examType: exam.exam_type
      }
    };
  }

  async getClassExamAnalytics(classId: string) {
    const exams = await this.getExamsByClassId(classId);
    
    if (exams.length === 0) {
      return {
        classId,
        totalExams: 0,
        examsByStatus: {},
        examsByType: {},
        averageClassPerformance: 0,
        recentExams: []
      };
    }

    // Group by status
    const examsByStatus: {[key: string]: number} = {};
    exams.forEach(exam => {
      examsByStatus[exam.status || 'Unknown'] = (examsByStatus[exam.status || 'Unknown'] || 0) + 1;
    });

    // Group by type
    const examsByType: {[key: string]: number} = {};
    exams.forEach(exam => {
      examsByType[exam.exam_type || 'Unknown'] = (examsByType[exam.exam_type || 'Unknown'] || 0) + 1;
    });

    // Get recent exams (last 5)
    const recentExams = exams.slice(0, 5).map(exam => ({
      id: exam.id,
      name: exam.name,
      subject_name: exam.subject_name,
      exam_date: exam.exam_date,
      status: exam.status,
      exam_type: exam.exam_type
    }));

    return {
      classId,
      totalExams: exams.length,
      examsByStatus,
      examsByType,
      recentExams
    };
  }
}
