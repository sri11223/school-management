import express, { Router } from 'express';
import { ExamService } from '../services/ExamService';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = express.Router();
const examService = new ExamService();

// GET /api/exams - Get all exams with pagination and filters
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    subject_id,
    class_id,
    academic_year_id,
    exam_type,
    status,
    date_from,
    date_to,
    search
  } = req.query;

  const filters = {
    subject_id: subject_id ? parseInt(subject_id as string) : undefined,
    class_id: class_id ? parseInt(class_id as string) : undefined,
    academic_year_id: academic_year_id ? parseInt(academic_year_id as string) : undefined,
    exam_type: exam_type as string,
    status: status as string,
    date_from: date_from as string,
    date_to: date_to as string,
    search: search as string
  };

  const result = await examService.getAllExams(
    parseInt(page as string),
    parseInt(limit as string),
    filters
  );

  res.json(result);
}));

// GET /api/exams/:id - Get exam by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id);
  const exam = await examService.getExamById(examId);
  
  if (!exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }
  
  res.json(exam);
}));

// POST /api/exams - Create new exam
router.post('/', asyncHandler(async (req, res) => {
  const examData = req.body;
  
  // Basic validation
  if (!examData.name || !examData.subject_id || !examData.class_id) {
    return res.status(400).json({ error: 'Name, subject ID, and class ID are required' });
  }
  
  const newExam = await examService.createExam(examData);
  res.status(201).json(newExam);
}));

// PUT /api/exams/:id - Update exam
router.put('/:id', asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id);
  const examData = req.body;
  const updatedExam = await examService.updateExam(examId, examData);
  res.json(updatedExam);
}));

// DELETE /api/exams/:id - Delete exam
router.delete('/:id', asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id);
  await examService.deleteExam(examId);
  res.status(204).send();
}));

// GET /api/exams/:id/questions - Get exam questions
router.get('/:id/questions', asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id);
  const questions = await examService.getExamQuestions(examId);
  res.json(questions);
}));

// POST /api/exams/:id/questions - Add question to exam
router.post('/:id/questions', asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id);
  const questionData = req.body;
  
  if (!questionData.question_text || !questionData.marks) {
    return res.status(400).json({ error: 'Question text and marks are required' });
  }
  
  const question = await examService.addQuestionToExam(examId, questionData);
  res.status(201).json(question);
}));

// PUT /api/exams/questions/:questionId - Update question
router.put('/questions/:questionId', asyncHandler(async (req, res) => {
  const questionId = parseInt(req.params.questionId);
  const questionData = req.body;
  const updatedQuestion = await examService.updateQuestion(questionId, questionData);
  res.json(updatedQuestion);
}));

// DELETE /api/exams/questions/:questionId - Delete question
router.delete('/questions/:questionId', asyncHandler(async (req, res) => {
  const questionId = parseInt(req.params.questionId);
  await examService.deleteQuestion(questionId);
  res.status(204).send();
}));

// POST /api/exams/:id/questions/generate - Generate questions using AI
router.post('/:id/questions/generate', asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id);
  const { topic, difficulty = 'Medium', count = 10 } = req.body;
  
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required for AI question generation' });
  }
  
  const questions = await examService.generateQuestionsWithAI(examId, topic, difficulty, count);
  res.json(questions);
}));

// GET /api/exams/:id/results - Get exam results
router.get('/:id/results', asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id);
  const { page = 1, limit = 10 } = req.query;
  
  const results = await examService.getExamResults(
    examId,
    parseInt(page as string),
    parseInt(limit as string)
  );
  res.json(results);
}));

// POST /api/exams/:id/results - Add exam result
router.post('/:id/results', asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id);
  const resultData = { ...req.body, exam_id: examId };
  
  if (!resultData.student_id || resultData.marks_obtained === undefined) {
    return res.status(400).json({ error: 'Student ID and marks obtained are required' });
  }
  
  const result = await examService.addExamResult(resultData);
  res.status(201).json(result);
}));

// PUT /api/exams/results/:resultId - Update exam result
router.put('/results/:resultId', asyncHandler(async (req, res) => {
  const resultId = parseInt(req.params.resultId);
  const resultData = req.body;
  const updatedResult = await examService.updateExamResult(resultId, resultData);
  res.json(updatedResult);
}));

// GET /api/exams/:id/statistics - Get exam statistics
router.get('/:id/statistics', asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id);
  const stats = await examService.getExamStatistics(examId);
  res.json(stats);
}));

// GET /api/exams/upcoming - Get upcoming exams
router.get('/upcoming', asyncHandler(async (req, res) => {
  const { class_id, limit = 10 } = req.query;
  const classId = class_id ? parseInt(class_id as string) : undefined;
  
  const upcomingExams = await examService.getUpcomingExams(classId, parseInt(limit as string));
  res.json(upcomingExams);
}));

export default router;
