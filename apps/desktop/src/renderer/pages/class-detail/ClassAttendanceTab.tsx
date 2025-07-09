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
  IconButton,
  Alert,
  CircularProgress,
  InputAdornment,
  Tabs,
  Tab,
  Tooltip,
  Checkbox,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  EventNote as EventNoteIcon,
  Today as TodayIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { AttendanceRecord, Section, Class, Student } from '../../types';
import { apiClient } from '../../services/api';

interface ClassAttendanceTabProps {
  classId: string;
  classData: Class;
  sections: Section[];
}

interface AttendanceMarkingData {
  date: Date;
  section_id: number;
  records: {
    student_id: number;
    status: 'Present' | 'Absent' | 'Late' | 'Excused';
    remarks?: string;
  }[];
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
      id={`attendance-tabpanel-${index}`}
      aria-labelledby={`attendance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ClassAttendanceTab: React.FC<ClassAttendanceTabProps> = ({ classId, classData, sections }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | number>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Dialog states
  const [openMarkDialog, setOpenMarkDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  
  // Attendance marking data
  const [markingData, setMarkingData] = useState<AttendanceMarkingData>({
    date: new Date(),
    section_id: 0,
    records: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch attendance records
        const attendanceResponse = await apiClient.get(`/attendance?class_id=${classId}`) as { data: AttendanceRecord[] };
        setAttendanceRecords(attendanceResponse.data);
        
        // Fetch students
        const studentsResponse = await apiClient.get(`/students?class_id=${classId}`) as { data: Student[] };
        setStudents(studentsResponse.data);
      } catch (err) {
        setError('Failed to fetch attendance data');
        console.error('Error fetching attendance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  const handleMarkAttendance = async () => {
    try {
      const response = await apiClient.post('/attendance', markingData) as { data: AttendanceRecord[] };
      setAttendanceRecords([...attendanceRecords, ...response.data]);
      setOpenMarkDialog(false);
      resetMarkingData();
    } catch (err) {
      setError('Failed to mark attendance');
      console.error('Error marking attendance:', err);
    }
  };

  const handleUpdateAttendance = async () => {
    if (!editingRecord) return;

    try {
      const response = await apiClient.put(`/attendance/${editingRecord.id}`, editingRecord) as { data: AttendanceRecord };
      setAttendanceRecords(attendanceRecords.map(record => 
        record.id === editingRecord.id ? response.data : record
      ));
      setOpenEditDialog(false);
      setEditingRecord(null);
    } catch (err) {
      setError('Failed to update attendance');
      console.error('Error updating attendance:', err);
    }
  };

  const handleDeleteAttendance = async (recordId: number) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;

    try {
      await apiClient.delete(`/attendance/${recordId}`);
      setAttendanceRecords(attendanceRecords.filter(record => record.id !== recordId));
    } catch (err) {
      setError('Failed to delete attendance record');
      console.error('Error deleting attendance:', err);
    }
  };

  const resetMarkingData = () => {
    setMarkingData({
      date: new Date(),
      section_id: 0,
      records: [],
    });
  };

  const openMarkAttendanceDialog = (sectionId: number) => {
    const sectionStudents = students.filter(student => student.section_id === sectionId);
    setMarkingData({
      date: new Date(),
      section_id: sectionId,
      records: sectionStudents.map(student => ({
        student_id: student.id!,
        status: 'Present',
        remarks: '',
      })),
    });
    setOpenMarkDialog(true);
  };

  const openEditAttendanceDialog = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setOpenEditDialog(true);
  };

  const updateStudentAttendance = (studentId: number, status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    setMarkingData(prev => ({
      ...prev,
      records: prev.records.map(record => 
        record.student_id === studentId ? { ...record, status } : record
      ),
    }));
  };

  const updateStudentRemarks = (studentId: number, remarks: string) => {
    setMarkingData(prev => ({
      ...prev,
      records: prev.records.map(record => 
        record.student_id === studentId ? { ...record, remarks } : record
      ),
    }));
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const student = students.find(s => s.id === record.student_id);
    const matchesSearch = student ? 
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesSection = selectedSection === 'all' || record.section_id === selectedSection;
    const matchesDate = selectedDate ? 
      new Date(record.date).toISOString().split('T')[0] === selectedDate : true;
    return matchesSearch && matchesSection && matchesDate;
  });

  const getAttendanceStats = () => {
    const today = new Date().toDateString();
    const todayRecords = attendanceRecords.filter(record => 
      new Date(record.date).toDateString() === today
    );
    
    const totalPresent = todayRecords.filter(record => record.status === 'Present').length;
    const totalAbsent = todayRecords.filter(record => record.status === 'Absent').length;
    const totalLate = todayRecords.filter(record => record.status === 'Late').length;
    const totalExcused = todayRecords.filter(record => record.status === 'Excused').length;
    
    return {
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      attendancePercentage: todayRecords.length > 0 ? 
        ((totalPresent + totalLate + totalExcused) / todayRecords.length) * 100 : 0,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'success';
      case 'Absent': return 'error';
      case 'Late': return 'warning';
      case 'Excused': return 'info';
      default: return 'default';
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Sub-navigation tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="attendance tabs">
          <Tab
            label="Mark Attendance"
            icon={<TodayIcon />}
            iconPosition="start"
            id="attendance-tab-0"
            aria-controls="attendance-tabpanel-0"
          />
          <Tab
            label="Attendance Records"
            icon={<EventNoteIcon />}
            iconPosition="start"
            id="attendance-tab-1"
            aria-controls="attendance-tabpanel-1"
          />
          <Tab
            label="Analytics"
            icon={<AnalyticsIcon />}
            iconPosition="start"
            id="attendance-tab-2"
            aria-controls="attendance-tabpanel-2"
          />
        </Tabs>
      </Box>

      {/* Mark Attendance Tab */}
      <TabPanel value={activeTab} index={0}>
        {/* Today's Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main" gutterBottom>
                  Present
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalPresent}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main" gutterBottom>
                  Absent
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalAbsent}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main" gutterBottom>
                  Late
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalLate}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main" gutterBottom>
                  Excused
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalExcused}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary.main" gutterBottom>
                  Attendance %
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.attendancePercentage.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Section Cards for Marking Attendance */}
        <Grid container spacing={3}>
          {sections.map((section) => (
            <Grid item xs={12} md={6} key={section.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {section.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {students.filter(s => s.section_id === section.id).length} students
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => openMarkAttendanceDialog(section.id!)}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Mark Attendance
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Attendance Records Tab */}
      <TabPanel value={activeTab} index={1}>
        {/* Search and Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1, minWidth: 200 }}
              />
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  label="Section"
                >
                  <MenuItem value="all">All Sections</MenuItem>
                  {sections.map((section) => (
                    <MenuItem key={section.id} value={section.id}>
                      {section.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Select Date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => {/* TODO: Implement export */}}
              >
                Export
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Attendance Records Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.map((record) => {
                const student = students.find(s => s.id === record.student_id);
                const section = sections.find(s => s.id === record.section_id);
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {student ? `${student.first_name} ${student.last_name}` : 'Unknown Student'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {student?.admission_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{section?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      {new Date(record.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        color={getStatusColor(record.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{record.remarks || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit Record">
                          <IconButton
                            size="small"
                            onClick={() => openEditAttendanceDialog(record)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Record">
                          <IconButton
                            size="small"
                            onClick={() => record.id && handleDeleteAttendance(record.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={activeTab} index={2}>
        <Typography variant="h6" gutterBottom>
          Attendance Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This section will show attendance analytics like trends, patterns, and insights.
        </Typography>
        {/* TODO: Implement analytics charts and insights */}
      </TabPanel>

      {/* Mark Attendance Dialog */}
      <Dialog
        open={openMarkDialog}
        onClose={() => setOpenMarkDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Mark Attendance - {sections.find(s => s.id === markingData.section_id)?.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Date"
            type="date"
            value={markingData.date ? new Date(markingData.date).toISOString().split('T')[0] : ''}
            onChange={(e) => setMarkingData(prev => ({ ...prev, date: new Date(e.target.value) }))}
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Present</TableCell>
                  <TableCell>Absent</TableCell>
                  <TableCell>Late</TableCell>
                  <TableCell>Excused</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {markingData.records.map((record) => {
                  const student = students.find(s => s.id === record.student_id);
                  return (
                    <TableRow key={record.student_id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {student ? `${student.first_name} ${student.last_name}` : 'Unknown'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {student?.admission_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={record.status === 'Present'}
                          onChange={() => updateStudentAttendance(record.student_id, 'Present')}
                          color="success"
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={record.status === 'Absent'}
                          onChange={() => updateStudentAttendance(record.student_id, 'Absent')}
                          color="error"
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={record.status === 'Late'}
                          onChange={() => updateStudentAttendance(record.student_id, 'Late')}
                          color="warning"
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={record.status === 'Excused'}
                          onChange={() => updateStudentAttendance(record.student_id, 'Excused')}
                          color="info"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={record.remarks || ''}
                          onChange={(e) => updateStudentRemarks(record.student_id, e.target.value)}
                          placeholder="Add remarks..."
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMarkDialog(false)}>Cancel</Button>
          <Button onClick={handleMarkAttendance} variant="contained">
            Mark Attendance
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Attendance Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Attendance Record</DialogTitle>
        <DialogContent>
          {editingRecord && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editingRecord.status}
                    onChange={(e) => setEditingRecord({
                      ...editingRecord,
                      status: e.target.value as 'Present' | 'Absent' | 'Late' | 'Excused'
                    })}
                    label="Status"
                  >
                    <MenuItem value="Present">Present</MenuItem>
                    <MenuItem value="Absent">Absent</MenuItem>
                    <MenuItem value="Late">Late</MenuItem>
                    <MenuItem value="Excused">Excused</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Remarks"
                  value={editingRecord.remarks || ''}
                  onChange={(e) => setEditingRecord({
                    ...editingRecord,
                    remarks: e.target.value
                  })}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateAttendance} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
