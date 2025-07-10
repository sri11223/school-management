import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middleware/errorHandler';

export const validateClass = (req: Request, res: Response, next: NextFunction) => {
  const {
    numeric_level,
    academic_year
  } = req.body;

  const errors: string[] = [];

  if (!numeric_level || isNaN(numeric_level) || numeric_level < 1 || numeric_level > 12) {
    errors.push('Numeric level must be a number between 1 and 12');
  }

  if (!academic_year || academic_year.trim() === '') {
    errors.push('Academic year is required');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }

  next();
};

export const validateClassUpdate = (req: Request, res: Response, next: NextFunction) => {
  const errors: string[] = [];

  // Optional validations for update
  if (req.body.name !== undefined && req.body.name.trim() === '') {
    errors.push('Class name cannot be empty');
  }

  if (req.body.numeric_level !== undefined && (isNaN(req.body.numeric_level) || req.body.numeric_level < 1 || req.body.numeric_level > 12)) {
    errors.push('Numeric level must be a number between 1 and 12');
  }

  if (req.body.academic_year_id !== undefined && isNaN(req.body.academic_year_id)) {
    errors.push('Academic year ID must be a number');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }

  next();
};

export const validateSection = (req: Request, res: Response, next: NextFunction) => {
  const {
    class_id,
    section_name
  } = req.body;

  const errors: string[] = [];

  // Required fields validation
  if (!class_id || isNaN(class_id)) {
    errors.push('Class ID is required and must be a number');
  }

  if (!section_name || section_name.trim() === '') {
    errors.push('Section name is required');
  }

  // Optional field validations
  if (req.body.class_teacher_id && isNaN(req.body.class_teacher_id)) {
    errors.push('Class teacher ID must be a number');
  }

  if (req.body.max_students && (isNaN(req.body.max_students) || req.body.max_students < 1)) {
    errors.push('Max students must be a positive number');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }

  next();
};

export const validateSectionUpdate = (req: Request, res: Response, next: NextFunction) => {
  const errors: string[] = [];

  // Optional validations for update
  if (req.body.class_id !== undefined && isNaN(req.body.class_id)) {
    errors.push('Class ID must be a number');
  }

  if (req.body.section_name !== undefined && req.body.section_name.trim() === '') {
    errors.push('Section name cannot be empty');
  }

  if (req.body.class_teacher_id !== undefined && req.body.class_teacher_id !== null && isNaN(req.body.class_teacher_id)) {
    errors.push('Class teacher ID must be a number');
  }

  if (req.body.max_students !== undefined && (isNaN(req.body.max_students) || req.body.max_students < 1)) {
    errors.push('Max students must be a positive number');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }

  next();
};
