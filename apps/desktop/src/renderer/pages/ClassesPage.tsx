import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Class, Section } from '../types';
import { apiClient } from '../services/api';

interface ClassWithSections extends Class {
  sections: Section[];
  student_count: number;
}

export const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassWithSections[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get('/classes');
        const classesData = (response as any).data || [];
        
        // Fetch sections for each class
        const classesWithSections = await Promise.all(
          classesData.map(async (classItem: Class) => {
            try {
              const sectionsResponse = await apiClient.get(`/sections?class_id=${classItem.id}`);
              const sections = (sectionsResponse as any).data || [];
              
              // Get student count for this class
              const studentsResponse = await apiClient.get(`/students?class_id=${classItem.id}`);
              const students = (studentsResponse as any).data || [];
              
              return {
                ...classItem,
                sections,
                student_count: students.length,
              };
            } catch (err) {
              console.error(`Error fetching data for class ${classItem.id}:`, err);
              return {
                ...classItem,
                sections: [],
                student_count: 0,
              };
            }
          })
        );
        
        setClasses(classesWithSections);
      } catch (err) {
        setError('Failed to fetch classes');
        console.error('Error fetching classes:', err);
        
        // Set mock data for development
        setClasses([
          {
            id: 1,
            name: 'Class 1',
            numeric_level: 1,
            academic_year_id: 1,
            sections: [
              { id: 1, name: 'Section A', section_name: 'A', class_id: 1 },
              { id: 2, name: 'Section B', section_name: 'B', class_id: 1 },
            ],
            student_count: 45,
          },
          {
            id: 2,
            name: 'Class 2',
            numeric_level: 2,
            academic_year_id: 1,
            sections: [
              { id: 3, name: 'Section A', section_name: 'A', class_id: 2 },
              { id: 4, name: 'Section B', section_name: 'B', class_id: 2 },
            ],
            student_count: 42,
          },
          {
            id: 3,
            name: 'Class 3',
            numeric_level: 3,
            academic_year_id: 1,
            sections: [
              { id: 5, name: 'Section A', section_name: 'A', class_id: 3 },
            ],
            student_count: 38,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const handleClassClick = (classId: number) => {
    navigate(`/classes/${classId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Classes
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Manage your school classes, sections, and students
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Using demo data. Backend connection: {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {classes.map((classItem) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={classItem.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <SchoolIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="h2">
                      {classItem.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Level {classItem.numeric_level}
                    </Typography>
                  </Box>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Sections ({classItem.sections.length})
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {classItem.sections.map((section) => (
                      <Chip
                        key={section.id}
                        label={section.section_name}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" mb={1}>
                  <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {classItem.student_count} students
                  </Typography>
                </Box>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleClassClick(classItem.id!)}
                  fullWidth
                >
                  View Class
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {classes.length === 0 && !loading && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="40vh"
        >
          <Avatar sx={{ bgcolor: 'grey.100', width: 64, height: 64, mb: 2 }}>
            <SchoolIcon sx={{ fontSize: 32, color: 'grey.400' }} />
          </Avatar>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No classes found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Classes will appear here once they are created
          </Typography>
        </Box>
      )}
    </Box>
  );
};
