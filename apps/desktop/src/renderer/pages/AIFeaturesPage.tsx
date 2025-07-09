import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  SmartToy as SmartToyIcon,
  Insights as InsightsIcon,
  Recommend as RecommendIcon,
  AutoFixHigh as AutoFixHighIcon,
  Analytics as AnalyticsIcon,
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
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  accuracy: number;
  status: 'active' | 'inactive' | 'training';
  category: 'analytics' | 'automation' | 'insights';
}

export const AIFeaturesPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [aiFeatures, setAIFeatures] = useState<AIFeature[]>([
    {
      id: 'student-performance',
      name: 'Student Performance Prediction',
      description: 'Predict student performance based on attendance, assignments, and exam history',
      icon: <TrendingUpIcon />,
      enabled: true,
      accuracy: 87,
      status: 'active',
      category: 'analytics',
    },
    {
      id: 'attendance-prediction',
      name: 'Attendance Pattern Analysis',
      description: 'Analyze and predict attendance patterns to identify at-risk students',
      icon: <AnalyticsIcon />,
      enabled: true,
      accuracy: 92,
      status: 'active',
      category: 'analytics',
    },
    {
      id: 'fee-optimization',
      name: 'Fee Collection Optimization',
      description: 'Optimize fee collection strategies based on student payment patterns',
      icon: <AutoFixHighIcon />,
      enabled: false,
      accuracy: 78,
      status: 'inactive',
      category: 'automation',
    },
    {
      id: 'learning-recommendations',
      name: 'Personalized Learning Recommendations',
      description: 'Provide personalized learning recommendations for each student',
      icon: <RecommendIcon />,
      enabled: true,
      accuracy: 84,
      status: 'training',
      category: 'insights',
    },
    {
      id: 'resource-allocation',
      name: 'Resource Allocation Assistant',
      description: 'Optimize classroom and teacher resource allocation using AI',
      icon: <SpeedIcon />,
      enabled: false,
      accuracy: 75,
      status: 'inactive',
      category: 'automation',
    },
    {
      id: 'exam-insights',
      name: 'Exam Performance Insights',
      description: 'Generate detailed insights from exam results and identify improvement areas',
      icon: <InsightsIcon />,
      enabled: true,
      accuracy: 89,
      status: 'active',
      category: 'insights',
    },
  ]);

  const systemMetrics = {
    totalPredictions: 1247,
    accuracyRate: 86.5,
    activeModels: 4,
    dataProcessed: 15.7, // GB
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFeatureToggle = (featureId: string) => {
    setAIFeatures(prev => 
      prev.map(feature => 
        feature.id === featureId 
          ? { ...feature, enabled: !feature.enabled, status: !feature.enabled ? 'active' : 'inactive' }
          : feature
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'training': return 'warning';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'training': return 'Training';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
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

  const activeFeatures = aiFeatures.filter(f => f.enabled);
  const averageAccuracy = aiFeatures.reduce((sum, f) => sum + f.accuracy, 0) / aiFeatures.length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            AI Features & Insights
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Harness the power of AI to enhance educational outcomes
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AutoAwesomeIcon />}
          sx={{ height: 'fit-content' }}
        >
          Train Models
        </Button>
      </Box>

      {/* AI System Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Total Predictions"
            value={systemMetrics.totalPredictions.toLocaleString()}
            icon={<PsychologyIcon />}
            color="primary.main"
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Overall Accuracy"
            value={`${averageAccuracy.toFixed(1)}%`}
            icon={<AssessmentIcon />}
            color="success.main"
            subtitle="Across all models"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Active Models"
            value={activeFeatures.length}
            icon={<SmartToyIcon />}
            color="info.main"
            subtitle="Running models"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Data Processed"
            value={`${systemMetrics.dataProcessed} GB`}
            icon={<SpeedIcon />}
            color="warning.main"
            subtitle="This month"
          />
        </Grid>
      </Grid>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="AI Features" />
            <Tab label="Analytics Models" />
            <Tab label="Automation Tools" />
            <Tab label="Insights Engine" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {aiFeatures.map((feature) => (
              <Grid item xs={12} md={6} key={feature.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ color: 'primary.main', mr: 1 }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {feature.name}
                      </Typography>
                      <Chip
                        label={getStatusText(feature.status)}
                        color={getStatusColor(feature.status)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {feature.description}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Accuracy</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {feature.accuracy}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={feature.accuracy}
                        sx={{ height: 8, borderRadius: 4 }}
                        color={feature.accuracy >= 85 ? 'success' : feature.accuracy >= 70 ? 'warning' : 'error'}
                      />
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={feature.enabled}
                          onChange={() => handleFeatureToggle(feature.id)}
                        />
                      }
                      label={feature.enabled ? 'Enabled' : 'Disabled'}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Analytics Models
            </Typography>
            <List>
              {aiFeatures.filter(f => f.category === 'analytics').map((feature) => (
                <ListItem key={feature.id}>
                  <ListItemIcon>
                    {feature.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={feature.name}
                    secondary={feature.description}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={`${feature.accuracy}%`}
                      color={feature.accuracy >= 85 ? 'success' : 'warning'}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Automation Tools
            </Typography>
            <List>
              {aiFeatures.filter(f => f.category === 'automation').map((feature) => (
                <ListItem key={feature.id}>
                  <ListItemIcon>
                    {feature.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={feature.name}
                    secondary={feature.description}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={feature.enabled}
                      onChange={() => handleFeatureToggle(feature.id)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Insights Engine
            </Typography>
            <List>
              {aiFeatures.filter(f => f.category === 'insights').map((feature) => (
                <ListItem key={feature.id}>
                  <ListItemIcon>
                    {feature.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={feature.name}
                    secondary={feature.description}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={getStatusText(feature.status)}
                      color={getStatusColor(feature.status)}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </TabPanel>
      </Card>

      {/* AI Recommendations */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          AI Recommendations
        </Typography>
        <Typography variant="body2">
          • Enable "Fee Collection Optimization" to improve collection rates by 15%
        </Typography>
        <Typography variant="body2">
          • Consider training the "Resource Allocation Assistant" with current semester data
        </Typography>
        <Typography variant="body2">
          • Review performance prediction accuracy for Class 10 students
        </Typography>
      </Alert>
    </Box>
  );
};
