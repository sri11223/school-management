import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  EventNote as EventNoteIcon,
  School as SchoolIcon,
  Star as StarIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Section, Class, Student } from '../../types';
import { apiClient } from '../../services/api';

interface ClassAnalyticsTabProps {
  classId: string;
  classData: Class;
  sections: Section[];
}

interface StudentPerformance {
  student: Student;
  totalMarks: number;
  averageMarks: number;
  attendancePercentage: number;
  examCount: number;
  grade: string;
  rank: number;
}

interface ClassAnalytics {
  overallPerformance: {
    averageMarks: number;
    attendancePercentage: number;
    totalExams: number;
    passRate: number;
    topPerformers: StudentPerformance[];
    needsAttention: StudentPerformance[];
  };
  subjectWiseAnalysis: {
    subject: string;
    averageMarks: number;
    totalExams: number;
    passRate: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
  }[];
  attendanceAnalysis: {
    date: string;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    percentage: number;
  }[];
  monthlyTrends: {
    month: string;
    averageMarks: number;
    attendancePercentage: number;
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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ClassAnalyticsTab: React.FC<ClassAnalyticsTabProps> = ({ classId, classData, sections }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentPerformances, setStudentPerformances] = useState<StudentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | number>('all');
  const [selectedStudent, setSelectedStudent] = useState<string | number>('all');
  const [viewMode, setViewMode] = useState<'overall' | 'individual'>('overall');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch students
        const studentsResponse = await apiClient.get(`/students?class_id=${classId}`) as { data: Student[] };
        setStudents(studentsResponse.data);
        
        // Fetch analytics data (mock for now)
        const analyticsData = await generateMockAnalytics(studentsResponse.data);
        setAnalytics(analyticsData);
        
        // Generate student performances
        const performances = await generateStudentPerformances(studentsResponse.data);
        setStudentPerformances(performances);
      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [classId]);

  // Mock analytics data generation (replace with actual API calls)
  const generateMockAnalytics = async (students: Student[]): Promise<ClassAnalytics> => {
    // This would be replaced with actual API calls to get analytics data
    return {
      overallPerformance: {
        averageMarks: 78.5,
        attendancePercentage: 85.2,
        totalExams: 12,
        passRate: 92.3,
        topPerformers: [],
        needsAttention: [],
      },
      subjectWiseAnalysis: [
        { subject: 'Mathematics', averageMarks: 82.1, totalExams: 3, passRate: 95.0, difficulty: 'Medium' },
        { subject: 'Science', averageMarks: 77.8, totalExams: 3, passRate: 88.5, difficulty: 'Hard' },
        { subject: 'English', averageMarks: 79.2, totalExams: 3, passRate: 91.2, difficulty: 'Easy' },
        { subject: 'History', averageMarks: 75.5, totalExams: 3, passRate: 89.7, difficulty: 'Medium' },
      ],
      attendanceAnalysis: [
        { date: '2024-01-15', presentCount: 45, absentCount: 5, lateCount: 2, percentage: 86.5 },
        { date: '2024-01-16', presentCount: 48, absentCount: 3, lateCount: 1, percentage: 92.3 },
        { date: '2024-01-17', presentCount: 47, absentCount: 4, lateCount: 1, percentage: 90.4 },
      ],
      monthlyTrends: [
        { month: 'Jan', averageMarks: 76.2, attendancePercentage: 83.1 },
        { month: 'Feb', averageMarks: 78.8, attendancePercentage: 85.7 },
        { month: 'Mar', averageMarks: 81.2, attendancePercentage: 87.3 },
      ],
    };
  };

