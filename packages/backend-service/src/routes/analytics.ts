import express, { Router } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = express.Router();
const analyticsService = new AnalyticsService();

// GET /api/analytics/dashboard - Get dashboard summary
router.get('/dashboard', asyncHandler(async (req, res) => {
  const { academic_year_id } = req.query;
  const academicYearId = academic_year_id ? parseInt(academic_year_id as string) : undefined;
  
  const summary = await analyticsService.getDashboardSummary(academicYearId);
  res.json(summary);
}));

// GET /api/analytics/students/performance - Get student performance metrics
router.get('/students/performance', asyncHandler(async (req, res) => {
  const {
    class_id,
    academic_year_id,
    subject_id,
    date_from,
    date_to
  } = req.query;

  const filters = {
    class_id: class_id ? parseInt(class_id as string) : undefined,
    academic_year_id: academic_year_id ? parseInt(academic_year_id as string) : undefined,
    subject_id: subject_id ? parseInt(subject_id as string) : undefined,
    date_from: date_from as string,
    date_to: date_to as string
  };

  const metrics = await analyticsService.getStudentPerformanceMetrics(filters);
  res.json(metrics);
}));

// GET /api/analytics/students/:id/trend - Get student performance trend
router.get('/students/:id/trend', asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.id);
  const { subject_id } = req.query;
  const subjectId = subject_id ? parseInt(subject_id as string) : undefined;
  
  const trend = await analyticsService.getStudentPerformanceTrend(studentId, subjectId);
  res.json(trend);
}));

// GET /api/analytics/subjects/performance - Get subject performance metrics
router.get('/subjects/performance', asyncHandler(async (req, res) => {
  const {
    class_id,
    academic_year_id,
    subject_id,
    date_from,
    date_to
  } = req.query;

  const filters = {
    class_id: class_id ? parseInt(class_id as string) : undefined,
    academic_year_id: academic_year_id ? parseInt(academic_year_id as string) : undefined,
    subject_id: subject_id ? parseInt(subject_id as string) : undefined,
    date_from: date_from as string,
    date_to: date_to as string
  };

  const metrics = await analyticsService.getSubjectPerformanceMetrics(filters);
  res.json(metrics);
}));

// GET /api/analytics/classes/performance - Get class performance metrics
router.get('/classes/performance', asyncHandler(async (req, res) => {
  const {
    class_id,
    academic_year_id,
    date_from,
    date_to
  } = req.query;

  const filters = {
    class_id: class_id ? parseInt(class_id as string) : undefined,
    academic_year_id: academic_year_id ? parseInt(academic_year_id as string) : undefined,
    date_from: date_from as string,
    date_to: date_to as string
  };

  const metrics = await analyticsService.getClassPerformanceMetrics(filters);
  res.json(metrics);
}));

// GET /api/analytics/attendance - Get attendance analytics
router.get('/attendance', asyncHandler(async (req, res) => {
  const {
    class_id,
    date_from,
    date_to
  } = req.query;

  const filters = {
    class_id: class_id ? parseInt(class_id as string) : undefined,
    date_from: date_from as string,
    date_to: date_to as string
  };

  const analytics = await analyticsService.getAttendanceAnalytics(filters);
  res.json(analytics);
}));

// GET /api/analytics/fees - Get fee analytics
router.get('/fees', asyncHandler(async (req, res) => {
  const {
    class_id,
    academic_year_id,
    date_from,
    date_to
  } = req.query;

  const filters = {
    class_id: class_id ? parseInt(class_id as string) : undefined,
    academic_year_id: academic_year_id ? parseInt(academic_year_id as string) : undefined,
    date_from: date_from as string,
    date_to: date_to as string
  };

  const analytics = await analyticsService.getFeeAnalytics(filters);
  res.json(analytics);
}));

// GET /api/analytics/teachers - Get teacher analytics
router.get('/teachers', asyncHandler(async (req, res) => {
  const { teacher_id } = req.query;
  const teacherId = teacher_id ? parseInt(teacher_id as string) : undefined;
  
  const analytics = await analyticsService.getTeacherAnalytics(teacherId);
  res.json(analytics);
}));

// GET /api/analytics/predictions/:studentId - Get AI-powered predictions for student
router.get('/predictions/:studentId', asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  
  const predictions = await analyticsService.getPerformancePredictions(studentId);
  res.json(predictions);
}));

export default router;
