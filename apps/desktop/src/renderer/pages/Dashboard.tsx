import React from 'react';
import { Grid, Card, CardContent, Typography, Button } from '@mui/material';
import { School, Person, Assignment, Analytics } from '@mui/icons-material';

export const Dashboard: React.FC = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <School color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">Student Management</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage student profiles, admissions, and records
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }}>
              Manage Students
            </Button>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Person color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">Teacher Management</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage teacher profiles and schedules
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }}>
              Manage Teachers
            </Button>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Assignment color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">AI Exam Generator</Typography>
            <Typography variant="body2" color="text.secondary">
              Generate exams automatically with AI
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }}>
              Generate Exam
            </Button>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6} lg={3}>
        <Card>
          <CardContent>
            <Analytics color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">Performance Analytics</Typography>
            <Typography variant="body2" color="text.secondary">
              AI-powered performance insights
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }}>
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};