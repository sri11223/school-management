import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Paper,
  Avatar,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Send as SendIcon,
  Group as GroupIcon,
  Message as MessageIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
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
      id={`whatsapp-tabpanel-${index}`}
      aria-labelledby={`whatsapp-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface WhatsAppMessage {
  id: string;
  recipient: string;
  message: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  timestamp: Date;
  type: 'individual' | 'group' | 'broadcast';
}

interface WhatsAppSettings {
  apiKey: string;
  webhookUrl: string;
  autoReplyEnabled: boolean;
  businessHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  templates: {
    attendance: string;
    feeReminder: string;
    examNotification: string;
    generalUpdate: string;
  };
}

export const WhatsAppPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [settings, setSettings] = useState<WhatsAppSettings>({
    apiKey: '',
    webhookUrl: '',
    autoReplyEnabled: true,
    businessHours: {
      enabled: true,
      start: '09:00',
      end: '17:00',
    },
    templates: {
      attendance: 'Dear {parent_name}, {student_name} was absent today ({date}). Please contact the school if there are any concerns.',
      feeReminder: 'Dear {parent_name}, This is a reminder that the fee payment for {student_name} is due on {due_date}. Amount: ₹{amount}',
      examNotification: 'Dear {parent_name}, {student_name} has an upcoming exam: {exam_name} on {exam_date}. Please ensure adequate preparation.',
      generalUpdate: 'Dear {parent_name}, This is an important update regarding {student_name}: {message}',
    },
  });

  const [messageForm, setMessageForm] = useState({
    recipient: '',
    recipientType: 'individual',
    message: '',
    template: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Mock message history
      const mockMessages: WhatsAppMessage[] = [
        {
          id: '1',
          recipient: '+91 9876543210',
          message: 'Dear Parent, John was absent today. Please contact the school.',
          status: 'delivered',
          timestamp: new Date(),
          type: 'individual',
        },
        {
          id: '2',
          recipient: 'Class 10A Parents',
          message: 'Exam schedule has been updated. Please check the notice board.',
          status: 'sent',
          timestamp: new Date(),
          type: 'group',
        },
        {
          id: '3',
          recipient: 'All Parents',
          message: 'School will remain closed tomorrow due to weather conditions.',
          status: 'pending',
          timestamp: new Date(),
          type: 'broadcast',
        },
      ];

      setMessages(mockMessages);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSendMessage = async () => {
    try {
      setLoading(true);
      
      // Mock API call
      const newMessage: WhatsAppMessage = {
        id: Date.now().toString(),
        recipient: messageForm.recipient,
        message: messageForm.message,
        status: 'sent',
        timestamp: new Date(),
        type: messageForm.recipientType as 'individual' | 'group' | 'broadcast',
      };

      setMessages(prev => [newMessage, ...prev]);
      setSuccess('Message sent successfully');
      setDialogOpen(false);
      setMessageForm({
        recipient: '',
        recipientType: 'individual',
        message: '',
        template: '',
      });
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: string) => {
    setMessageForm(prev => ({
      ...prev,
      message: settings.templates[template as keyof typeof settings.templates] || '',
      template,
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const MetricCard = ({ title, value, icon, color }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
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
      </CardContent>
    </Card>
  );

  const deliveredMessages = messages.filter(m => m.status === 'delivered').length;
  const failedMessages = messages.filter(m => m.status === 'failed').length;
  const pendingMessages = messages.filter(m => m.status === 'pending').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            WhatsApp Integration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Communicate with parents and students via WhatsApp
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ height: 'fit-content' }}
        >
          Send Message
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

      {/* Message Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Total Messages"
            value={messages.length}
            icon={<MessageIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Delivered"
            value={deliveredMessages}
            icon={<CheckCircleIcon />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Pending"
            value={pendingMessages}
            icon={<PendingIcon />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Failed"
            value={failedMessages}
            icon={<ErrorIcon />}
            color="error.main"
          />
        </Grid>
      </Grid>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Messages" />
            <Tab label="Templates" />
            <Tab label="Groups" />
            <Tab label="Settings" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <List>
            {messages.map((message) => (
              <ListItem key={message.id} divider>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <WhatsAppIcon />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">{message.recipient}</Typography>
                      <Chip
                        label={message.type}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={message.status}
                        size="small"
                        color={getStatusColor(message.status)}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {message.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {message.timestamp.toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getStatusIcon(message.status)}
                </Box>
              </ListItem>
            ))}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {Object.entries(settings.templates).map(([key, template]) => (
              <Grid item xs={12} md={6} key={key}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={template}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      templates: {
                        ...prev.templates,
                        [key]: e.target.value,
                      },
                    }))}
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Variables: {'{parent_name}, {student_name}, {date}, {amount}, {due_date}, {exam_name}, {exam_date}, {message}'}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              WhatsApp Groups
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage WhatsApp groups for classes and parent communication
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  API Configuration
                </Typography>
                <TextField
                  fullWidth
                  label="API Key"
                  value={settings.apiKey}
                  onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                  margin="normal"
                  type="password"
                />
                <TextField
                  fullWidth
                  label="Webhook URL"
                  value={settings.webhookUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  margin="normal"
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  General Settings
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoReplyEnabled}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoReplyEnabled: e.target.checked }))}
                    />
                  }
                  label="Auto Reply"
                />
                <Divider sx={{ my: 2 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.businessHours.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        businessHours: { ...prev.businessHours, enabled: e.target.checked }
                      }))}
                    />
                  }
                  label="Business Hours"
                />
                {settings.businessHours.enabled && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      label="Start Time"
                      type="time"
                      value={settings.businessHours.start}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        businessHours: { ...prev.businessHours, start: e.target.value }
                      }))}
                      sx={{ mr: 2 }}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="End Time"
                      type="time"
                      value={settings.businessHours.end}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        businessHours: { ...prev.businessHours, end: e.target.value }
                      }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Send Message Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send WhatsApp Message</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Recipient Type</InputLabel>
                <Select
                  value={messageForm.recipientType}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, recipientType: e.target.value }))}
                  label="Recipient Type"
                >
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="group">Group</MenuItem>
                  <MenuItem value="broadcast">Broadcast</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Recipient"
                value={messageForm.recipient}
                onChange={(e) => setMessageForm(prev => ({ ...prev, recipient: e.target.value }))}
                placeholder="Phone number, group name, or 'All'"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Template</InputLabel>
                <Select
                  value={messageForm.template}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  label="Template"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="attendance">Attendance</MenuItem>
                  <MenuItem value="feeReminder">Fee Reminder</MenuItem>
                  <MenuItem value="examNotification">Exam Notification</MenuItem>
                  <MenuItem value="generalUpdate">General Update</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={4}
                value={messageForm.message}
                onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSendMessage} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
