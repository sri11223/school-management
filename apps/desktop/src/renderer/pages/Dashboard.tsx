import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  EventNote as AttendanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Payment as PaymentIcon,
  Quiz as QuizIcon,
} from '@mui/icons-material';
import { analyticsAPI } from '../services/api';
import { DashboardAnalytics } from '../types';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
          <Icon />
        </Avatar>
        <Box>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Box>
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          {trend.isPositive ? (
            <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
          ) : (
            <TrendingDownIcon sx={{ color: 'error.main', mr: 0.5 }} />
          )}
          <Typography
            variant="body2"
            color={trend.isPositive ? 'success.main' : 'error.main'}
          >
            {trend.value}% from last month
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

export const Dashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await analyticsAPI.getDashboard();
        setAnalytics(data as DashboardAnalytics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
        // Set mock data for development
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
            {
              type: 'Fee',
              message: 'Fee payment received from Rajesh Kumar',
              timestamp: new Date(Date.now() - 10800000).toISOString(),
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !analytics) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Welcome back! Here's what's happening at your school today.
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Using demo data. Backend connection: {error}
        </Alert>
      )}

      {analytics && (
        <Grid container spacing={3}>
          {/* Statistics Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Students"
              value={analytics.totalStudents}
              icon={PeopleIcon}
              color="primary"
              trend={{ value: 5.2, isPositive: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Teachers"
              value={analytics.totalTeachers}
              icon={SchoolIcon}
              color="secondary"
              trend={{ value: 2.1, isPositive: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Classes"
              value={analytics.totalClasses}
              icon={ClassIcon}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Attendance Today"
              value={analytics.attendanceToday}
              icon={AttendanceIcon}
              color="warning"
              trend={{ value: 1.8, isPositive: false }}
            />
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                        <AttendanceIcon />
                      </Avatar>
                      <Typography variant="body2">Mark Attendance</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 1 }}>
                        <PeopleIcon />
                      </Avatar>
                      <Typography variant="body2">Add Student</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}>
                      <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                        <QuizIcon />
                      </Avatar>
                      <Typography variant="body2">Create Exam</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}>
                      <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                        <PaymentIcon />
                      </Avatar>
                      <Typography variant="body2">Record Payment</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};