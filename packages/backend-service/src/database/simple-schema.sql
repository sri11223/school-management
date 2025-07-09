-- Simple Schema for Testing
-- This is a minimal schema to test the basic functionality

-- Schools Table
CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Academic Years
CREATE TABLE IF NOT EXISTS academic_years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Classes/Standards
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    section TEXT,
    academic_year_id INTEGER,
    max_students INTEGER DEFAULT 50,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_number TEXT UNIQUE NOT NULL,
    roll_number TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
    phone TEXT,
    email TEXT,
    address TEXT NOT NULL,
    class_id INTEGER,
    admission_date DATE NOT NULL,
    academic_year_id INTEGER,
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'Transferred', 'Dropped')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- Parents/Guardians
CREATE TABLE IF NOT EXISTS parents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    relationship TEXT CHECK(relationship IN ('Father', 'Mother', 'Guardian', 'Other')),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    is_primary_contact BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Insert default data
INSERT OR IGNORE INTO academic_years (year_name, start_date, end_date, is_current) 
VALUES ('2024-25', '2024-04-01', '2025-03-31', TRUE);

INSERT OR IGNORE INTO schools (name, code, address, phone, email) 
VALUES ('Demo Rural School', 'DRS001', '123 School Street, Rural Area', '9876543210', 'demo@school.com');
