import express, { Router } from 'express';
import { TeacherService } from '../services/TeacherService';
import { asyncHandler } from '../middleware/errorHandler';
import { validateTeacher, validateTeacherUpdate } from '../validators/teacherValidator';

const router: Router = express.Router();
const teacherService = new TeacherService();

// GET /api/teachers - Get all teachers with pagination and filters
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    department,
    designation,
    status = 'Active',
    search
  } = req.query;

  const filters = {
    department: department as string,
    designation: designation as string,
    status: status as string,
    search: search as string
  };

  const result = await teacherService.getAllTeachers(
    parseInt(page as string),
    parseInt(limit as string),
    filters
  );

  res.json(result);
}));

// GET /api/teachers/:id - Get teacher by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const teacherId = parseInt(req.params.id);
  const teacher = await teacherService.getTeacherById(teacherId);
  
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found' });
  }
  
  res.json(teacher);
}));

// POST /api/teachers - Create new teacher
router.post('/', validateTeacher, asyncHandler(async (req, res) => {
  const teacherData = req.body;
  const newTeacher = await teacherService.createTeacher(teacherData);
  res.status(201).json(newTeacher);
}));

// PUT /api/teachers/:id - Update teacher
router.put('/:id', validateTeacherUpdate, asyncHandler(async (req, res) => {
  const teacherId = parseInt(req.params.id);
  const teacherData = req.body;
  const updatedTeacher = await teacherService.updateTeacher(teacherId, teacherData);
  res.json(updatedTeacher);
}));

// DELETE /api/teachers/:id - Delete teacher
router.delete('/:id', asyncHandler(async (req, res) => {
  const teacherId = parseInt(req.params.id);
  await teacherService.deleteTeacher(teacherId);
  res.status(204).send();
}));

// GET /api/teachers/:id/subjects - Get teacher's assigned subjects
router.get('/:id/subjects', asyncHandler(async (req, res) => {
  const teacherId = parseInt(req.params.id);
  const subjects = await teacherService.getTeacherSubjects(teacherId);
  res.json(subjects);
}));

// POST /api/teachers/:id/subjects - Assign subject to teacher
router.post('/:id/subjects', asyncHandler(async (req, res) => {
  const teacherId = parseInt(req.params.id);
  const { subject_id, class_id } = req.body;
  
  await teacherService.assignSubjectToTeacher(teacherId, subject_id, class_id);
  res.status(201).json({ message: 'Subject assigned successfully' });
}));

// DELETE /api/teachers/:id/subjects/:subjectId/classes/:classId - Remove subject assignment
router.delete('/:id/subjects/:subjectId/classes/:classId', asyncHandler(async (req, res) => {
  const teacherId = parseInt(req.params.id);
  const subjectId = parseInt(req.params.subjectId);
  const classId = parseInt(req.params.classId);
  
  await teacherService.removeSubjectFromTeacher(teacherId, subjectId, classId);
  res.status(204).send();
}));

// GET /api/teachers/:id/attendance - Get teacher attendance
router.get('/:id/attendance', asyncHandler(async (req, res) => {
  const teacherId = parseInt(req.params.id);
  const { start_date, end_date } = req.query;
  
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date are required' });
  }
  
  const stats = await teacherService.getTeacherAttendanceStats(
    teacherId, 
    start_date as string, 
    end_date as string
  );
  res.json(stats);
}));

// GET /api/teachers/departments/:department - Get teachers by department
router.get('/departments/:department', asyncHandler(async (req, res) => {
  const department = req.params.department;
  const teachers = await teacherService.getTeachersByDepartment(department);
  res.json(teachers);
}));

export default router;
