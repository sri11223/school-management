import express, { Router } from 'express';
import { AttendanceService } from '../services/AttendanceService';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = express.Router();
const attendanceService = new AttendanceService();

// GET /api/attendance - Get student attendance records with pagination and filters
router.get('/student/:studentId', asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const {
    page = 1,
    limit = 10,
    class_id,
    date_from,
    date_to,
    status
  } = req.query;

  const filters = {
    class_id: class_id as string,
    date_from: date_from as string,
    date_to: date_to as string,
    status: status as string
  };

  const result = await attendanceService.getStudentAttendance(
    studentId,
    parseInt(page as string),
    parseInt(limit as string),
    filters
  );

  res.json(result);
}));

// GET /api/attendance/class/:classId/:date - Get class attendance for a specific date
router.get('/class/:classId/:date', asyncHandler(async (req, res) => {
  const classId = req.params.classId;
  const date = req.params.date;

  const attendance = await attendanceService.getClassAttendance(classId, date);
  res.json({ attendance });
}));

// POST /api/attendance/mark - Mark attendance for a student
router.post('/mark', asyncHandler(async (req, res) => {
  const attendance = await attendanceService.markAttendance(req.body);
  res.status(201).json(attendance);
}));

// POST /api/attendance/bulk - Mark bulk attendance for a class
router.post('/bulk', asyncHandler(async (req, res) => {
  const { classId, date, attendanceList, markedBy } = req.body;
  
  await attendanceService.markBulkAttendance(classId, date, attendanceList, markedBy);
  res.json({ message: 'Bulk attendance marked successfully' });
}));

// PUT /api/attendance/:id - Update attendance record
router.put('/:id', asyncHandler(async (req, res) => {
  const attendanceId = parseInt(req.params.id);
  const attendance = await attendanceService.updateAttendance(attendanceId, req.body);
  res.json(attendance);
}));

// DELETE /api/attendance/:id - Delete attendance record
router.delete('/:id', asyncHandler(async (req, res) => {
  const attendanceId = parseInt(req.params.id);
  await attendanceService.deleteAttendance(attendanceId);
  res.json({ message: 'Attendance record deleted successfully' });
}));

// GET /api/attendance/report/:classId - Get attendance report for a class
router.get('/report/:classId', asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.classId);
  const { startDate, endDate } = req.query;

  const report = await attendanceService.getAttendanceReport(
    classId,
    startDate as string,
    endDate as string
  );

  res.json({ report });
}));

// GET /api/attendance/stats/:studentId - Get attendance statistics for a student
router.get('/stats/:studentId', asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const { startDate, endDate } = req.query;

  const stats = await attendanceService.getStudentAttendanceStats(
    studentId,
    startDate as string,
    endDate as string
  );

  res.json(stats);
}));

// GET /api/attendance/trends/:classId - Get attendance trends for a class
router.get('/trends/:classId', asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.classId);
  const { startDate, endDate } = req.query;

  const trends = await attendanceService.getAttendanceTrends(
    classId,
    startDate as string,
    endDate as string
  );

  res.json(trends);
}));

// GET /api/attendance/low-attendance/:classId - Get students with low attendance
router.get('/low-attendance/:classId', asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.classId);
  const { startDate, endDate, threshold = 75 } = req.query;

  const students = await attendanceService.getLowAttendanceStudents(
    classId,
    startDate as string,
    endDate as string,
    parseInt(threshold as string)
  );

  res.json({ students });
}));

// GET /api/attendance/monthly/:classId/:year/:month - Get monthly attendance summary
router.get('/monthly/:classId/:year/:month', asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.classId);
  const year = parseInt(req.params.year);
  const month = parseInt(req.params.month);

  const summary = await attendanceService.getMonthlyAttendanceSummary(classId, year, month);
  res.json(summary);
}));

export default router;