  const generateStudentPerformances = async (students: Student[]): Promise<StudentPerformance[]> => {
    // Mock student performance data
    return students.map((student, index) => ({
      student,
      totalMarks: Math.floor(Math.random() * 500) + 400,
      averageMarks: Math.floor(Math.random() * 40) + 60,
      attendancePercentage: Math.floor(Math.random() * 30) + 70,
      examCount: Math.floor(Math.random() * 5) + 8,
      grade: ['A+', 'A', 'B+', 'B', 'C+'][Math.floor(Math.random() * 5)],
      rank: index + 1,
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const filteredStudents = students.filter(student => {
    const matchesSection = selectedSection === 'all' || student.section_id === selectedSection;
    return matchesSection;
  });

  const filteredPerformances = studentPerformances.filter(performance => {
    const matchesSection = selectedSection === 'all' || performance.student.section_id === selectedSection;
    return matchesSection;
  });

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'success';
      case 'A': return 'info';
      case 'B+': return 'primary';
      case 'B': return 'warning';
      case 'C+': return 'secondary';
      default: return 'error';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Hard': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Failed to load analytics data
      </Alert>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* View Mode Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>View Mode</InputLabel>
              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'overall' | 'individual')}
                label="View Mode"
              >
                <MenuItem value="overall">Overall Analytics</MenuItem>
                <MenuItem value="individual">Individual Student</MenuItem>
              </Select>
            </FormControl>
            
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

            {viewMode === 'individual' && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Student</InputLabel>
                <Select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  label="Student"
                >
                  <MenuItem value="all">Select Student</MenuItem>
                  {filteredStudents.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Overall Analytics View */}
      {viewMode === 'overall' && (
        <Box>
          {/* Sub-navigation tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
              <Tab
                label="Performance Overview"
                icon={<TrendingUpIcon />}
                iconPosition="start"
                id="analytics-tab-0"
                aria-controls="analytics-tabpanel-0"
              />
              <Tab
                label="Subject Analysis"
                icon={<AssessmentIcon />}
                iconPosition="start"
                id="analytics-tab-1"
                aria-controls="analytics-tabpanel-1"
              />
              <Tab
                label="Attendance Analysis"
                icon={<EventNoteIcon />}
                iconPosition="start"
                id="analytics-tab-2"
                aria-controls="analytics-tabpanel-2"
              />
              <Tab
                label="Student Rankings"
                icon={<StarIcon />}
                iconPosition="start"
                id="analytics-tab-3"
                aria-controls="analytics-tabpanel-3"
              />
            </Tabs>
          </Box>

          {/* Performance Overview Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Average Marks
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {analytics.overallPerformance.averageMarks}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={analytics.overallPerformance.averageMarks}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="success.main" gutterBottom>
                      Attendance Rate
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {analytics.overallPerformance.attendancePercentage}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={analytics.overallPerformance.attendancePercentage}
                      color="success"
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="info.main" gutterBottom>
                      Total Exams
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {analytics.overallPerformance.totalExams}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="secondary.main" gutterBottom>
                      Pass Rate
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {analytics.overallPerformance.passRate}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={analytics.overallPerformance.passRate}
                      color="secondary"
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Subject Analysis Tab */}
          <TabPanel value={activeTab} index={1}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Average Marks</TableCell>
                    <TableCell>Total Exams</TableCell>
                    <TableCell>Pass Rate</TableCell>
                    <TableCell>Difficulty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.subjectWiseAnalysis.map((subject) => (
                    <TableRow key={subject.subject}>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {subject.subject}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {subject.averageMarks}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={subject.averageMarks}
                            sx={{ width: 100 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{subject.totalExams}</TableCell>
                      <TableCell>{subject.passRate}%</TableCell>
                      <TableCell>
                        <Chip
                          label={subject.difficulty}
                          color={getDifficultyColor(subject.difficulty)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Attendance Analysis Tab */}
          <TabPanel value={activeTab} index={2}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Present</TableCell>
                    <TableCell>Absent</TableCell>
                    <TableCell>Late</TableCell>
                    <TableCell>Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.attendanceAnalysis.map((record) => (
                    <TableRow key={record.date}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip label={record.presentCount} color="success" size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={record.absentCount} color="error" size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={record.lateCount} color="warning" size="small" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {record.percentage}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={record.percentage}
                            sx={{ width: 100 }}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Student Rankings Tab */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StarIcon color="success" />
                      Top Performers
                    </Typography>
                    <List>
                      {filteredPerformances.slice(0, 5).map((performance, index) => (
                        <React.Fragment key={performance.student.id}>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'success.main' }}>
                                {index + 1}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={`${performance.student.first_name} ${performance.student.last_name}`}
                              secondary={
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  <Chip
                                    label={`${performance.averageMarks}%`}
                                    size="small"
                                    color="primary"
                                  />
                                  <Chip
                                    label={performance.grade}
                                    size="small"
                                    color={getGradeColor(performance.grade)}
                                  />
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < 4 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="warning" />
                      Needs Attention
                    </Typography>
                    <List>
                      {filteredPerformances
                        .filter(p => p.averageMarks < 70 || p.attendancePercentage < 75)
                        .slice(0, 5)
                        .map((performance, index) => (
                        <React.Fragment key={performance.student.id}>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'warning.main' }}>
                                <WarningIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={`${performance.student.first_name} ${performance.student.last_name}`}
                              secondary={
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  <Chip
                                    label={`${performance.averageMarks}%`}
                                    size="small"
                                    color={performance.averageMarks < 70 ? 'error' : 'primary'}
                                  />
                                  <Chip
                                    label={`${performance.attendancePercentage}% att.`}
                                    size="small"
                                    color={performance.attendancePercentage < 75 ? 'error' : 'success'}
                                  />
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < 4 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      )}

      {/* Individual Student Analytics View */}
      {viewMode === 'individual' && selectedStudent !== 'all' && (
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Individual Student Analytics
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Detailed analytics for the selected student will be displayed here.
              </Typography>
              {/* TODO: Implement individual student analytics */}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Prompt to select student */}
      {viewMode === 'individual' && selectedStudent === 'all' && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Select a Student
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a student from the dropdown above to view their individual analytics.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
