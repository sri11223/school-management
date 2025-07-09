import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';

export interface DataTableColumn {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string;
}

export interface DataTableAction {
  icon: React.ReactNode;
  tooltip: string;
  onClick: (row: any) => void;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  rows: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  customActions?: DataTableAction[];
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  onEdit,
  onDelete,
  onView,
  customActions,
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const hasActions = onEdit || onDelete || onView || (customActions && customActions.length > 0);

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="data table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
              {hasActions && (
                <TableCell align="center" style={{ minWidth: 120 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => (
                <TableRow hover role="checkbox" tabIndex={-1} key={index}>
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {column.format ? column.format(value) : value}
                      </TableCell>
                    );
                  })}
                  {hasActions && (
                    <TableCell align="center">
                      {onView && (
                        <Tooltip title="View">
                          <IconButton onClick={() => onView(row)} size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onEdit && (
                        <Tooltip title="Edit">
                          <IconButton onClick={() => onEdit(row)} size="small">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip title="Delete">
                          <IconButton onClick={() => onDelete(row)} size="small">
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                      {customActions &&
                        customActions.map((action, actionIndex) => (
                          <Tooltip key={actionIndex} title={action.tooltip}>
                            <IconButton onClick={() => action.onClick(row)} size="small">
                              {action.icon}
                            </IconButton>
                          </Tooltip>
                        ))}
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      {onPageChange && onRowsPerPageChange && (
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      )}
    </Paper>
  );
};
