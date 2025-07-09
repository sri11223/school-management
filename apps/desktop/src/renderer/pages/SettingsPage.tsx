import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Backup as BackupIcon,
  Update as UpdateIcon,
  Info as InfoIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
} from '@mui/icons-material';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface SchoolSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  academicYear: string;
  language: string;
  timezone: string;
  currency: string;
}

interface SystemSettings {
  theme: string;
  notifications: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    desktop: boolean;
  };
  backup: {
    enabled: boolean;
    frequency: string;
    location: string;
  };
  security: {
    passwordPolicy: string;
    sessionTimeout: number;
    twoFactorAuth: boolean;
  };
  features: {
    aiEnabled: boolean;
    whatsappEnabled: boolean;
    attendanceTracking: boolean;
    feeManagement: boolean;
    examManagement: boolean;
    analyticsEnabled: boolean;
  };
}

export const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>({
    name: 'EduManage Pro School',
    address: '123 Education Street, Learning City, State 12345',
    phone: '+91 9876543210',
    email: 'info@edumanageschool.edu',
    website: 'www.edumanageschool.edu',
    logo: '',
    academicYear: '2024-2025',
    language: 'English',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    theme: 'light',
    notifications: {
      email: true,
      sms: true,
      whatsapp: true,
      desktop: true,
    },
    backup: {
      enabled: true,
      frequency: 'daily',
      location: 'local',
    },
    security: {
      passwordPolicy: 'medium',
      sessionTimeout: 30,
      twoFactorAuth: false,
    },
    features: {
      aiEnabled: true,
      whatsappEnabled: true,
      attendanceTracking: true,
      feeManagement: true,
      examManagement: true,
      analyticsEnabled: true,
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSchoolSettingsChange = (field: keyof SchoolSettings, value: string) => {
    setSchoolSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSystemSettingsChange = (section: keyof SystemSettings, field: string, value: any) => {
    setSystemSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value,
      },
    }));
  };

  const handleSaveSettings = () => {
    try {
      // Mock save operation
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleBackupNow = () => {
    try {
      // Mock backup operation
      setSuccess('Backup completed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create backup');
      setTimeout(() => setError(null), 3000);
    }
  };

  const appVersion = '1.0.0';
  const systemInfo = {
    os: 'Windows 11',
    memory: '8 GB',
    storage: '500 GB',
    lastBackup: '2024-01-15 14:30:00',
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure system settings and preferences
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          sx={{ height: 'fit-content' }}
        >
          Save Settings
        </Button>
      </Box>

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

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="General" />
            <Tab label="Security" />
            <Tab label="Notifications" />
            <Tab label="Backup & Storage" />
            <Tab label="Features" />
            <Tab label="About" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  School Information
                </Typography>
                <TextField
                  fullWidth
                  label="School Name"
                  value={schoolSettings.name}
                  onChange={(e) => handleSchoolSettingsChange('name', e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={3}
                  value={schoolSettings.address}
                  onChange={(e) => handleSchoolSettingsChange('address', e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={schoolSettings.phone}
                  onChange={(e) => handleSchoolSettingsChange('phone', e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={schoolSettings.email}
                  onChange={(e) => handleSchoolSettingsChange('email', e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Website"
                  value={schoolSettings.website}
                  onChange={(e) => handleSchoolSettingsChange('website', e.target.value)}
                  margin="normal"
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  System Preferences
                </Typography>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Academic Year</InputLabel>
                  <Select
                    value={schoolSettings.academicYear}
                    onChange={(e) => handleSchoolSettingsChange('academicYear', e.target.value)}
                    label="Academic Year"
                  >
                    <MenuItem value="2023-2024">2023-2024</MenuItem>
                    <MenuItem value="2024-2025">2024-2025</MenuItem>
                    <MenuItem value="2025-2026">2025-2026</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={schoolSettings.language}
                    onChange={(e) => handleSchoolSettingsChange('language', e.target.value)}
                    label="Language"
                  >
                    <MenuItem value="English">English</MenuItem>
                    <MenuItem value="Hindi">Hindi</MenuItem>
                    <MenuItem value="Regional">Regional</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={schoolSettings.timezone}
                    onChange={(e) => handleSchoolSettingsChange('timezone', e.target.value)}
                    label="Timezone"
                  >
                    <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST)</MenuItem>
                    <MenuItem value="Asia/Karachi">Asia/Karachi (PKT)</MenuItem>
                    <MenuItem value="Asia/Dhaka">Asia/Dhaka (BST)</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={schoolSettings.currency}
                    onChange={(e) => handleSchoolSettingsChange('currency', e.target.value)}
                    label="Currency"
                  >
                    <MenuItem value="INR">Indian Rupee (₹)</MenuItem>
                    <MenuItem value="USD">US Dollar ($)</MenuItem>
                    <MenuItem value="EUR">Euro (€)</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={systemSettings.theme}
                    onChange={(e) => handleSystemSettingsChange('theme', '', e.target.value)}
                    label="Theme"
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="auto">Auto</MenuItem>
                  </Select>
                </FormControl>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Security Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Password Policy</InputLabel>
                  <Select
                    value={systemSettings.security.passwordPolicy}
                    onChange={(e) => handleSystemSettingsChange('security', 'passwordPolicy', e.target.value)}
                    label="Password Policy"
                  >
                    <MenuItem value="weak">Weak (6+ characters)</MenuItem>
                    <MenuItem value="medium">Medium (8+ characters, mixed case)</MenuItem>
                    <MenuItem value="strong">Strong (12+ characters, special chars)</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  type="number"
                  value={systemSettings.security.sessionTimeout}
                  onChange={(e) => handleSystemSettingsChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemSettings.security.twoFactorAuth}
                      onChange={(e) => handleSystemSettingsChange('security', 'twoFactorAuth', e.target.checked)}
                    />
                  }
                  label="Two-Factor Authentication"
                />
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Notification Settings
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive notifications via email"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={systemSettings.notifications.email}
                    onChange={(e) => handleSystemSettingsChange('notifications', 'email', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary="SMS Notifications"
                  secondary="Receive notifications via SMS"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={systemSettings.notifications.sms}
                    onChange={(e) => handleSystemSettingsChange('notifications', 'sms', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary="WhatsApp Notifications"
                  secondary="Receive notifications via WhatsApp"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={systemSettings.notifications.whatsapp}
                    onChange={(e) => handleSystemSettingsChange('notifications', 'whatsapp', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Desktop Notifications"
                  secondary="Show desktop notifications"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={systemSettings.notifications.desktop}
                    onChange={(e) => handleSystemSettingsChange('notifications', 'desktop', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <BackupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Backup Settings
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemSettings.backup.enabled}
                      onChange={(e) => handleSystemSettingsChange('backup', 'enabled', e.target.checked)}
                    />
                  }
                  label="Automatic Backup"
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Backup Frequency</InputLabel>
                  <Select
                    value={systemSettings.backup.frequency}
                    onChange={(e) => handleSystemSettingsChange('backup', 'frequency', e.target.value)}
                    label="Backup Frequency"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Backup Location</InputLabel>
                  <Select
                    value={systemSettings.backup.location}
                    onChange={(e) => handleSystemSettingsChange('backup', 'location', e.target.value)}
                    label="Backup Location"
                  >
                    <MenuItem value="local">Local Storage</MenuItem>
                    <MenuItem value="cloud">Cloud Storage</MenuItem>
                    <MenuItem value="external">External Drive</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleBackupNow}
                  sx={{ mt: 2 }}
                >
                  Backup Now
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Storage Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Database Size: 45.2 MB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Media Files: 125.8 MB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Backup Files: 78.5 MB
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Last Backup: {systemInfo.lastBackup}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <AdminPanelSettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Feature Settings
            </Typography>
            <List>
              {Object.entries(systemSettings.features).map(([key, value]) => (
                <ListItem key={key}>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    secondary={`${value ? 'Enabled' : 'Disabled'} - ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={value}
                      onChange={(e) => handleSystemSettingsChange('features', key, e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Application Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Version: {appVersion}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Build: 20240115-1430
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    License: Commercial
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<UpdateIcon />}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Check for Updates
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  System Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Operating System: {systemInfo.os}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Memory: {systemInfo.memory}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Storage: {systemInfo.storage}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  © 2024 EduManage Pro. All rights reserved.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};
