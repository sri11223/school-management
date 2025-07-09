import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middleware/errorHandler';

export const validateTeacher = (req: Request, res: Response, next: NextFunction) => {
  const {
    employee_id,
    first_name,
    last_name,
    email,
    phone,
    gender,
    qualification,
    date_of_joining,
    designation
  } = req.body;

  const errors: string[] = [];

  // Required fields validation
  if (!employee_id || employee_id.trim() === '') {
    errors.push('Employee ID is required');
  }

  if (!first_name || first_name.trim() === '') {
    errors.push('First name is required');
  }

  if (!last_name || last_name.trim() === '') {
    errors.push('Last name is required');
  }

  if (!email || email.trim() === '') {
    errors.push('Email is required');
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.push('Email format is invalid');
  }

  if (!phone || phone.trim() === '') {
    errors.push('Phone number is required');
  } else if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
    errors.push('Phone number must be 10 digits');
  }

  if (!gender || !['Male', 'Female', 'Other'].includes(gender)) {
    errors.push('Gender must be Male, Female, or Other');
  }

  if (!qualification || qualification.trim() === '') {
    errors.push('Qualification is required');
  }

  if (!date_of_joining) {
    errors.push('Date of joining is required');
  } else if (isNaN(Date.parse(date_of_joining))) {
    errors.push('Date of joining must be a valid date');
  }

  if (!designation || designation.trim() === '') {
    errors.push('Designation is required');
  }

  // Optional field validations
  if (req.body.date_of_birth && isNaN(Date.parse(req.body.date_of_birth))) {
    errors.push('Date of birth must be a valid date');
  }

  if (req.body.salary && (isNaN(req.body.salary) || req.body.salary < 0)) {
    errors.push('Salary must be a positive number');
  }

  if (req.body.experience_years && (isNaN(req.body.experience_years) || req.body.experience_years < 0)) {
    errors.push('Experience years must be a positive number');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }

  next();
};

export const validateTeacherUpdate = (req: Request, res: Response, next: NextFunction) => {
  const errors: string[] = [];

  // Optional validations for update
  if (req.body.email && !/\S+@\S+\.\S+/.test(req.body.email)) {
    errors.push('Email format is invalid');
  }

  if (req.body.phone && !/^\d{10}$/.test(req.body.phone.replace(/\D/g, ''))) {
    errors.push('Phone number must be 10 digits');
  }

  if (req.body.gender && !['Male', 'Female', 'Other'].includes(req.body.gender)) {
    errors.push('Gender must be Male, Female, or Other');
  }

  if (req.body.date_of_birth && isNaN(Date.parse(req.body.date_of_birth))) {
    errors.push('Date of birth must be a valid date');
  }

  if (req.body.date_of_joining && isNaN(Date.parse(req.body.date_of_joining))) {
    errors.push('Date of joining must be a valid date');
  }

  if (req.body.salary && (isNaN(req.body.salary) || req.body.salary < 0)) {
    errors.push('Salary must be a positive number');
  }

  if (req.body.experience_years && (isNaN(req.body.experience_years) || req.body.experience_years < 0)) {
    errors.push('Experience years must be a positive number');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }

  next();
};
