import React, { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { Exam, Class } from '../types';
import { apiClient } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`exam-tabpanel-${index}`}
      aria-labelledby={`exam-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const ExamsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    exam_type_id: '',
    class_id: '',
    academic_year_id: '1',
    start_date: '',
    end_date: '',
    instructions: '',
  });

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/exams') as { data: Exam[] };
      setExams(response.data);
    } catch (err) {
      setError('Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await apiClient.get('/classes') as { data: Class[] };
      setClasses(response.data);
    } catch (err) {
      setError('Failed to fetch classes');
    }
  }, []);

  useEffect(() => {
    fetchExams();
    fetchClasses();
  }, [fetchExams, fetchClasses]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddExam = () => {
    setEditingExam(null);
    setFormData({
      name: '',
      exam_type_id: '',
      class_id: '',
      academic_year_id: '1',
      start_date: '',
      end_date: '',
      instructions: '',
    });
    setDialogOpen(true);
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      exam_type_id: exam.exam_type_id.toString(),
      class_id: exam.class_id.toString(),
      academic_year_id: exam.academic_year_id.toString(),
      start_date: exam.start_date,
      end_date: exam.end_date,
      instructions: exam.instructions || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteExam = async (examId: number) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await apiClient.delete(`/exams/${examId}`);
        setSuccess('Exam deleted successfully');
        fetchExams();
      } catch (err) {
        setError('Failed to delete exam');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (editingExam) {
        await apiClient.put(`/exams/${editingExam.id}`, formData);
        setSuccess('Exam updated successfully');
      } else {
        await apiClient.post('/exams', formData);
        setSuccess('Exam created successfully');
      }
      setDialogOpen(false);
      fetchExams();
    } catch (err) {
      setError('Failed to save exam');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getStatusColor = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return 'info';
    if (now >= start && now <= end) return 'success';
    return 'default';
  };

  const getStatusText = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return 'Upcoming';
    if (now >= start && now <= end) return 'Ongoing';
    return 'Completed';
  };

  const mockExamTypes = [
    { id: 1, name: 'Unit Test' },
    { id: 2, name: 'Mid Term' },
    { id: 3, name: 'Final Exam' },
    { id: 4, name: 'Assessment' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Exam Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage exams, schedules, and assessment activities
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddExam}
          sx={{ height: 'fit-content' }}
        >
          Add Exam
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Upcoming Exams</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {exams.filter(exam => new Date(exam.start_date) > new Date()).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Ongoing Exams</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {exams.filter(exam => {
                  const now = new Date();
                  return new Date(exam.start_date) <= now && new Date(exam.end_date) >= now;
                }).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Total Exams</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {exams.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Exams" />
            <Tab label="Exam Results" />
            <Tab label="Reports" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Exam Name</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell>{exam.name}</TableCell>
                      <TableCell>
                        {classes.find(c => c.id === exam.class_id)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{new Date(exam.start_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(exam.end_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(exam.start_date, exam.end_date)}
                          color={getStatusColor(exam.start_date, exam.end_date)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleEditExam(exam)}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteExam(exam.id!)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {exams.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No exams found. Add your first exam to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Exam Results
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage exam results and student performance
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Exam Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generate comprehensive reports on exam performance
            </Typography>
          </Box>
        </TabPanel>
      </Card>

      {/* Add/Edit Exam Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingExam ? 'Edit Exam' : 'Add New Exam'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Exam Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Exam Type</InputLabel>
                <Select
                  value={formData.exam_type_id}
                  onChange={(e) => handleInputChange('exam_type_id', e.target.value)}
                  label="Exam Type"
                >
                  {mockExamTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Class</InputLabel>
                <Select
                  value={formData.class_id}
                  onChange={(e) => handleInputChange('class_id', e.target.value)}
                  label="Class"
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id!.toString()}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Academic Year ID"
                value={formData.academic_year_id}
                onChange={(e) => handleInputChange('academic_year_id', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                multiline
                rows={4}
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : (editingExam ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
