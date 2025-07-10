import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  EventNote as AttendanceIcon,
  Assignment as ExamIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { classAPI } from '../services/api';
import { DashboardAnalytics } from '../types';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch classes data
      try {
        const classesResponse = await classAPI.getAll();
        console.log('Overview - Classes response:', classesResponse);
        
        if (classesResponse && Array.isArray(classesResponse.data)) {
          setClasses(classesResponse.data);
        } else if (classesResponse && Array.isArray(classesResponse)) {
          setClasses(classesResponse);
        } else {
          setClasses([]);
        }
      } catch (classError) {
        console.error('Error fetching classes for overview:', classError);
        setClasses([]);
      }

      // Set analytics data
      setAnalytics({
        totalStudents: 1250,
        totalTeachers: 85,
        totalClasses: 42,
        attendanceToday: 92,
        monthlyAttendance: [
          { month: 'January', percentage: 88 },
          { month: 'February', percentage: 92 },
          { month: 'March', percentage: 85 },
          { month: 'April', percentage: 94 },
          { month: 'May', percentage: 89 },
        ],
        recentActivities: [
          {
            type: 'Student',
            message: 'New student admission: Priya Sharma (Class 8-A)',
            timestamp: new Date().toISOString(),
          },
          {
            type: 'Attendance',
            message: 'Daily attendance marked for Class 10-B',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            type: 'Exam',
            message: 'Mid-term exam results published for Class 9',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
          },
        ],
      });

    } catch (err) {
      console.error('Error fetching overview data:', err);
      setError('Failed to fetch overview data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchOverviewData}>
          Retry
        </Button>
      </Box>
    );
  }

  const totalStudentsFromClasses = classes.reduce((sum, cls) => sum + (cls.number_of_students || 0), 0);
  const totalSections = classes.reduce((sum, cls) => sum + (cls.number_of_sections || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        School Overview
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Here's what's happening at your school today
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Students</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {totalStudentsFromClasses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Across {classes.length} classes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ClassIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Classes</Typography>
              </Box>
              <Typography variant="h3" color="secondary">
                {classes.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalSections} sections total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttendanceIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Attendance</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {analytics?.attendanceToday}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today's average
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SchoolIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Teachers</Typography>
              </Box>
              <Typography variant="h3" color="warning.main">
                {analytics?.totalTeachers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active staff members
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ClassIcon />}
                    onClick={() => navigate('/classes')}
                  >
                    Manage Classes
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AttendanceIcon />}
                    onClick={() => navigate('/attendance')}
                  >
                    Take Attendance
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ExamIcon />}
                    onClick={() => navigate('/exams')}
                  >
                    View Exams
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PeopleIcon />}
                    onClick={() => navigate('/students')}
                  >
                    Student Records
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <List dense>
                {analytics?.recentActivities.map((activity, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <NotificationIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.message}
                      secondary={new Date(activity.timestamp).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Classes Summary */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Classes Overview
          </Typography>
          <Grid container spacing={2}>
            {classes.slice(0, 6).map((cls) => (
              <Grid item xs={12} sm={6} md={4} key={cls.id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 2 }
                  }}
                  onClick={() => navigate(`/classes/${cls.id}`)}
                >
                  <CardContent>
                    <Typography variant="h6">{cls.name}</Typography>
                    <Typography color="text.secondary" gutterBottom>
                      Level {cls.numeric_level}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Chip 
                        label={`${cls.number_of_students || 0} Students`} 
                        size="small" 
                        color="primary" 
                      />
                      <Chip 
                        label={`${cls.number_of_sections || 0} Sections`} 
                        size="small" 
                        color="secondary" 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {classes.length > 6 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="text" onClick={() => navigate('/classes')}>
                View All Classes
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
