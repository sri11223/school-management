import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

export const StudentsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Student Management
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Manage student profiles, admissions, and academic records.
      </Typography>
      
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6">Coming Soon!</Typography>
          <Typography variant="body2" color="text.secondary">
            Student management features are being developed. This will include:
          </Typography>
          <ul>
            <li>Student enrollment and admission</li>
            <li>Profile management</li>
            <li>Academic records</li>
            <li>Parent information</li>
            <li>Document management</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
};
