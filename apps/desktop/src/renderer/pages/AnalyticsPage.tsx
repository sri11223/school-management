import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  AccountBalance as AccountBalanceIcon,
  EventNote as EventNoteIcon,
  PersonAdd as PersonAddIcon,
  MonetizationOn as MonetizationOnIcon,
} from '@mui/icons-material';
import { Student, Class } from '../types';
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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface AnalyticsData {
  totalStudents: number;
  totalClasses: number;
  attendanceRate: number;
  feeCollectionRate: number;
  monthlyAdmissions: number;
  monthlyRevenue: number;
  classDistribution: { className: string; studentCount: number }[];
  attendanceTrend: { month: string; rate: number }[];
  performanceMetrics: { subject: string; averageScore: number }[];
}

export const AnalyticsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalStudents: 0,
    totalClasses: 0,
    attendanceRate: 0,
    feeCollectionRate: 0,
    monthlyAdmissions: 0,
    monthlyRevenue: 0,
    classDistribution: [],
    attendanceTrend: [],
    performanceMetrics: [],
  });

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch basic data
      const [studentsRes, classesRes] = await Promise.all([
        apiClient.get('/students') as Promise<{ data: Student[] }>,
        apiClient.get('/classes') as Promise<{ data: Class[] }>,
      ]);

      // Calculate analytics
      const totalStudents = studentsRes.data.length;
      const totalClasses = classesRes.data.length;
      
      // Mock data for demonstration
      const mockAnalytics: AnalyticsData = {
        totalStudents,
        totalClasses,
        attendanceRate: 85.5,
        feeCollectionRate: 78.2,
        monthlyAdmissions: 25,
        monthlyRevenue: 125000,
        classDistribution: classesRes.data.map(cls => ({
          className: cls.name,
          studentCount: Math.floor(Math.random() * 50) + 20,
        })),
        attendanceTrend: [
          { month: 'Jan', rate: 82 },
          { month: 'Feb', rate: 85 },
          { month: 'Mar', rate: 88 },
          { month: 'Apr', rate: 84 },
          { month: 'May', rate: 86 },
          { month: 'Jun', rate: 89 },
        ],
        performanceMetrics: [
          { subject: 'Mathematics', averageScore: 78 },
          { subject: 'English', averageScore: 82 },
          { subject: 'Science', averageScore: 75 },
          { subject: 'Social Studies', averageScore: 80 },
          { subject: 'Hindi', averageScore: 85 },
        ],
      };

      setAnalyticsData(mockAnalytics);
    } catch (err) {
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData, selectedPeriod]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const MetricCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color, mr: 1 }}>
            {icon}
          </Box>
          <Typography variant="h6">{title}</Typography>
        </Box>
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Analytics & Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive insights into school performance and operations
          </Typography>
        </div>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            label="Period"
          >
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="quarterly">Quarterly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Key Metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Total Students"
                value={analyticsData.totalStudents}
                icon={<PeopleIcon />}
                color="primary.main"
                subtitle="Active enrollments"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Total Classes"
                value={analyticsData.totalClasses}
                icon={<SchoolIcon />}
                color="info.main"
                subtitle="Active classes"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Attendance Rate"
                value={`${analyticsData.attendanceRate}%`}
                icon={<EventNoteIcon />}
                color="success.main"
                subtitle="This month"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Fee Collection"
                value={`${analyticsData.feeCollectionRate}%`}
                icon={<MonetizationOnIcon />}
                color="warning.main"
                subtitle="This month"
              />
            </Grid>
          </Grid>

          {/* Secondary Metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <MetricCard
                title="Monthly Admissions"
                value={analyticsData.monthlyAdmissions}
                icon={<PersonAddIcon />}
                color="success.main"
                subtitle="New students this month"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <MetricCard
                title="Monthly Revenue"
                value={`₹${analyticsData.monthlyRevenue.toLocaleString()}`}
                icon={<AccountBalanceIcon />}
                color="primary.main"
                subtitle="Fee collections this month"
              />
            </Grid>
          </Grid>

          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Overview" />
                <Tab label="Academic Performance" />
                <Tab label="Attendance Analytics" />
                <Tab label="Financial Reports" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                {/* Class Distribution */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Class Distribution
                    </Typography>
                    {analyticsData.classDistribution.map((item, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{item.className}</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {item.studentCount} students
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(item.studentCount / 50) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    ))}
                  </Paper>
                </Grid>

                {/* Attendance Trend */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Attendance Trend
                    </Typography>
                    {analyticsData.attendanceTrend.map((item, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{item.month}</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {item.rate}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={item.rate}
                          sx={{ height: 8, borderRadius: 4 }}
                          color={item.rate >= 85 ? 'success' : item.rate >= 70 ? 'warning' : 'error'}
                        />
                      </Box>
                    ))}
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Subject-wise Performance
                    </Typography>
                    <Grid container spacing={2}>
                      {analyticsData.performanceMetrics.map((metric, index) => (
                        <Grid item xs={12} md={4} key={index}>
                          <Card variant="outlined">
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="subtitle1">{metric.subject}</Typography>
                              </Box>
                              <Typography variant="h4" fontWeight="bold">
                                {metric.averageScore}%
                              </Typography>
                              <Chip
                                label={
                                  metric.averageScore >= 85 ? 'Excellent' :
                                  metric.averageScore >= 70 ? 'Good' : 'Needs Improvement'
                                }
                                color={getPerformanceColor(metric.averageScore)}
                                size="small"
                                sx={{ mt: 1 }}
                              />
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <EventNoteIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Attendance Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Detailed attendance patterns and trends analysis
                </Typography>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Financial Reports
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Comprehensive financial analysis and revenue tracking
                </Typography>
              </Box>
            </TabPanel>
          </Card>
        </>
      )}
    </Box>
  );
};
