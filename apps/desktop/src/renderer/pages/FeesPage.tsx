import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { FeeStructure, Class } from '../types';
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
      id={`fee-tabpanel-${index}`}
      aria-labelledby={`fee-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const FeesPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [formData, setFormData] = useState({
    class_id: '',
    academic_year_id: '1',
    fee_category_id: '',
    amount: '',
    due_date: '',
    is_mandatory: true,
  });

  const fetchFeeStructures = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/fees/structures') as { data: FeeStructure[] };
      setFeeStructures(response.data);
    } catch (err) {
      setError('Failed to fetch fee structures');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await apiClient.get('/classes') as { data: Class[] };
      setClasses(response.data);
    } catch (err) {
      setError('Failed to fetch classes');
    }
  }, []);

  useEffect(() => {
    fetchFeeStructures();
    fetchClasses();
  }, [fetchFeeStructures, fetchClasses]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddFee = () => {
    setEditingFee(null);
    setFormData({
      class_id: '',
      academic_year_id: '1',
      fee_category_id: '',
      amount: '',
      due_date: '',
      is_mandatory: true,
    });
    setDialogOpen(true);
  };

  const handleEditFee = (fee: FeeStructure) => {
    setEditingFee(fee);
    setFormData({
      class_id: fee.class_id.toString(),
      academic_year_id: fee.academic_year_id.toString(),
      fee_category_id: fee.fee_category_id.toString(),
      amount: fee.amount.toString(),
      due_date: fee.due_date,
      is_mandatory: fee.is_mandatory,
    });
    setDialogOpen(true);
  };

  const handleDeleteFee = async (feeId: number) => {
    if (window.confirm('Are you sure you want to delete this fee structure?')) {
      try {
        await apiClient.delete(`/fees/structures/${feeId}`);
        setSuccess('Fee structure deleted successfully');
        fetchFeeStructures();
      } catch (err) {
        setError('Failed to delete fee structure');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        class_id: parseInt(formData.class_id),
        academic_year_id: parseInt(formData.academic_year_id),
        fee_category_id: parseInt(formData.fee_category_id),
      };

      if (editingFee) {
        await apiClient.put(`/fees/structures/${editingFee.id}`, submitData);
        setSuccess('Fee structure updated successfully');
      } else {
        await apiClient.post('/fees/structures', submitData);
        setSuccess('Fee structure created successfully');
      }
      setDialogOpen(false);
      fetchFeeStructures();
    } catch (err) {
      setError('Failed to save fee structure');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const mockFeeCategories = [
    { id: 1, name: 'Tuition Fee' },
    { id: 2, name: 'Admission Fee' },
    { id: 3, name: 'Examination Fee' },
    { id: 4, name: 'Transportation Fee' },
    { id: 5, name: 'Library Fee' },
    { id: 6, name: 'Sports Fee' },
  ];

  const mockFeePayments = [
    { id: 1, student_id: 1, amount: 5000, status: 'Paid', due_date: '2024-01-15' },
    { id: 2, student_id: 2, amount: 5000, status: 'Pending', due_date: '2024-01-15' },
    { id: 3, student_id: 3, amount: 5000, status: 'Overdue', due_date: '2024-01-15' },
  ];

  const totalFees = feeStructures.reduce((sum, fee) => sum + fee.amount, 0);
  const collectionRate = 75; // Mock collection rate

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Fee Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage fee structures, collections, and payment tracking
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddFee}
          sx={{ height: 'fit-content' }}
        >
          Add Fee Structure
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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total Fees</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ₹{totalFees.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PaymentIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Collection Rate</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {collectionRate}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={collectionRate}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReceiptIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Pending Payments</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {mockFeePayments.filter(p => p.status === 'Pending').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Overdue Payments</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {mockFeePayments.filter(p => p.status === 'Overdue').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Fee Structures" />
            <Tab label="Fee Collections" />
            <Tab label="Payment History" />
            <Tab label="Reports" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Class</TableCell>
                    <TableCell>Fee Category</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Mandatory</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feeStructures.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>
                        {classes.find(c => c.id === fee.class_id)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {mockFeeCategories.find(c => c.id === fee.fee_category_id)?.name || 'N/A'}
                      </TableCell>
                      <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(fee.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={fee.is_mandatory ? 'Yes' : 'No'}
                          color={fee.is_mandatory ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleEditFee(fee)}
                          color="primary"
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteFee(fee.id!)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {feeStructures.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No fee structures found. Add your first fee structure to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PaymentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Fee Collections
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track daily fee collections and payment status
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Payment History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View complete payment history and transaction details
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
              Generate comprehensive financial reports and analytics
            </Typography>
          </Box>
        </TabPanel>
      </Card>

      {/* Add/Edit Fee Structure Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingFee ? 'Edit Fee Structure' : 'Add New Fee Structure'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Class</InputLabel>
                <Select
                  value={formData.class_id}
                  onChange={(e) => handleInputChange('class_id', e.target.value)}
                  label="Class"
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id!.toString()}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Fee Category</InputLabel>
                <Select
                  value={formData.fee_category_id}
                  onChange={(e) => handleInputChange('fee_category_id', e.target.value)}
                  label="Fee Category"
                >
                  {mockFeeCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Academic Year ID"
                value={formData.academic_year_id}
                onChange={(e) => handleInputChange('academic_year_id', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Mandatory</InputLabel>
                <Select
                  value={formData.is_mandatory.toString()}
                  onChange={(e) => handleInputChange('is_mandatory', e.target.value === 'true')}
                  label="Mandatory"
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : (editingFee ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
