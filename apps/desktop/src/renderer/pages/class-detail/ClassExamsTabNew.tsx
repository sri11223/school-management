import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip,
  TablePagination,
  Stack,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  Grade as GradeIcon,
  EventNote as EventNoteIcon,
  QuestionAnswer as QuestionIcon,
  Analytics as AnalyticsIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { Section, Class, Exam, ExamResult, ExamFilters } from '../../types';
import { examAPI } from '../../services/api';

interface ClassExamsTabProps {
  classId: string;
  classData: Class;
  sections: Section[];
}

interface ExamFormData {
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
}

const examTypes = [
  'Unit Test',
  'Mid Term', 
  'Final',
  'Monthly',
  'Quarterly',
  'Half Yearly',
  'Annual'
];

const examStatuses = [
  'Draft',
  'Published',
  'Completed',
  'Cancelled'
];

export const ClassExamsTab: React.FC<ClassExamsTabProps> = ({ classId, classData, sections }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<Partial<ExamFormData>>({
    name: '',
    exam_type: 'Unit Test',
    subject_id: 0,
    class_id: parseInt(classId),
    academic_year_id: 1,
    exam_date: '',
    start_time: '',
    end_time: '',
    total_marks: 100,
    pass_marks: 35,
    instructions: '',
    created_by: 1,
    status: 'Draft',
  });

  // Fetch exams
  const fetchExams = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: ExamFilters = {
        class_id: parseInt(classId),
        search: searchTerm || undefined,
        exam_type: selectedType || undefined,
        status: selectedStatus || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };

      const response = await examAPI.getAll({
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      });

      setExams(response.data || []);
      setTotal(response.pagination?.total || 0);
    } catch (err) {
      setError('Failed to fetch exams');
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  }, [classId, page, rowsPerPage, searchTerm, selectedType, selectedStatus, dateFrom, dateTo]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleAddExam = async () => {
    try {
      const examData = {
        ...formData,
        class_id: parseInt(classId),
      } as ExamFormData;

      await examAPI.create(examData);
      setOpenAddDialog(false);
      resetForm();
      fetchExams();
    } catch (err) {
      setError('Failed to add exam');
      console.error('Error adding exam:', err);
    }
  };

  const handleEditExam = async () => {
    try {
      if (!selectedExam?.id) return;
      
      await examAPI.update(selectedExam.id, formData);
      setOpenEditDialog(false);
      setSelectedExam(null);
      resetForm();
      fetchExams();
    } catch (err) {
      setError('Failed to update exam');
      console.error('Error updating exam:', err);
    }
  };

  const handleDeleteExam = async () => {
    try {
      if (!selectedExam?.id) return;
      
      await examAPI.delete(selectedExam.id);
      setOpenDeleteDialog(false);
      setSelectedExam(null);
      fetchExams();
    } catch (err) {
      setError('Failed to delete exam');
      console.error('Error deleting exam:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      exam_type: 'Unit Test',
      subject_id: 0,
      class_id: parseInt(classId),
      academic_year_id: 1,
      exam_date: '',
      start_time: '',
      end_time: '',
      total_marks: 100,
      pass_marks: 35,
      instructions: '',
      created_by: 1,
      status: 'Draft',
    });
  };

  const openEditExamDialog = (exam: Exam) => {
    setSelectedExam(exam);
    setFormData({
      name: exam.name,
      exam_type: exam.exam_type,
      subject_id: exam.subject_id,
      class_id: exam.class_id,
      academic_year_id: exam.academic_year_id,
      exam_date: exam.exam_date,
      start_time: exam.start_time,
      end_time: exam.end_time,
      total_marks: exam.total_marks,
      pass_marks: exam.pass_marks,
      instructions: exam.instructions,
      created_by: exam.created_by,
      status: exam.status,
    });
    setOpenEditDialog(true);
  };

  const openDeleteExamDialog = (exam: Exam) => {
    setSelectedExam(exam);
    setOpenDeleteDialog(true);
  };

  const openViewExamDialog = async (exam: Exam) => {
    setSelectedExam(exam);
    try {
      // Fetch exam results
      const results = await examAPI.getResults(exam.id!);
      setExamResults((results as any).data || []);
    } catch (err) {
      console.error('Error fetching exam results:', err);
      setExamResults([]);
    }
    setOpenViewDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Published': return 'primary';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'Unit Test': return 'info';
      case 'Mid Term': return 'warning';
      case 'Final': return 'error';
      case 'Annual': return 'success';
      default: return 'primary';
    }
  };

  // Calculate exam statistics
  const examStats = {
    total: exams.length,
    published: exams.filter(e => e.status === 'Published').length,
    completed: exams.filter(e => e.status === 'Completed').length,
    upcoming: exams.filter(e => e.status === 'Published' && new Date(e.exam_date) > new Date()).length,
  };

  if (loading && exams.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <EventNoteIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {examStats.total}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Total Exams
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssessmentIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {examStats.upcoming}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Upcoming
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <GradeIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {examStats.completed}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AnalyticsIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {examStats.published}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Published
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Exams Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
            >
              Add Exam
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Exam Type</InputLabel>
                <Select
                  value={selectedType}
                  label="Exam Type"
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {examTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  {examStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="From Date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="To Date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Exams Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Exam Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Marks</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary">
                      No exams found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{exam.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={exam.exam_type}
                        color={getExamTypeColor(exam.exam_type) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{exam.subject_name || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(exam.exam_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {exam.start_time} - {exam.end_time}
                    </TableCell>
                    <TableCell>
                      {exam.total_marks} (Pass: {exam.pass_marks})
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={exam.status}
                        color={getStatusColor(exam.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => openViewExamDialog(exam)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => openEditExamDialog(exam)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openDeleteExamDialog(exam)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Card>

      {/* Add/Edit Exam Dialog */}
      <Dialog
        open={openAddDialog || openEditDialog}
        onClose={() => {
          setOpenAddDialog(false);
          setOpenEditDialog(false);
          setSelectedExam(null);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {openAddDialog ? 'Add New Exam' : 'Edit Exam'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Exam Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Exam Type</InputLabel>
                <Select
                  value={formData.exam_type}
                  label="Exam Type"
                  onChange={(e) => setFormData({ ...formData, exam_type: e.target.value as any })}
                >
                  {examTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subject ID"
                type="number"
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Exam Date"
                value={formData.exam_date}
                onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="time"
                label="Start Time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="time"
                label="End Time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Marks"
                type="number"
                value={formData.total_marks}
                onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pass Marks"
                type="number"
                value={formData.pass_marks}
                onChange={(e) => setFormData({ ...formData, pass_marks: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  {examStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                multiline
                rows={3}
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenAddDialog(false);
            setOpenEditDialog(false);
            setSelectedExam(null);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={openAddDialog ? handleAddExam : handleEditExam}
          >
            {openAddDialog ? 'Add Exam' : 'Update Exam'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => {
          setOpenDeleteDialog(false);
          setSelectedExam(null);
        }}
      >
        <DialogTitle>Delete Exam</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the exam "{selectedExam?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDeleteDialog(false);
            setSelectedExam(null);
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteExam}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Exam Details Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={() => {
          setOpenViewDialog(false);
          setSelectedExam(null);
          setExamResults([]);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Exam Details - {selectedExam?.name}
        </DialogTitle>
        <DialogContent>
          {selectedExam && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Exam Type
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedExam.exam_type}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Subject
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedExam.subject_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date & Time
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {new Date(selectedExam.exam_date).toLocaleDateString()} at {selectedExam.start_time} - {selectedExam.end_time}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Marks
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Total: {selectedExam.total_marks}, Pass: {selectedExam.pass_marks}
                  </Typography>
                </Grid>
                {selectedExam.instructions && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Instructions
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedExam.instructions}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ mb: 2 }}>
                Exam Results ({examResults.length})
              </Typography>
              
              {examResults.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Marks Obtained</TableCell>
                        <TableCell>Percentage</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {examResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell>{result.student_name || `Student ${result.student_id}`}</TableCell>
                          <TableCell>{result.marks_obtained} / {selectedExam.total_marks}</TableCell>
                          <TableCell>{result.percentage.toFixed(1)}%</TableCell>
                          <TableCell>
                            <Chip
                              label={result.grade}
                              color={result.percentage >= 60 ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={result.status}
                              color={result.status === 'Present' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" align="center">
                  No results available for this exam
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenViewDialog(false);
            setSelectedExam(null);
            setExamResults([]);
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
