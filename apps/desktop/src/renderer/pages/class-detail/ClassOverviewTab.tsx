import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import {
  Groups as GroupsIcon,
  Assignment as AssignmentIcon,
  EventNote as EventNoteIcon,
  // TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Class, Section } from '../../types';
import { apiClient } from '../../services/api';

interface ClassOverviewTabProps {
  classId: string;
  classData: Class | null;
  sections: Section[];
}

interface ClassStats {
  totalStudents: number;
  totalSections: number;
  upcomingExams: number;
  averageAttendance: number;
  averagePerformance: number;
  sectionStats: Array<{
    id: string;
    name: string;
    studentCount: number;
    capacity: number;
    teacher?: string;
  }>;
}

export const ClassOverviewTab: React.FC<ClassOverviewTabProps> = ({
  classId,
  classData,
  sections,
}) => {
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClassStats();
  }, [classId]);

  const fetchClassStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch class statistics from the API
      const [performanceResponse, studentsResponse] = await Promise.all([
        apiClient.get(`/classes/${classId}/performance`),
        apiClient.get(`/classes/${classId}/students`)
      ]);

      const performanceData = (performanceResponse as any).data;
      const studentsData = (studentsResponse as any).data;

      // Process section statistics
      const sectionStats = sections.map(section => ({
        id: section.id?.toString() || '',
        name: section.section_name,
        studentCount: studentsData.students?.filter((student: any) => 
          student.section_id === section.id
        ).length || 0,
        capacity: section.max_students || 50,
        teacher: 'Not Assigned' // Will be updated when teacher data is available
      }));

      setStats({
        totalStudents: studentsData.pagination?.total || 0,
        totalSections: sections.length,
        upcomingExams: 3, // Mock data - replace with real API call
        averageAttendance: 85.5, // Mock data - replace with real API call
        averagePerformance: performanceData?.average_marks || 0,
        sectionStats
      });
    } catch (err) {
      setError('Failed to fetch class statistics');
      console.error('Error fetching class stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats || !classData) {
    return (
      <Alert severity="warning">No data available</Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Class Overview
      </Typography>
      
      {/* Quick Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <GroupsIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Students
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalStudents}
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
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <SchoolIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Sections
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalSections}
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
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <AssignmentIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Upcoming Exams
                  </Typography>
                  <Typography variant="h4">
                    {stats.upcomingExams}
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
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <EventNoteIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Avg. Attendance
                  </Typography>
                  <Typography variant="h4">
                    {stats.averageAttendance.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Class Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Class Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Class Name
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {classData.name || `Standard ${classData.numeric_level}`}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Standard Level
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {classData.numeric_level}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Academic Year
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {classData.academic_year}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Capacity
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {stats.sectionStats.reduce((sum, section) => sum + section.capacity, 0)} students
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Current Enrollment
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {stats.totalStudents} students ({((stats.totalStudents / stats.sectionStats.reduce((sum, section) => sum + section.capacity, 0)) * 100).toFixed(1)}% filled)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Section Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sections Overview
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                {stats.sectionStats.map((section) => (
                  <ListItem key={section.id} divider>
                    <ListItemIcon>
                      <PersonIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2">
                            {section.name}
                          </Typography>
                          <Chip
                            label={`${section.studentCount}/${section.capacity}`}
                            size="small"
                            color={section.studentCount >= section.capacity ? 'error' : 'default'}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Teacher: {section.teacher}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
