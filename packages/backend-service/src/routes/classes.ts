import express, { Router } from 'express';
import { ClassService } from '../services/ClassService';
import { asyncHandler } from '../middleware/errorHandler';
import { validateClass, validateClassUpdate, validateSection, validateSectionUpdate } from '../validators/classValidator';

const router: Router = express.Router();
const classService = new ClassService();

// ==================== CLASS ROUTES ====================

// GET /api/classes - Get all classes with pagination and filters
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    numeric_level,
    academic_year_id,
    search
  } = req.query;

  const filters = {
    numeric_level: numeric_level ? parseInt(numeric_level as string) : undefined,
    academic_year_id: academic_year_id ? parseInt(academic_year_id as string) : undefined,
    search: search as string
  };

  const result = await classService.getAllClasses(
    parseInt(page as string),
    parseInt(limit as string),
    filters
  );

  res.json(result);
}));

// GET /api/classes/:id - Get class by ID with sections
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
  const classData = await classService.createClass(req.body);
  res.status(201).json(classData);
}));

// PUT /api/classes/:id - Update class
router.put('/:id', validateClassUpdate, asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.id);
  const classData = await classService.updateClass(classId, req.body);
  res.json(classData);
}));

// DELETE /api/classes/:id - Delete class
router.delete('/:id', asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.id);
  await classService.deleteClass(classId);
  res.status(204).send();
}));

// GET /api/classes/:id/statistics - Get class statistics
router.get('/:id/statistics', asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.id);
  const statistics = await classService.getClassStatistics(classId);
  res.json(statistics);
}));

// GET /api/classes/level/:numericLevel - Get classes by numeric level
router.get('/level/:numericLevel', asyncHandler(async (req, res) => {
  const numericLevel = parseInt(req.params.numericLevel);
  const classes = await classService.getClassesByNumericLevel(numericLevel);
  res.json(classes);
}));

// ==================== SECTION ROUTES ====================

// GET /api/classes/sections - Get all sections with pagination and filters
router.get('/sections/all', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    class_id,
    class_teacher_id,
    search
  } = req.query;

  const filters = {
    class_id: class_id ? parseInt(class_id as string) : undefined,
    class_teacher_id: class_teacher_id ? parseInt(class_teacher_id as string) : undefined,
    search: search as string
  };

  const result = await classService.getAllSections(
    parseInt(page as string),
    parseInt(limit as string),
    filters
  );

  res.json(result);
}));

// GET /api/classes/:classId/sections - Get sections for a specific class
router.get('/:classId/sections', asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.classId);
  const sections = await classService.getSectionsByClassId(classId);
  res.json(sections);
}));

// GET /api/classes/sections/:sectionId - Get section by ID
router.get('/sections/:sectionId', asyncHandler(async (req, res) => {
  const sectionId = parseInt(req.params.sectionId);
  const section = await classService.getSectionById(sectionId);
  
  if (!section) {
    return res.status(404).json({ error: 'Section not found' });
  }
  
  res.json(section);
}));

// POST /api/classes/sections - Create new section
router.post('/sections', validateSection, asyncHandler(async (req, res) => {
  const sectionData = await classService.createSection(req.body);
  res.status(201).json(sectionData);
}));

// PUT /api/classes/sections/:sectionId - Update section
router.put('/sections/:sectionId', validateSectionUpdate, asyncHandler(async (req, res) => {
  const sectionId = parseInt(req.params.sectionId);
  const sectionData = await classService.updateSection(sectionId, req.body);
  res.json(sectionData);
}));

// DELETE /api/classes/sections/:sectionId - Delete section
router.delete('/sections/:sectionId', asyncHandler(async (req, res) => {
  const sectionId = parseInt(req.params.sectionId);
  await classService.deleteSection(sectionId);
  res.status(204).send();
}));

// GET /api/classes/sections/:sectionId/students - Get students in a section
router.get('/sections/:sectionId/students', asyncHandler(async (req, res) => {
  const sectionId = parseInt(req.params.sectionId);
  const { page = 1, limit = 10 } = req.query;
  
  const result = await classService.getSectionStudents(
    sectionId,
    parseInt(page as string),
    parseInt(limit as string)
  );
  
  res.json(result);
}));

// GET /api/classes/sections/:sectionId/statistics - Get section statistics
router.get('/sections/:sectionId/statistics', asyncHandler(async (req, res) => {
  const sectionId = parseInt(req.params.sectionId);
  const statistics = await classService.getSectionStatistics(sectionId);
  res.json(statistics);
}));

// GET /api/classes/teacher/:teacherId/sections - Get sections assigned to a teacher
router.get('/teacher/:teacherId/sections', asyncHandler(async (req, res) => {
  const teacherId = parseInt(req.params.teacherId);
  const sections = await classService.getSectionsByTeacher(teacherId);
  res.json(sections);
}));

export default router;