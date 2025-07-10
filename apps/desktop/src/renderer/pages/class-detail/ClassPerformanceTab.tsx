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
  Chip,
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
  IconButton,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  School as SchoolIcon,
  Grade as GradeIcon,
  Assessment as AssessmentIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Section, Class, Student, ExamResult, AttendanceStats } from '../../types';
import { examAPI, attendanceAPI, classAPI } from '../../services/api';

interface ClassPerformanceTabProps {
  classId: string;
  classData: Class;
  sections: Section[];
}

interface PerformanceData {
  student_id: number;
  student_name: string;
  admission_number: string;
  total_exams: number;
  average_marks: number;
  average_percentage: number;
  grade: string;
  attendance_percentage: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

interface SubjectPerformance {
  subject_id: number;
  subject_name: string;
  average_marks: number;
  total_exams: number;
  pass_percentage: number;
}

interface ExamTrend {
  exam_date: string;
  exam_name: string;
  average_percentage: number;
  pass_count: number;
  total_students: number;
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
      id={`performance-tabpanel-${index}`}
      aria-labelledby={`performance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const ClassPerformanceTab: React.FC<ClassPerformanceTabProps> = ({ classId, classData, sections }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [examTrends, setExamTrends] = useState<ExamTrend[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Fetch all necessary data
  const fetchPerformanceData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch students
      const studentsResponse = await classAPI.getStudents(classId);
      const studentsData = (studentsResponse as any).data || [];
      setStudents(studentsData);
      
      // Fetch exams for the class
      const examsResponse = await examAPI.getAll({ class_id: parseInt(classId), limit: 100 });
      const examsData = (examsResponse as any).data || [];
      
      // Fetch attendance stats
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      const endDate = new Date();
      
      const attendanceResponse = await attendanceAPI.getAttendanceReport(parseInt(classId), {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      const attendanceData = (attendanceResponse as any).report || [];
      setAttendanceStats(attendanceData);
      
      // Calculate performance data for each student
      const performancePromises = studentsData.map(async (student: Student) => {
        try {
          let totalMarks = 0;
          let totalExams = 0;
          let examResults: ExamResult[] = [];
          
          // Get exam results for each exam
          for (const exam of examsData) {
            try {
              const resultsResponse = await examAPI.getResults(exam.id!);
              const results = (resultsResponse as any).data || [];
              const studentResult = results.find((r: ExamResult) => r.student_id === student.id);
              
              if (studentResult) {
                examResults.push(studentResult);
                totalMarks += studentResult.marks_obtained;
                totalExams++;
              }
            } catch (err) {
              console.error(`Error fetching results for exam ${exam.id}:`, err);
            }
          }
          
          const averageMarks = totalExams > 0 ? totalMarks / totalExams : 0;
          const averagePercentage = totalExams > 0 ? examResults.reduce((sum, r) => sum + r.percentage, 0) / totalExams : 0;
          
          // Get attendance percentage for this student
          const studentAttendance = attendanceData.find((a: AttendanceStats) => a.student_id === student.id);
          const attendancePercentage = studentAttendance ? studentAttendance.attendance_percentage : 0;
          
          // Calculate grade based on average percentage
          let grade = 'F';
          if (averagePercentage >= 90) grade = 'A+';
          else if (averagePercentage >= 80) grade = 'A';
          else if (averagePercentage >= 70) grade = 'B+';
          else if (averagePercentage >= 60) grade = 'B';
          else if (averagePercentage >= 50) grade = 'C';
          else if (averagePercentage >= 40) grade = 'D';
          
          // Determine trend (simplified - could be more sophisticated)
          const trend = averagePercentage >= 75 ? 'up' : averagePercentage >= 50 ? 'stable' : 'down';
          
          return {
            student_id: student.id!,
            student_name: `${student.first_name} ${student.last_name}`,
            admission_number: student.admission_number,
            total_exams: totalExams,
            average_marks: averageMarks,
            average_percentage: averagePercentage,
            grade,
            attendance_percentage: attendancePercentage,
            rank: 0, // Will be calculated after sorting
            trend
          };
        } catch (err) {
          console.error(`Error calculating performance for student ${student.id}:`, err);
          return null;
        }
      });
      
      const performanceResults = await Promise.all(performancePromises);
      const validPerformance = performanceResults.filter((p: any) => p !== null) as PerformanceData[];
      
      // Sort by average percentage and assign ranks
      validPerformance.sort((a, b) => b.average_percentage - a.average_percentage);
      validPerformance.forEach((p, index) => {
        p.rank = index + 1;
      });
      
      setPerformanceData(validPerformance);
      
      // Calculate subject performance (simplified - in real scenario, you'd have subject mappings)
      const subjectStats: { [key: string]: SubjectPerformance } = {};
      
      for (const exam of examsData) {
        try {
          const resultsResponse = await examAPI.getResults(exam.id!);
          const results = (resultsResponse as any).data || [];
          
          if (results.length > 0) {
            const subjectKey = exam.subject_name || `Subject ${exam.subject_id}`;
            
            if (!subjectStats[subjectKey]) {
              subjectStats[subjectKey] = {
                subject_id: exam.subject_id,
                subject_name: subjectKey,
                average_marks: 0,
                total_exams: 0,
                pass_percentage: 0
              };
            }
            
            const avgMarks = results.reduce((sum: number, r: ExamResult) => sum + r.marks_obtained, 0) / results.length;
            const passCount = results.filter((r: ExamResult) => r.percentage >= 50).length;
            
            subjectStats[subjectKey].average_marks = 
              (subjectStats[subjectKey].average_marks * subjectStats[subjectKey].total_exams + avgMarks) / 
              (subjectStats[subjectKey].total_exams + 1);
            subjectStats[subjectKey].total_exams++;
            subjectStats[subjectKey].pass_percentage = 
              (subjectStats[subjectKey].pass_percentage + (passCount / results.length * 100)) / 2;
          }
        } catch (err) {
          console.error(`Error calculating subject performance for exam ${exam.id}:`, err);
        }
      }
      
      setSubjectPerformance(Object.values(subjectStats));
      
      // Calculate exam trends
      const examTrendData: ExamTrend[] = [];
      
      for (const exam of examsData.slice(-10)) { // Last 10 exams
        try {
          const resultsResponse = await examAPI.getResults(exam.id!);
          const results = (resultsResponse as any).data || [];
          
          if (results.length > 0) {
            const avgPercentage = results.reduce((sum: number, r: ExamResult) => sum + r.percentage, 0) / results.length;
            const passCount = results.filter((r: ExamResult) => r.percentage >= 50).length;
            
            examTrendData.push({
              exam_date: exam.exam_date,
              exam_name: exam.name,
              average_percentage: avgPercentage,
              pass_count: passCount,
              total_students: results.length
            });
          }
        } catch (err) {
          console.error(`Error calculating trend for exam ${exam.id}:`, err);
        }
      }
      
      examTrendData.sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
      setExamTrends(examTrendData);
      
    } catch (err) {
      setError('Failed to fetch performance data');
      console.error('Error fetching performance data:', err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'success';
      case 'B+':
      case 'B': return 'primary';
      case 'C': return 'warning';
      case 'D': return 'error';
      case 'F': return 'error';
      default: return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUpIcon color="success" />;
      case 'down': return <TrendingDownIcon color="error" />;
      default: return <AnalyticsIcon color="primary" />;
    }
  };

  // Calculate overall class statistics
  const classStats = {
    totalStudents: students.length,
    averagePerformance: performanceData.length > 0 ? 
      performanceData.reduce((sum, p) => sum + p.average_percentage, 0) / performanceData.length : 0,
    averageAttendance: attendanceStats.length > 0 ? 
      attendanceStats.reduce((sum, a) => sum + a.attendance_percentage, 0) / attendanceStats.length : 0,
    topPerformers: performanceData.filter(p => p.average_percentage >= 80).length,
    needsAttention: performanceData.filter(p => p.average_percentage < 50).length,
  };

  if (loading && performanceData.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <IconButton color="inherit" size="small" onClick={fetchPerformanceData}>
            <RefreshIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      )}

      {/* Class Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SchoolIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {classStats.totalStudents}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Total Students
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
                    {classStats.averagePerformance.toFixed(1)}%
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Average Performance
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
                <StarIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {classStats.topPerformers}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Top Performers
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
                    {classStats.needsAttention}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Need Attention
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
          <Tab label="Student Performance" icon={<SchoolIcon />} />
          <Tab label="Subject Analysis" icon={<AssessmentIcon />} />
          <Tab label="Exam Trends" icon={<AnalyticsIcon />} />
        </Tabs>
      </Card>

      {/* Student Performance Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Student Performance Ranking</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Student</TableCell>
                        <TableCell>Admission No.</TableCell>
                        <TableCell>Exams</TableCell>
                        <TableCell>Avg. %</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell>Attendance</TableCell>
                        <TableCell>Trend</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performanceData.map((student) => (
                        <TableRow key={student.student_id} hover>
                          <TableCell>
                            <Chip 
                              label={student.rank} 
                              color={student.rank <= 3 ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {student.student_name}
                            </Typography>
                          </TableCell>
                          <TableCell>{student.admission_number}</TableCell>
                          <TableCell>{student.total_exams}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={student.average_percentage} 
                                  color={student.average_percentage >= 75 ? 'success' : 
                                         student.average_percentage >= 50 ? 'primary' : 'error'}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {student.average_percentage.toFixed(1)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={student.grade}
                              color={getGradeColor(student.grade) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {student.attendance_percentage.toFixed(1)}%
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getTrendIcon(student.trend)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Grade Distribution</Typography>
                {performanceData.length > 0 && (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'A+/A', value: performanceData.filter(p => ['A+', 'A'].includes(p.grade)).length },
                          { name: 'B+/B', value: performanceData.filter(p => ['B+', 'B'].includes(p.grade)).length },
                          { name: 'C', value: performanceData.filter(p => p.grade === 'C').length },
                          { name: 'D', value: performanceData.filter(p => p.grade === 'D').length },
                          { name: 'F', value: performanceData.filter(p => p.grade === 'F').length },
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }: any) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Top Performers</Typography>
                <List>
                  {performanceData.slice(0, 5).map((student, index) => (
                    <React.Fragment key={student.student_id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: index < 3 ? 'primary.main' : 'grey.500' }}>
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={student.student_name}
                          secondary={`${student.average_percentage.toFixed(1)}% - Grade ${student.grade}`}
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

      {/* Subject Analysis Tab */}
      <TabPanel value={activeTab} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Subject Performance Analysis</Typography>
            
            {subjectPerformance.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subjectPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject_name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="average_marks" fill="#8884d8" name="Average Marks" />
                    <Bar dataKey="pass_percentage" fill="#82ca9d" name="Pass Percentage" />
                  </BarChart>
                </ResponsiveContainer>
                
                <TableContainer sx={{ mt: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell>Total Exams</TableCell>
                        <TableCell>Average Marks</TableCell>
                        <TableCell>Pass Percentage</TableCell>
                        <TableCell>Performance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subjectPerformance.map((subject) => (
                        <TableRow key={subject.subject_id}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {subject.subject_name}
                            </Typography>
                          </TableCell>
                          <TableCell>{subject.total_exams}</TableCell>
                          <TableCell>{subject.average_marks.toFixed(1)}</TableCell>
                          <TableCell>{subject.pass_percentage.toFixed(1)}%</TableCell>
                          <TableCell>
                            <Chip
                              label={subject.pass_percentage >= 75 ? 'Excellent' : 
                                     subject.pass_percentage >= 60 ? 'Good' : 
                                     subject.pass_percentage >= 40 ? 'Average' : 'Needs Improvement'}
                              color={subject.pass_percentage >= 75 ? 'success' : 
                                     subject.pass_percentage >= 60 ? 'primary' : 
                                     subject.pass_percentage >= 40 ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Typography color="text.secondary" align="center">
                No subject performance data available
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Exam Trends Tab */}
      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Exam Performance Trends</Typography>
            
            {examTrends.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={examTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="exam_date" 
                      tickFormatter={(value: any) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <RechartsTooltip 
                      labelFormatter={(value: any) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="average_percentage" 
                      stroke="#8884d8" 
                      name="Average Percentage"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
                
                <TableContainer sx={{ mt: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Exam Date</TableCell>
                        <TableCell>Exam Name</TableCell>
                        <TableCell>Average %</TableCell>
                        <TableCell>Pass Count</TableCell>
                        <TableCell>Total Students</TableCell>
                        <TableCell>Pass Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {examTrends.map((trend, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(trend.exam_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {trend.exam_name}
                            </Typography>
                          </TableCell>
                          <TableCell>{trend.average_percentage.toFixed(1)}%</TableCell>
                          <TableCell>{trend.pass_count}</TableCell>
                          <TableCell>{trend.total_students}</TableCell>
                          <TableCell>
                            <Chip
                              label={`${((trend.pass_count / trend.total_students) * 100).toFixed(1)}%`}
                              color={(trend.pass_count / trend.total_students) >= 0.75 ? 'success' : 
                                     (trend.pass_count / trend.total_students) >= 0.5 ? 'primary' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Typography color="text.secondary" align="center">
                No exam trend data available
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};
