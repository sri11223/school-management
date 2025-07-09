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
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  Grade as GradeIcon,
  EventNote as EventNoteIcon,
} from '@mui/icons-material';
import { Section, Class, Exam } from '../../types';
import { apiClient } from '../../services/api';

interface ClassExamsTabProps {
  classId: string;
  classData: Class;
  sections: Section[];
}

interface ExamFormData {
  name: string;
  description: string;
  exam_type: 'quiz' | 'test' | 'midterm' | 'final' | 'assignment';
  section_id: number;
  subject: string;
  date: string;
  duration: number;
  max_marks: number;
  instructions: string;
}

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ClassExamsTab: React.FC<ClassExamsTabProps> = ({ classId, classData, sections }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  
  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<ExamFormData>({
    name: '',
    description: '',
    exam_type: 'quiz',
    section_id: 0,
    subject: '',
    date: '',
    duration: 60,
    max_marks: 100,
    instructions: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch exams
        const examsResponse = await apiClient.get(`/exams?class_id=${classId}`);
        setExams((examsResponse as any).data || []);
        
        // Fetch exam results
        // const resultsResponse = await apiClient.get(`/exam-results?class_id=${classId}`);
        // setExamResults((resultsResponse as any).data || []);
      } catch (err) {
        setError('Failed to fetch exams data');
        console.error('Error fetching exams:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  const handleAddExam = async () => {
    try {
      const response = await apiClient.post('/exams', {
        ...formData,
        class_id: parseInt(classId),
      });
      setExams([...exams, (response as any).data]);
      setOpenAddDialog(false);
      resetForm();
    } catch (err) {
      setError('Failed to add exam');
      console.error('Error adding exam:', err);
    }
  };

  const handleUpdateExam = async () => {
    if (!editingExam) return;

    try {
      const response = await apiClient.put(`/exams/${editingExam.id}`, formData);
      setExams(exams.map(exam => 
        exam.id === editingExam.id ? (response as any).data : exam
      ));
      setOpenEditDialog(false);
      resetForm();
    } catch (err) {
      setError('Failed to update exam');
      console.error('Error updating exam:', err);
    }
  };

  const handleDeleteExam = async () => {
    if (!deletingExam) return;

    try {
      await apiClient.delete(`/exams/${deletingExam.id}`);
      setExams(exams.filter(exam => exam.id !== deletingExam.id));
      setOpenDeleteDialog(false);
      setDeletingExam(null);
    } catch (err) {
      setError('Failed to delete exam');
      console.error('Error deleting exam:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      exam_type: 'quiz',
      section_id: 0,
      subject: '',
      date: '',
      duration: 60,
      max_marks: 100,
      instructions: '',
    });
    setEditingExam(null);
  };

  const openEditExamDialog = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      description: exam.description || '',
      exam_type: exam.exam_type,
      section_id: exam.section_id,
      subject: exam.subject,
      date: exam.date,
      duration: exam.duration,
      max_marks: exam.max_marks,
      instructions: exam.instructions || '',
    });
    setOpenEditDialog(true);
  };

  const openDeleteExamDialog = (exam: Exam) => {
    setDeletingExam(exam);
    setOpenDeleteDialog(true);
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = selectedSection === 'all' || exam.section_id.toString() === selectedSection;
    return matchesSearch && matchesSection;
  });

  const getSectionName = (sectionId: number) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? section.name : 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'quiz': return 'info';
      case 'test': return 'primary';
      case 'midterm': return 'warning';
      case 'final': return 'error';
      case 'assignment': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
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

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Exams" icon={<AssessmentIcon />} />
        <Tab label="Results" icon={<GradeIcon />} />
        <Tab label="Schedule" icon={<EventNoteIcon />} />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            Exams for {classData.name}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
          >
            Add Exam
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Section</InputLabel>
                  <Select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    label="Section"
                  >
                    <MenuItem value="all">All Sections</MenuItem>
                    {sections.map((section) => (
                      <MenuItem key={section.id || 0} value={(section.id || 0).toString()}>
                        {section.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Total: {filteredExams.length} exams
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Exams Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Exam Name</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Max Marks</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{exam.name}</Typography>
                    {exam.description && (
                      <Typography variant="body2" color="text.secondary">
                        {exam.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell>
                    <Chip
                      label={exam.exam_type}
                      size="small"
                      color={getExamTypeColor(exam.exam_type)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getSectionName(exam.section_id)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{new Date(exam.date).toLocaleDateString()}</TableCell>
                  <TableCell>{exam.duration} min</TableCell>
                  <TableCell>{exam.max_marks}</TableCell>
                  <TableCell>
                    <Chip
                      label={exam.status}
                      size="small"
                      color={getStatusColor(exam.status)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEditExamDialog(exam)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => openDeleteExamDialog(exam)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Typography variant="h6" gutterBottom>
          Exam Results
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Results and grading will be shown here.
        </Typography>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Typography variant="h6" gutterBottom>
          Exam Schedule
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Calendar view of upcoming exams will be shown here.
        </Typography>
      </TabPanel>

      {/* Add Exam Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Exam</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Exam Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Exam Type</InputLabel>
                <Select
                  value={formData.exam_type}
                  onChange={(e) => setFormData({...formData, exam_type: e.target.value as any})}
                  label="Exam Type"
                >
                  <MenuItem value="quiz">Quiz</MenuItem>
                  <MenuItem value="test">Test</MenuItem>
                  <MenuItem value="midterm">Midterm</MenuItem>
                  <MenuItem value="final">Final</MenuItem>
                  <MenuItem value="assignment">Assignment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Section</InputLabel>
                <Select
                  value={formData.section_id}
                  onChange={(e) => setFormData({...formData, section_id: Number(e.target.value)})}
                  label="Section"
                >
                  {sections.map((section) => (
                    <MenuItem key={section.id || 0} value={section.id || 0}>
                      {section.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Marks"
                type="number"
                value={formData.max_marks}
                onChange={(e) => setFormData({...formData, max_marks: Number(e.target.value)})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                multiline
                rows={3}
                value={formData.instructions}
                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddExam} variant="contained">
            Add Exam
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Exam Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Exam</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Exam Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Exam Type</InputLabel>
                <Select
                  value={formData.exam_type}
                  onChange={(e) => setFormData({...formData, exam_type: e.target.value as any})}
                  label="Exam Type"
                >
                  <MenuItem value="quiz">Quiz</MenuItem>
                  <MenuItem value="test">Test</MenuItem>
                  <MenuItem value="midterm">Midterm</MenuItem>
                  <MenuItem value="final">Final</MenuItem>
                  <MenuItem value="assignment">Assignment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Section</InputLabel>
                <Select
                  value={formData.section_id}
                  onChange={(e) => setFormData({...formData, section_id: Number(e.target.value)})}
                  label="Section"
                >
                  {sections.map((section) => (
                    <MenuItem key={section.id || 0} value={section.id || 0}>
                      {section.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Marks"
                type="number"
                value={formData.max_marks}
                onChange={(e) => setFormData({...formData, max_marks: Number(e.target.value)})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                multiline
                rows={3}
                value={formData.instructions}
                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateExam} variant="contained">
            Update Exam
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Exam Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Exam</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the exam "{deletingExam?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteExam} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
