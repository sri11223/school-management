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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Today as TodayIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckCircleIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Section, Class, Attendance, AttendanceStats, AttendanceFilters, Student } from '../../types';
import { attendanceAPI, classAPI } from '../../services/api';

interface ClassAttendanceTabProps {
  classId: string;
  classData: Class;
  sections: Section[];
}

interface AttendanceFormData {
  student_id: number;
  class_id: number;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Excused';
  check_in_time?: string;
  check_out_time?: string;
  remarks?: string;
  marked_by: number;
}

interface BulkAttendanceData {
  date: string;
  classId: number;
  attendanceList: Array<{
    student_id: number;
    status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Excused';
    remarks?: string;
  }>;
  markedBy: number;
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

const attendanceStatuses = [
  'Present',
  'Absent',
  'Late',
  'Half Day',
  'Excused'
];

export const ClassAttendanceTab: React.FC<ClassAttendanceTabProps> = ({ classId, classData, sections }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // Dialog states
  const [openMarkDialog, setOpenMarkDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<Partial<AttendanceFormData>>({
    student_id: 0,
    class_id: parseInt(classId),
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    check_in_time: '',
    check_out_time: '',
    remarks: '',
    marked_by: 1, // Should come from auth context
  });

  // Bulk attendance data
  const [bulkAttendanceData, setBulkAttendanceData] = useState<BulkAttendanceData>({
    date: new Date().toISOString().split('T')[0],
    classId: parseInt(classId),
    attendanceList: [],
    markedBy: 1,
  });

  // Fetch students for the class
  const fetchStudents = React.useCallback(async () => {
    try {
      const response = await classAPI.getStudents(classId) as { data: Student[] };
      setStudents(response.data || []);
      
      // Initialize bulk attendance data with all students
      const initialAttendanceList = (response.data || []).map((student: Student) => ({
        student_id: student.id!,
        status: 'Present' as const,
        remarks: ''
      }));
      
      setBulkAttendanceData(prev => ({
        ...prev,
        attendanceList: initialAttendanceList
      }));
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  }, [classId]);

  // Fetch attendance records
  const fetchAttendanceRecords = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 0) {
        // Daily attendance view - get attendance for selected date
        const response = await attendanceAPI.getClassAttendance(parseInt(classId), selectedDate) as { attendance: Attendance[]; report: any[] };
        setAttendanceRecords(response.attendance || []);
      } else if (activeTab === 1) {
        // Records view - get paginated attendance records
        const filters: AttendanceFilters = {
          class_id: parseInt(classId),
          status: selectedStatus || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        };

        const response = await attendanceAPI.getStudentAttendance(0, {
          page: page + 1,
          limit: rowsPerPage,
          ...filters
        });

        setAttendanceRecords(response.data || []);
        setTotal(response.pagination?.total || 0);
      }
    } catch (err) {
      setError('Failed to fetch attendance records');
      console.error('Error fetching attendance records:', err);
    } finally {
      setLoading(false);
    }
  }, [classId, selectedDate, activeTab, page, rowsPerPage, selectedStatus, dateFrom, dateTo]);

  // Fetch attendance statistics
  const fetchAttendanceStats = React.useCallback(async () => {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      
      const response = await attendanceAPI.getAttendanceReport(parseInt(classId), {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      setAttendanceStats(response.report || []);
    } catch (err) {
      console.error('Error fetching attendance stats:', err);
    }
  }, [classId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);

  useEffect(() => {
    if (activeTab === 2) {
      fetchAttendanceStats();
    }
  }, [activeTab, fetchAttendanceStats]);

  const handleMarkIndividualAttendance = async () => {
    try {
      await attendanceAPI.markAttendance(formData);
      setOpenMarkDialog(false);
      resetForm();
      fetchAttendanceRecords();
    } catch (err) {
      setError('Failed to mark attendance');
      console.error('Error marking attendance:', err);
    }
  };

  const handleMarkBulkAttendance = async () => {
    try {
      await attendanceAPI.markBulkAttendance({
        classId: bulkAttendanceData.classId,
        date: bulkAttendanceData.date,
        attendanceList: bulkAttendanceData.attendanceList,
        markedBy: bulkAttendanceData.markedBy
      });
      
      setOpenBulkDialog(false);
      fetchAttendanceRecords();
    } catch (err) {
      setError('Failed to mark bulk attendance');
      console.error('Error marking bulk attendance:', err);
    }
  };

  const handleEditAttendance = async () => {
    try {
      if (!selectedAttendance?.id) return;
      
      await attendanceAPI.updateAttendance(selectedAttendance.id, formData);
      setOpenEditDialog(false);
      setSelectedAttendance(null);
      resetForm();
      fetchAttendanceRecords();
    } catch (err) {
      setError('Failed to update attendance');
      console.error('Error updating attendance:', err);
    }
  };

  const handleDeleteAttendance = async () => {
    try {
      if (!selectedAttendance?.id) return;
      
      await attendanceAPI.deleteAttendance(selectedAttendance.id);
      setOpenDeleteDialog(false);
      setSelectedAttendance(null);
      fetchAttendanceRecords();
    } catch (err) {
      setError('Failed to delete attendance');
      console.error('Error deleting attendance:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: 0,
      class_id: parseInt(classId),
      date: new Date().toISOString().split('T')[0],
      status: 'Present',
      check_in_time: '',
      check_out_time: '',
      remarks: '',
      marked_by: 1,
    });
  };

  const openEditAttendanceDialog = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    setFormData({
      student_id: attendance.student_id,
      class_id: attendance.class_id,
      date: attendance.date,
      status: attendance.status,
      check_in_time: attendance.check_in_time,
      check_out_time: attendance.check_out_time,
      remarks: attendance.remarks,
      marked_by: attendance.marked_by,
    });
    setOpenEditDialog(true);
  };

  const openDeleteAttendanceDialog = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    setOpenDeleteDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'success';
      case 'Absent': return 'error';
      case 'Late': return 'warning';
      case 'Half Day': return 'info';
      case 'Excused': return 'default';
      default: return 'default';
    }
  };

  const updateBulkAttendanceStatus = (studentId: number, status: string) => {
    setBulkAttendanceData(prev => ({
      ...prev,
      attendanceList: prev.attendanceList.map(item =>
        item.student_id === studentId ? { ...item, status: status as any } : item
      )
    }));
  };

  // Calculate attendance statistics for the dashboard
  const totalStudents = students.length;
  const presentToday = attendanceRecords.filter(r => r.status === 'Present').length;
  const absentToday = attendanceRecords.filter(r => r.status === 'Absent').length;
  const lateToday = attendanceRecords.filter(r => r.status === 'Late').length;
  const attendancePercentage = totalStudents > 0 ? ((presentToday + lateToday) / totalStudents * 100) : 0;

  if (loading && attendanceRecords.length === 0) {
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
                <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {presentToday}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Present Today
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
                <WarningIcon color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {absentToday}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Absent Today
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
                <TrendingUpIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {attendancePercentage.toFixed(1)}%
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Attendance Rate
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
                <EventIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {totalStudents}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Total Students
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Daily Attendance" icon={<TodayIcon />} />
          <Tab label="Attendance Records" icon={<EventIcon />} />
          <Tab label="Analytics" icon={<AnalyticsIcon />} />
        </Tabs>
      </Card>

      {/* Daily Attendance Tab */}
      <TabPanel value={activeTab} index={0}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Daily Attendance</Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  type="date"
                  label="Date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenMarkDialog(true)}
                >
                  Mark Individual
                </Button>
                <Button
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => setOpenBulkDialog(true)}
                >
                  Mark All
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Admission Number</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Remarks</TableCell>
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
                ) : attendanceRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">
                        No attendance records for {selectedDate}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceRecords.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {record.student_name || `Student ${record.student_id}`}
                        </Typography>
                      </TableCell>
                      <TableCell>{record.student?.admission_number || 'N/A'}</TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.status}
                          color={getStatusColor(record.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{record.check_in_time || 'N/A'}</TableCell>
                      <TableCell>{record.check_out_time || 'N/A'}</TableCell>
                      <TableCell>{record.remarks || 'N/A'}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => openEditAttendanceDialog(record)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteAttendanceDialog(record)}
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
        </Card>
      </TabPanel>

      {/* Attendance Records Tab */}
      <TabPanel value={activeTab} index={1}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Attendance Records</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
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
                />
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
                    {attendanceStatuses.map((status) => (
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

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : attendanceRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">
                        No attendance records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceRecords.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {record.student_name || `Student ${record.student_id}`}
                        </Typography>
                      </TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.status}
                          color={getStatusColor(record.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{record.check_in_time || 'N/A'}</TableCell>
                      <TableCell>{record.check_out_time || 'N/A'}</TableCell>
                      <TableCell>{record.remarks || 'N/A'}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => openEditAttendanceDialog(record)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteAttendanceDialog(record)}
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
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={activeTab} index={2}>
        <Typography variant="h6" sx={{ mb: 2 }}>Attendance Analytics</Typography>
        
        {attendanceStats.length > 0 ? (
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Total Days</TableCell>
                    <TableCell>Present Days</TableCell>
                    <TableCell>Absent Days</TableCell>
                    <TableCell>Late Days</TableCell>
                    <TableCell>Attendance %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceStats.map((stat) => (
                    <TableRow key={stat.student_id}>
                      <TableCell>
                        <Typography variant="subtitle2">{stat.student_name}</Typography>
                      </TableCell>
                      <TableCell>{stat.total_days}</TableCell>
                      <TableCell>{stat.present_days}</TableCell>
                      <TableCell>{stat.absent_days}</TableCell>
                      <TableCell>{stat.late_days}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${stat.attendance_percentage.toFixed(1)}%`}
                          color={stat.attendance_percentage >= 75 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        ) : (
          <Typography color="text.secondary" align="center">
            No attendance analytics available
          </Typography>
        )}
      </TabPanel>

      {/* Individual Attendance Dialog */}
      <Dialog
        open={openMarkDialog || openEditDialog}
        onClose={() => {
          setOpenMarkDialog(false);
          setOpenEditDialog(false);
          setSelectedAttendance(null);
          resetForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {openMarkDialog ? 'Mark Attendance' : 'Edit Attendance'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Student</InputLabel>
                <Select
                  value={formData.student_id}
                  label="Student"
                  onChange={(e) => setFormData({ ...formData, student_id: parseInt(e.target.value as string) })}
                >
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.admission_number})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
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
                  {attendanceStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="time"
                label="Check In Time"
                value={formData.check_in_time}
                onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="time"
                label="Check Out Time"
                value={formData.check_out_time}
                onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                multiline
                rows={2}
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenMarkDialog(false);
            setOpenEditDialog(false);
            setSelectedAttendance(null);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={openMarkDialog ? handleMarkIndividualAttendance : handleEditAttendance}
          >
            {openMarkDialog ? 'Mark Attendance' : 'Update Attendance'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Attendance Dialog */}
      <Dialog
        open={openBulkDialog}
        onClose={() => setOpenBulkDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Mark Bulk Attendance</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              type="date"
              label="Date"
              value={bulkAttendanceData.date}
              onChange={(e) => setBulkAttendanceData({ ...bulkAttendanceData, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mr: 2 }}
            />
          </Box>
          
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Admission Number</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      {student.first_name} {student.last_name}
                    </TableCell>
                    <TableCell>{student.admission_number}</TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select
                          value={bulkAttendanceData.attendanceList[index]?.status || 'Present'}
                          onChange={(e) => updateBulkAttendanceStatus(student.id!, e.target.value)}
                        >
                          {attendanceStatuses.map((status) => (
                            <MenuItem key={status} value={status}>
                              {status}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Remarks"
                        value={bulkAttendanceData.attendanceList[index]?.remarks || ''}
                        onChange={(e) => {
                          setBulkAttendanceData(prev => ({
                            ...prev,
                            attendanceList: prev.attendanceList.map((item, i) =>
                              i === index ? { ...item, remarks: e.target.value } : item
                            )
                          }));
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleMarkBulkAttendance}
          >
            Mark All Attendance
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => {
          setOpenDeleteDialog(false);
          setSelectedAttendance(null);
        }}
      >
        <DialogTitle>Delete Attendance Record</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this attendance record?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDeleteDialog(false);
            setSelectedAttendance(null);
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAttendance}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
