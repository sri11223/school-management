import express, { Router } from 'express';
import { StudentService } from '../services/StudentService';
import { asyncHandler } from '../middleware/errorHandler';
import { validateStudent } from '../validators/studentValidator';

const router: Router = express.Router();
const studentService = new StudentService();

// GET /api/students - Get all students with pagination and filters
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    class_id,
    academic_year_id,
    status = 'Active',
    search
  } = req.query;

  const filters = {
    class_id: class_id ? parseInt(class_id as string) : undefined,
    academic_year_id: academic_year_id ? parseInt(academic_year_id as string) : undefined,
    status: status as string,
    search: search as string
  };

  const result = await studentService.getAllStudents(
    parseInt(page as string),
    parseInt(limit as string),
    filters
  );

  res.json(result);
}));

// GET /api/students/:id - Get student by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.id);
  const student = await studentService.getStudentById(studentId);
  
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  res.json(student);
}));

// POST /api/students - Create new student
router.post('/', validateStudent, asyncHandler(async (req, res) => {
  const studentData = req.body;
  const student = await studentService.createStudent(studentData);
  res.status(201).json(student);
}));

// PUT /api/students/:id - Update student
router.put('/:id', validateStudent, asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.id);
  const studentData = req.body;
  
  const student = await studentService.updateStudent(studentId, studentData);
  
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  res.json(student);
}));

// DELETE /api/students/:id - Delete student (soft delete)
router.delete('/:id', asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.id);
  await studentService.deleteStudent(studentId);
  res.status(204).send();
}));

// GET /api/students/:id/parents - Get student's parents
router.get('/:id/parents', asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.id);
  const parents = await studentService.getStudentParents(studentId);
  res.json(parents);
}));

// POST /api/students/:id/parents - Add parent to student
router.post('/:id/parents', asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.id);
  const parentData = req.body;
  const parent = await studentService.addStudentParent(studentId, parentData);
  res.status(201).json(parent);
}));

// GET /api/students/admission-number/:admissionNumber - Get student by admission number
router.get('/admission-number/:admissionNumber', asyncHandler(async (req, res) => {
  const admissionNumber = req.params.admissionNumber;
  const student = await studentService.getStudentByAdmissionNumber(admissionNumber);
  
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  res.json(student);
}));

export default router;
