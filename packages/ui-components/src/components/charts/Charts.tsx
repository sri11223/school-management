import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface BaseChartProps {
  title?: string;
  data: ChartData;
  width?: number;
  height?: number;
}

// Simple Line Chart Component (placeholder for chart.js or recharts)
export const LineChart: React.FC<BaseChartProps> = ({
  title,
  data,
  width = 400,
  height = 300,
}) => {
  return (
    <Paper sx={{ p: 2, width, height }}>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: height - (title ? 60 : 20),
          border: '1px dashed #ccc',
          borderRadius: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Line Chart - {data.datasets[0]?.label || 'Data'}
          <br />
          Data points: {data.labels.length}
        </Typography>
      </Box>
    </Paper>
  );
};

// Simple Bar Chart Component (placeholder for chart.js or recharts)
export const BarChart: React.FC<BaseChartProps> = ({
  title,
  data,
  width = 400,
  height = 300,
}) => {
  return (
    <Paper sx={{ p: 2, width, height }}>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: height - (title ? 60 : 20),
          border: '1px dashed #ccc',
          borderRadius: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Bar Chart - {data.datasets[0]?.label || 'Data'}
          <br />
          Categories: {data.labels.length}
        </Typography>
      </Box>
    </Paper>
  );
};

// Types are already exported above as interfaces
