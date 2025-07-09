import express, { Router } from 'express';
import { ClassService } from '../services/ClassService';
import { asyncHandler } from '../middleware/errorHandler';
import { validateClass, validateClassUpdate } from '../validators/classValidator';

const router: Router = express.Router();
const classService = new ClassService();

// GET /api/classes - Get all classes with pagination and filters
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    grade,
    academic_year_id,
    class_teacher_id,
    status = 'Active',
    search
  } = req.query;

  const filters = {
    grade: grade ? parseInt(grade as string) : undefined,
    academic_year_id: academic_year_id ? parseInt(academic_year_id as string) : undefined,
    class_teacher_id: class_teacher_id ? parseInt(class_teacher_id as string) : undefined,
    status: status as string,
    search: search as string
  };

  const result = await classService.getAllClasses(
    parseInt(page as string),
    parseInt(limit as string),
    filters
  );

  res.json(result);
}));

// GET /api/classes/:id - Get class by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.id);
  const classData = await classService.getClassById(classId);
  
  if (!classData) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  res.json(classData);
}));

// POST /api/classes - Create new class
router.post('/', validateClass, asyncHandler(async (req, res) => {
  const classData = req.body;
  const newClass = await classService.createClass(classData);
  res.status(201).json(newClass);
}));

// PUT /api/classes/:id - Update class
router.put('/:id', validateClassUpdate, asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.id);
  const classData = req.body;
  const updatedClass = await classService.updateClass(classId, classData);
  res.json(updatedClass);
}));

// DELETE /api/classes/:id - Delete class
router.delete('/:id', asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.id);
  await classService.deleteClass(classId);
  res.status(204).send();
}));

// GET /api/classes/:id/students - Get students in class
router.get('/:id/students', asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.id);
  const { page = 1, limit = 10 } = req.query;
  
  const result = await classService.getClassStudents(
    classId,
    parseInt(page as string),
    parseInt(limit as string)
  );
  res.json(result);
}));

// GET /api/classes/:id/subjects - Get subjects for class
router.get('/:id/subjects', asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.id);
  const subjects = await classService.getClassSubjects(classId);
  res.json(subjects);
}));

// POST /api/classes/:id/subjects - Assign subject to class
router.post('/:id/subjects', asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.id);
  const { subject_id } = req.body;
  
  if (!subject_id) {
    return res.status(400).json({ error: 'Subject ID is required' });
  }
  
  await classService.assignSubjectToClass(classId, subject_id);
  res.status(201).json({ message: 'Subject assigned successfully' });
}));

// DELETE /api/classes/:id/subjects/:subjectId - Remove subject from class
router.delete('/:id/subjects/:subjectId', asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.id);
  const subjectId = parseInt(req.params.subjectId);
  
  await classService.removeSubjectFromClass(classId, subjectId);
  res.status(204).send();
}));

// GET /api/classes/:id/statistics - Get class statistics
router.get('/:id/statistics', asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.id);
  const stats = await classService.getClassStatistics(classId);
  res.json(stats);
}));

// GET /api/classes/grade/:grade - Get classes by grade
router.get('/grade/:grade', asyncHandler(async (req, res) => {
  const grade = parseInt(req.params.grade);
  const classes = await classService.getClassesByGrade(grade);
  res.json(classes);
}));

export default router;
