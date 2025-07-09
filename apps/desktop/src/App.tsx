import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { THEME_COLORS } from './renderer/types';
import { MainLayout } from './renderer/layouts/MainLayout';
import { Dashboard } from './renderer/pages/Dashboard';
import { StudentsPage } from './renderer/pages/StudentsPage';
import { ClassesPage } from './renderer/pages/ClassesPage';
import { ClassDetailPage } from './renderer/pages/ClassDetailPage';
import { TeachersPage } from './renderer/pages/TeachersPage';
import { AttendancePage } from './renderer/pages/AttendancePage';
import { ExamsPage } from './renderer/pages/ExamsPage';
import { FeesPage } from './renderer/pages/FeesPage';
import { AnalyticsPage } from './renderer/pages/AnalyticsPage';
import { AIFeaturesPage } from './renderer/pages/AIFeaturesPage';
import { WhatsAppPage } from './renderer/pages/WhatsAppPage';
import { SettingsPage } from './renderer/pages/SettingsPage';

const theme = createTheme({
  palette: {
    primary: THEME_COLORS.primary,
    secondary: THEME_COLORS.secondary,
    success: THEME_COLORS.success,
    warning: THEME_COLORS.warning,
    error: THEME_COLORS.error,
    info: THEME_COLORS.info,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/classes/:classId/*" element={<ClassDetailPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/fees" element={<FeesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/ai-features" element={<AIFeaturesPage />} />
            <Route path="/whatsapp" element={<WhatsAppPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </MainLayout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
