import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middleware/errorHandler';

export const validateClass = (req: Request, res: Response, next: NextFunction) => {
  const {
    name,
    grade,
    section,
    academic_year_id
  } = req.body;

  const errors: string[] = [];

  // Required fields validation
  if (!name || name.trim() === '') {
    errors.push('Class name is required');
  }

  if (!grade || isNaN(grade) || grade < 1 || grade > 12) {
    errors.push('Grade must be a number between 1 and 12');
  }

  if (!section || section.trim() === '') {
    errors.push('Section is required');
  }

  if (!academic_year_id || isNaN(academic_year_id)) {
    errors.push('Academic year ID is required and must be a number');
  }

  // Optional field validations
  if (req.body.capacity && (isNaN(req.body.capacity) || req.body.capacity < 1)) {
    errors.push('Capacity must be a positive number');
  }

  if (req.body.class_teacher_id && isNaN(req.body.class_teacher_id)) {
    errors.push('Class teacher ID must be a number');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }

  next();
};

export const validateClassUpdate = (req: Request, res: Response, next: NextFunction) => {
  const errors: string[] = [];

  // Optional validations for update
  if (req.body.grade && (isNaN(req.body.grade) || req.body.grade < 1 || req.body.grade > 12)) {
    errors.push('Grade must be a number between 1 and 12');
  }

  if (req.body.capacity && (isNaN(req.body.capacity) || req.body.capacity < 1)) {
    errors.push('Capacity must be a positive number');
  }

  if (req.body.class_teacher_id && isNaN(req.body.class_teacher_id)) {
    errors.push('Class teacher ID must be a number');
  }

  if (req.body.academic_year_id && isNaN(req.body.academic_year_id)) {
    errors.push('Academic year ID must be a number');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }

  next();
};
