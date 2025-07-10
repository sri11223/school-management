import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  EventNote as EventNoteIcon,
  Analytics as AnalyticsIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { Class, Section } from '../types';
import { apiClient } from '../services/api';
import { ClassOverviewTab } from './class-detail/ClassOverviewTab';
import { ClassStudentsTab } from './class-detail/ClassStudentsTab';
import { ClassExamsTab } from './class-detail/ClassExamsTab';
import { ClassAttendanceTab } from './class-detail/ClassAttendanceTab';
import { ClassPerformanceTab } from './class-detail/ClassPerformanceTab';

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
      id={`class-tabpanel-${index}`}
      aria-labelledby={`class-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [classData, setClassData] = useState<Class | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Determine active tab from URL
  const getActiveTab = useCallback(() => {
    const path = location.pathname.split('/').pop();
    switch (path) {
      case 'students': return 1;
      case 'exams': return 2;
      case 'attendance': return 3;
      case 'performance': return 4;
      default: return 0; // Overview tab
    }
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState(getActiveTab());

  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [getActiveTab]);

  const fetchClassData = useCallback(async () => {
    if (!classId) {
      setError('Invalid class ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const classResponse = await apiClient.get(`/classes/${classId}?include_sections=true`);
      console.log('API Response:', classResponse); // Debug log
      setClassData(classResponse as Class);
      setSections((classResponse as any).sections || []);
    } catch (err) {
      setError('Failed to fetch class data');
      console.error('Error fetching class data:', err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Update URL based on tab
    const tabPaths = ['', 'students', 'exams', 'attendance', 'performance'];
    const newPath = `/classes/${classId}${tabPaths[newValue] ? `/${tabPaths[newValue]}` : ''}`;
    navigate(newPath);
  };

  const getTabStats = () => {
    // Mock stats - in real app, fetch from API
    return {
      totalStudents: sections.reduce((sum, section) => sum + (section.max_students || 0), 0),
      totalSections: sections.length,
      upcomingExams: 3,
      averageAttendance: 85.6,
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!classData) {
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        Class not found
      </Alert>
    );
  }

  const stats = getTabStats();

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="/dashboard"
          onClick={(e) => {
            e.preventDefault();
            navigate('/dashboard');
          }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Link
          color="inherit"
          href="/classes"
          onClick={(e) => {
            e.preventDefault();
            navigate('/classes');
          }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <SchoolIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Classes
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <SchoolIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {classData.name}
        </Typography>
      </Breadcrumbs>

      {/* Class Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" gutterBottom fontWeight="bold">
                {classData.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Class Level: {classData.numeric_level} • Academic Year: {classData.academic_year}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  label={`${stats.totalStudents} Students`}
                  color="primary"
                  size="small"
                  icon={<PeopleIcon />}
                />
                <Chip
                  label={`${stats.totalSections} Sections`}
                  color="info"
                  size="small"
                  icon={<SchoolIcon />}
                />
                <Chip
                  label={`${stats.upcomingExams} Upcoming Exams`}
                  color="warning"
                  size="small"
                  icon={<AssessmentIcon />}
                />
                <Chip
                  label={`${stats.averageAttendance}% Attendance`}
                  color="success"
                  size="small"
                  icon={<EventNoteIcon />}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="class navigation tabs">
            <Tab
              label="Overview"
              icon={<SchoolIcon />}
              iconPosition="start"
              id="class-tab-0"
              aria-controls="class-tabpanel-0"
            />
            <Tab
              label="Students"
              icon={<PeopleIcon />}
              iconPosition="start"
              id="class-tab-1"
              aria-controls="class-tabpanel-1"
            />
            <Tab
              label="Exams"
              icon={<AssessmentIcon />}
              iconPosition="start"
              id="class-tab-2"
              aria-controls="class-tabpanel-2"
            />
            <Tab
              label="Attendance"
              icon={<EventNoteIcon />}
              iconPosition="start"
              id="class-tab-3"
              aria-controls="class-tabpanel-3"
            />
            <Tab
              label="Performance"
              icon={<AnalyticsIcon />}
              iconPosition="start"
              id="class-tab-4"
              aria-controls="class-tabpanel-4"
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <ClassOverviewTab classId={classId!} classData={classData} sections={sections} />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <ClassStudentsTab classId={classId!} classData={classData} sections={sections} />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <ClassExamsTab classId={classId!} classData={classData} sections={sections} />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <ClassAttendanceTab classId={classId!} classData={classData} sections={sections} />
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <ClassPerformanceTab classId={classId!} classData={classData} sections={sections} />
        </TabPanel>
      </Card>

      {/* Nested Routes for Direct URL Access */}
      <Routes>
        <Route path="/" element={<></>} />
        <Route path="students" element={<></>} />
        <Route path="exams" element={<></>} />
        <Route path="attendance" element={<></>} />
        <Route path="performance" element={<></>} />
      </Routes>
    </Box>
  );
};
