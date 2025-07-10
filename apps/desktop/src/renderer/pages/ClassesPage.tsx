import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  School as SchoolIcon,
  MoreVert as MoreVertIcon,
  Groups as GroupsIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { classAPI } from '../services/api';
import { Class } from '../types';

interface ClassFormData {
  numeric_level: number;
  academic_year: string;
  number_of_students: number;
  number_of_sections: number;
}

export const ClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [deletingClass, setDeletingClass] = useState<Class | null>(null);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<ClassFormData>({
    numeric_level: 0,
    academic_year: '', // Removed default academic year
    number_of_students: 0,
    number_of_sections: 0,
  });

  // Ensure "All Academic Years" is selected initially
  const [academicYearFilter] = useState<string | null>(null);

  // Add state for search, pagination, sorting, and bulk actions
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState('created_at');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Add class analytics
  const totalStudents = classes.reduce((sum, cls) => sum + cls.number_of_students, 0);
  const totalSections = classes.reduce((sum, cls) => sum + cls.number_of_sections, 0);
  const totalClasses = classes.length; // Add totalClasses calculation

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await classAPI.getAll();
console.log('Fetched classes:', response);  
      if (response && Array.isArray(response.data)) {
        setClasses(response.data);
      } else if (response && Array.isArray(response)) {
        setClasses(response);
      } else {
        setClasses([]);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to fetch classes. Please try again.');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const [formErrors, setFormErrors] = useState({
    numeric_level: '',
    academic_year: '',
    number_of_students: '',
  });

  const validateForm = () => {
    const errors: { numeric_level: string; academic_year: string; number_of_students: string } = {
      numeric_level: '',
      academic_year: '',
      number_of_students: '',
    };

    if (formData.numeric_level <= 0) {
      errors.numeric_level = 'Standard level must be greater than 0.';
    }

    if (!formData.academic_year.trim()) {
      errors.academic_year = 'Academic year is required.';
    }

    if (formData.number_of_students <= 0) {
      errors.number_of_students = 'Number of students must be greater than 0.';
    }

    setFormErrors(errors);

    // Return true if no errors exist
    return Object.values(errors).every((error) => error === '');
  };

  const handleAddClass = async () => {
    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    try {
      setError(null);

      const newClass = await classAPI.create(formData) as Class;
      console.log('Created class:', newClass);

      setClasses([...classes, newClass]);
      setOpenAddDialog(false);
      resetForm();
      setSuccess('Class created successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

      // Re-fetch classes to ensure created_at is updated
      await fetchClasses();
    } catch (err) {
      console.error('Error creating class:', err);
      setError('Failed to create class. Please try again.');
    }
  };

  const handleUpdateClass = async () => {
    if (!editingClass) return;

    try {
      setError(null);

      if (!formData.numeric_level || !formData.academic_year || !formData.number_of_students || !formData.number_of_sections) {
        setError('All fields are required. Please fill out the form completely.');
        return;
      }

      const updatedClass = await classAPI.update(editingClass.id!.toString(), formData) as Class;
      console.log('Updated class:', updatedClass);
      
      setClasses(classes.map(cls => 
        cls.id === editingClass.id ? updatedClass : cls
      ));
      setOpenEditDialog(false);
      resetForm();
      setSuccess('Class updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating class:', err);
      setError('Failed to update class. Please try again.');
    }
  };

  const handleDeleteClass = async () => {
    if (!deletingClass) return;

    try {
      setError(null);
      
      await classAPI.delete(deletingClass.id!.toString());
      console.log('Deleted class:', deletingClass.id);
      
      setClasses(classes.filter(cls => cls.id !== deletingClass.id));
      setOpenDeleteDialog(false);
      setDeletingClass(null);
      setSuccess('Class deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting class:', err);
      setError('Failed to delete class. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      numeric_level: 1,
      academic_year: '', // Removed default academic year
      number_of_students: 0,
      number_of_sections: 0,
    });
    setEditingClass(null);
  };

  const openEditClassDialog = (classData: Class) => {
    setEditingClass(classData);
    setFormData({
      numeric_level: classData.numeric_level,
      academic_year: classData.academic_year,
      number_of_students: classData.number_of_students,
      number_of_sections: classData.number_of_sections,
    });
    setOpenEditDialog(true);
    setAnchorEl(null);
  };

  const openDeleteClassDialog = (classData: Class) => {
    setDeletingClass(classData);
    setOpenDeleteDialog(true);
    setAnchorEl(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, classData: Class) => {
    setAnchorEl(event.currentTarget);
    setSelectedClass(classData);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClass(null);
  };

  const handleViewClass = (classData: Class) => {
    navigate(`/classes/${classData.id}`);
    setAnchorEl(null);
  };

  const getClassIcon = (level: number) => {
    if (level <= 5) return '🎒';
    if (level <= 8) return '📚';
    return '🎓';
  };

  // Filter classes based on selected academic year
  const filteredClasses = academicYearFilter
    ? classes.filter(cls => cls.academic_year === academicYearFilter)
    : classes;

  // Filter and sort classes
  const searchedAndSortedClasses = filteredClasses
    .filter(cls => {
      if (!searchQuery) return true; // Show all if no search query
      const name = cls.name || ''; // Ensure name is defined
      return name.toLowerCase().includes(searchQuery.toLowerCase()) || cls.numeric_level.toString().includes(searchQuery);
    })
    .sort((a, b) => {
      if (sortOption === 'created_at') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
      if (sortOption === 'numeric_level') return a.numeric_level - b.numeric_level;
      if (sortOption === 'academic_year') return a.academic_year.localeCompare(b.academic_year);
      return 0;
    });
console.log(searchedAndSortedClasses)
  // Paginate classes
  const paginatedClasses = searchedAndSortedClasses.slice((currentPage - 1) * 10, currentPage * 10);
  console.log(paginatedClasses);
  // Bulk delete handler
  const handleBulkDelete = async () => {
    try {
      setError(null);
      await Promise.all(selectedClasses.map(id => classAPI.delete(id))); // Use string ID directly
      setClasses(classes.filter(cls => cls.id && !selectedClasses.includes(cls.id.toString()))); // Filter by UUID
      setSelectedClasses([]);
      setSuccess('Selected classes deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting classes:', err);
      setError('Failed to delete selected classes. Please try again.');
    }
  };

  useEffect(() => {
    console.log('Paginated Classes:', paginatedClasses);
  }, [paginatedClasses]);

  const handleRetryFetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await classAPI.getAll();
      console.log('Fetched classes:', response);

      if (response && Array.isArray(response.data)) {
        setClasses(response.data);
      } else if (response && Array.isArray(response)) {
        setClasses(response);
      } else {
        setClasses([]);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to fetch classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add dynamic section management in class creation/editing dialogs
  const [sections, setSections] = useState<{ name: string; studentCount: number }[]>([]);

  // Update sections dynamically based on the number of sections
  useEffect(() => {
    const newSections = Array.from({ length: formData.number_of_sections }, (_, index) => {
      return sections[index] || { name: '', studentCount: 0 };
    });
    setSections(newSections);
  }, [formData.number_of_sections, sections]);

  // Reintroduce the handleUpdateSection function
  const handleUpdateSection = (index: number, updatedSection: { name: string; studentCount: number }) => {
    const updatedSections = [...sections];
    updatedSections[index] = updatedSection;
    setSections(updatedSections);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Classes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your school classes and sections
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Students: {totalStudents}, Total Sections: {totalSections}, Total Classes: {totalClasses}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            label="Search Classes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ minWidth: 200 }}
            inputProps={{ 'aria-label': 'Search Classes' }}
          />
          <TextField
            select
            label="Sort By"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="created_at">Created At</MenuItem>
            <MenuItem value="numeric_level">Numeric Level</MenuItem>
            <MenuItem value="academic_year">Academic Year</MenuItem>
          </TextField>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
            size="large"
            aria-label="Add Class"
          >
            Add Class
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
          <Button onClick={handleRetryFetchClasses} variant="text" color="inherit">
            Retry
          </Button>
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Classes Grid */}
      {paginatedClasses.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <SchoolIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Classes Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first class to get started with student management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
            >
              Create First Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {paginatedClasses.map((classData) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={classData.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  },
                }}
                onClick={() => handleViewClass(classData)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 56,
                        height: 56,
                        fontSize: '1.5rem',
                      }}
                    >
                      {getClassIcon(classData.numeric_level)}
                    </Avatar>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuClick(e, classData);
                      }}
                      aria-label="More Options"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
               
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip
                      label={`Standard ${classData.numeric_level}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Academic Year: {classData.academic_year}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Created At: {classData.created_at ? new Date(classData.created_at).toLocaleDateString() : 'N/A'}
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <GroupsIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {classData.number_of_students} Students
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AssignmentIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {classData.number_of_sections} Sections
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        TransitionComponent={Fade}
      >
        <MenuItem onClick={() => selectedClass && handleViewClass(selectedClass)}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View Class
        </MenuItem>
        <MenuItem onClick={() => selectedClass && openEditClassDialog(selectedClass)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit Class
        </MenuItem>
        <MenuItem onClick={() => selectedClass && openDeleteClassDialog(selectedClass)}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Class
        </MenuItem>
      </Menu>

      {/* Add Class Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
      >
        <DialogTitle>Add New Class</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Standard Level"
                type="number"
                value={formData.numeric_level}
                onChange={(e) => setFormData({ ...formData, numeric_level: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 12 }}
                required
                error={!!formErrors.numeric_level}
                helperText={formErrors.numeric_level}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Academic Year"
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                placeholder="e.g., 2024-25"
                required
                error={!!formErrors.academic_year}
                helperText={formErrors.academic_year}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Number of Students"
                type="number"
                value={formData.number_of_students}
                onChange={(e) => setFormData({ ...formData, number_of_students: parseInt(e.target.value) })}
                inputProps={{ min: 0 }}
                required
                error={!!formErrors.number_of_students}
                helperText={formErrors.number_of_students}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Number of Sections"
                type="number"
                value={formData.number_of_sections}
                onChange={(e) => setFormData({ ...formData, number_of_sections: parseInt(e.target.value) })}
                inputProps={{ min: 0 }}
                required
              />
            </Grid>

            {/* Sections */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Sections
              </Typography>
              {sections.map((section, index) => (
                <Box key={index} display="flex" alignItems="center" gap={2} mb={2}>
                  <TextField
                    label={`Section ${index + 1} Name`}
                    value={section.name}
                    onChange={(e) =>
                      handleUpdateSection(index, { ...section, name: e.target.value })
                    }
                    fullWidth
                  />
                  <TextField
                    label={`Section ${index + 1} Student Count`}
                    type="number"
                    value={section.studentCount}
                    onChange={(e) =>
                      handleUpdateSection(index, {
                        ...section,
                        studentCount: parseInt(e.target.value, 10),
                      })
                    }
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                </Box>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddClass} variant="contained">
            Create Class
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
      >
        <DialogTitle>Edit Class</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Standard Level"
                type="number"
                value={formData.numeric_level}
                onChange={(e) => setFormData({ ...formData, numeric_level: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 12 }}
                required
                error={!!formErrors.numeric_level}
                helperText={formErrors.numeric_level}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Academic Year"
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                placeholder="e.g., 2024-25"
                required
                error={!!formErrors.academic_year}
                helperText={formErrors.academic_year}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Number of Students"
                type="number"
                value={formData.number_of_students}
                onChange={(e) => setFormData({ ...formData, number_of_students: parseInt(e.target.value) })}
                inputProps={{ min: 0 }}
                required
                error={!!formErrors.number_of_students}
                helperText={formErrors.number_of_students}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Number of Sections"
                type="number"
                value={formData.number_of_sections}
                onChange={(e) => setFormData({ ...formData, number_of_sections: parseInt(e.target.value) })}
                inputProps={{ min: 0 }}
                required
              />
            </Grid>

            {/* Sections */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Sections
              </Typography>
              {sections.map((section, index) => (
                <Box key={index} display="flex" alignItems="center" gap={2} mb={2}>
                  <TextField
                    label={`Section ${index + 1} Name`}
                    value={section.name}
                    onChange={(e) =>
                      handleUpdateSection(index, { ...section, name: e.target.value })
                    }
                    fullWidth
                  />
                  <TextField
                    label={`Section ${index + 1} Student Count`}
                    type="number"
                    value={section.studentCount}
                    onChange={(e) =>
                      handleUpdateSection(index, {
                        ...section,
                        studentCount: parseInt(e.target.value, 10),
                      })
                    }
                    inputProps={{ min: 0 }}
                    fullWidth
                  />
                </Box>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateClass} variant="contained">
            Update Class
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Class Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
      >
        <DialogTitle>Delete Class</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deletingClass?.name}"?
            This action cannot be undone and will remove all associated data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteClass} variant="contained" color="error">
            Delete Class
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pagination and Bulk Delete */}
      <Box display="flex" justifyContent="center" alignItems="center" mt={3}>
        <Button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </Button>
        <Typography variant="body2" color="text.secondary" mx={2}>
          Page {currentPage}
        </Typography>
        <Button
          disabled={currentPage * 10 >= searchedAndSortedClasses.length}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </Button>
      </Box>

      {selectedClasses.length > 0 && (
        <Box display="flex" justifyContent="center" alignItems="center" mt={3}>
          <Button
            variant="contained"
            color="error"
            onClick={handleBulkDelete}
          >
            Delete Selected Classes
          </Button>
        </Box>
      )}
    </Box>
  );
};
