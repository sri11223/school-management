import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
} from '@mui/material';
import { AttendanceRecord, Section, Student, ClassWithSections } from '../types';
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
      id={`attendance-tabpanel-${index}`}
      aria-labelledby={`attendance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const AttendancePage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<{[key: number]: string}>({});

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/classes?include_sections=true') as { data: ClassWithSections[] };
      const allSections: Section[] = [];
      response.data.forEach((cls: ClassWithSections) => {
        if (cls.sections) {
          allSections.push(...cls.sections);
        }
      });
      setSections(allSections);
    } catch (err) {
      setError('Failed to fetch sections');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/students?section_id=${selectedSection}`) as { data: Student[] };
      setStudents(response.data);
    } catch (err) {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [selectedSection]);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await apiClient.get(`/attendance?section_id=${selectedSection}&date=${dateStr}`) as { data: AttendanceRecord[] };
      
      // Initialize attendance data
      const initialData: {[key: number]: string} = {};
      response.data.forEach((record: AttendanceRecord) => {
        initialData[record.student_id] = record.status;
      });
      setAttendanceData(initialData);
    } catch (err) {
      setError('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  }, [selectedSection, selectedDate]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  useEffect(() => {
    if (selectedSection) {
      fetchStudents();
      fetchAttendance();
    }
  }, [selectedSection, selectedDate, fetchStudents, fetchAttendance]);

  const handleAttendanceChange = (studentId: number, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendance = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const attendanceRecords = Object.entries(attendanceData).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        section_id: parseInt(selectedSection),
        date: dateStr,
        status,
      }));

      await apiClient.post('/attendance/bulk', { records: attendanceRecords });
      setSuccess('Attendance marked successfully!');
      fetchAttendance();
    } catch (err) {
      setError('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
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

  const getAttendanceStats = () => {
    const total = students.length;
    const present = Object.values(attendanceData).filter(status => status === 'Present').length;
    const absent = Object.values(attendanceData).filter(status => status === 'Absent').length;
    const late = Object.values(attendanceData).filter(status => status === 'Late').length;
    const excused = Object.values(attendanceData).filter(status => status === 'Excused').length;
    
    return { total, present, absent, late, excused };
  };

  const stats = getAttendanceStats();

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Attendance Management
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Track and manage student attendance efficiently.
      </Typography>

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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Mark Attendance" />
          <Tab label="Attendance Reports" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Select Date"
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Select Section</InputLabel>
                  <Select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                  >
                    {sections.map((section) => (
                      <MenuItem key={section.id} value={section.id?.toString()}>
                        {section.section_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmitAttendance}
                  disabled={!selectedSection || loading}
                  sx={{ height: 56 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Submit Attendance'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {selectedSection && (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {stats.present}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Present
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main" fontWeight="bold">
                      {stats.absent}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Absent
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {stats.late}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Late
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {stats.excused}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Excused
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card>
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Roll No.</TableCell>
                        <TableCell>Student Name</TableCell>
                        <TableCell>Attendance Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.admission_number}</TableCell>
                          <TableCell>
                            {student.first_name} {student.last_name}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={attendanceData[student.id!] || 'Not Marked'}
                              color={getStatusColor(attendanceData[student.id!]) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant={attendanceData[student.id!] === 'Present' ? 'contained' : 'outlined'}
                                color="success"
                                onClick={() => handleAttendanceChange(student.id!, 'Present')}
                              >
                                Present
                              </Button>
                              <Button
                                size="small"
                                variant={attendanceData[student.id!] === 'Absent' ? 'contained' : 'outlined'}
                                color="error"
                                onClick={() => handleAttendanceChange(student.id!, 'Absent')}
                              >
                                Absent
                              </Button>
                              <Button
                                size="small"
                                variant={attendanceData[student.id!] === 'Late' ? 'contained' : 'outlined'}
                                color="warning"
                                onClick={() => handleAttendanceChange(student.id!, 'Late')}
                              >
                                Late
                              </Button>
                              <Button
                                size="small"
                                variant={attendanceData[student.id!] === 'Excused' ? 'contained' : 'outlined'}
                                color="info"
                                onClick={() => handleAttendanceChange(student.id!, 'Excused')}
                              >
                                Excused
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Attendance Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Advanced reporting features coming soon! This will include:
            </Typography>
            <ul>
              <li>Monthly attendance reports</li>
              <li>Student-wise attendance statistics</li>
              <li>Class-wise attendance analysis</li>
              <li>Export attendance data</li>
              <li>Parent notifications for absences</li>
            </ul>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};
