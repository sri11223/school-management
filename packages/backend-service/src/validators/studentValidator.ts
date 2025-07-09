import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middleware/errorHandler';

export interface StudentValidationData {
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  admission_date: string;
}

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateStudent = (req: Request, res: Response, next: NextFunction): void => {
  const data = req.body;
  const errors: string[] = [];

  // Required fields validation
  if (!data.admission_number || typeof data.admission_number !== 'string') {
    errors.push('Admission number is required and must be a string');
  }

  if (!data.first_name || typeof data.first_name !== 'string') {
    errors.push('First name is required and must be a string');
  }

  if (!data.last_name || typeof data.last_name !== 'string') {
    errors.push('Last name is required and must be a string');
  }

  if (!data.date_of_birth || !isValidDate(data.date_of_birth)) {
    errors.push('Valid date of birth is required (YYYY-MM-DD format)');
  }

  if (!data.gender || !['Male', 'Female', 'Other'].includes(data.gender)) {
    errors.push('Gender is required and must be Male, Female, or Other');
  }

  if (!data.address || typeof data.address !== 'string') {
    errors.push('Address is required and must be a string');
  }

  if (!data.admission_date || !isValidDate(data.admission_date)) {
    errors.push('Valid admission date is required (YYYY-MM-DD format)');
  }

  // Optional fields validation
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.push('Invalid phone number format');
  }

  if (data.category && !['General', 'OBC', 'SC', 'ST', 'EWS'].includes(data.category)) {
    errors.push('Category must be one of: General, OBC, SC, ST, EWS');
  }

  if (data.status && !['Active', 'Inactive', 'Transferred', 'Dropped'].includes(data.status)) {
    errors.push('Status must be one of: Active, Inactive, Transferred, Dropped');
  }

  // Date validation - birth date should be before admission date
  if (data.date_of_birth && data.admission_date) {
    const birthDate = new Date(data.date_of_birth);
    const admissionDate = new Date(data.admission_date);
    
    if (birthDate >= admissionDate) {
      errors.push('Date of birth must be before admission date');
    }

    // Age validation - student should be at least 3 years old
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 3) {
      errors.push('Student must be at least 3 years old');
    }
  }

  // Numeric field validation
  if (data.section_id !== undefined && (!Number.isInteger(data.section_id) || data.section_id < 1)) {
    errors.push('Section ID must be a positive integer');
  }

  if (data.academic_year_id !== undefined && (!Number.isInteger(data.academic_year_id) || data.academic_year_id < 1)) {
    errors.push('Academic year ID must be a positive integer');
  }

  // String length validation
  if (data.first_name && data.first_name.length > 100) {
    errors.push('First name must be less than 100 characters');
  }

  if (data.last_name && data.last_name.length > 100) {
    errors.push('Last name must be less than 100 characters');
  }

  if (data.admission_number && data.admission_number.length > 50) {
    errors.push('Admission number must be less than 50 characters');
  }

  if (data.address && data.address.length > 500) {
    errors.push('Address must be less than 500 characters');
  }

  if (errors.length > 0) {
    throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
  }

  next();
};
