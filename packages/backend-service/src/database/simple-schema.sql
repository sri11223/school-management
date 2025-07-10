-- Simplified EduManage Pro Database Schema
-- Designed to match API endpoints exactly

-- Academic Years
CREATE TABLE IF NOT EXISTS academic_years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year_name TEXT NOT NULL, -- "2024-25"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users (Teachers, Admins, etc.)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    employee_id TEXT UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY, -- UUID as string
    name TEXT NOT NULL,
    numeric_level INTEGER NOT NULL,
    academic_year TEXT DEFAULT '2024-25',
    strength INTEGER DEFAULT 0,
    number_of_students INTEGER DEFAULT 0,
    number_of_sections INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sections
CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id TEXT NOT NULL,
    section_name TEXT NOT NULL,
    class_teacher_id INTEGER,
    max_students INTEGER DEFAULT 50,
    room_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (class_teacher_id) REFERENCES users(id)
);

-- Students
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
    address TEXT,
    section_id INTEGER,
    admission_date DATE NOT NULL,
    academic_year TEXT DEFAULT '2024-25',
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id)
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    is_core BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Exam Types
CREATE TABLE IF NOT EXISTS exam_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Exams
CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject_id INTEGER,
    class_id TEXT NOT NULL,
    subject_name TEXT, -- Denormalized for easier queries
    exam_type TEXT DEFAULT 'Test',
    exam_date DATE NOT NULL, -- Using exam_date to match frontend
    start_time TIME,
    end_time TIME,
    total_marks INTEGER DEFAULT 100,
    pass_marks INTEGER DEFAULT 40,
    instructions TEXT,
    status TEXT DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'Ongoing', 'Completed', 'Cancelled')),
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Exam Results
CREATE TABLE IF NOT EXISTS exam_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    marks_obtained REAL NOT NULL,
    percentage REAL NOT NULL,
    grade TEXT,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    class_id TEXT, -- Can be derived from student but stored for easier queries
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Late', 'Half Day', 'Excused')),
    check_in_time TIME,
    check_out_time TIME,
    remarks TEXT,
    marked_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (marked_by) REFERENCES users(id)
);

-- Insert default data
INSERT OR IGNORE INTO academic_years (year_name, start_date, end_date, is_current) 
VALUES ('2024-25', '2024-04-01', '2025-03-31', TRUE);

INSERT OR IGNORE INTO users (username, email, password_hash, role, first_name, last_name) 
VALUES ('admin', 'admin@school.com', '$2b$10$hash', 'Admin', 'System', 'Administrator');

INSERT OR IGNORE INTO subjects (name, code, is_core) VALUES 
('Mathematics', 'MATH', TRUE),
('English', 'ENG', TRUE),
('Science', 'SCI', TRUE),
('Social Studies', 'SST', TRUE),
('Hindi', 'HIN', TRUE);

INSERT OR IGNORE INTO exam_types (name, description) VALUES 
('Unit Test', 'Monthly unit test'),
('Mid Term', 'Mid-term examination'),
('Final', 'Final examination'),
('Quiz', 'Quick assessment');

-- Create some sample classes (using UUIDs)
INSERT OR IGNORE INTO classes (id, name, numeric_level, number_of_students, number_of_sections) VALUES 
('class-1-uuid', 'Class 1', 1, 30, 1),
('class-2-uuid', 'Class 2', 2, 32, 1),
('class-3-uuid', 'Class 3', 3, 35, 2),
('class-4-uuid', 'Class 4', 4, 38, 2),
('class-5-uuid', 'Class 5', 5, 40, 2);

-- Create sections for classes
INSERT OR IGNORE INTO sections (class_id, section_name) VALUES 
('class-1-uuid', 'A'),
('class-2-uuid', 'A'),
('class-3-uuid', 'A'),
('class-3-uuid', 'B'),
('class-4-uuid', 'A'),
('class-4-uuid', 'B'),
('class-5-uuid', 'A'),
('class-5-uuid', 'B');

-- Create some sample students
INSERT OR IGNORE INTO students (admission_number, roll_number, first_name, last_name, date_of_birth, gender, section_id, admission_date) VALUES 
('ADM001', '1', 'Aarav', 'Sharma', '2018-05-15', 'Male', 1, '2024-04-01'),
('ADM002', '2', 'Ananya', 'Patel', '2018-06-20', 'Female', 1, '2024-04-01'),
('ADM003', '3', 'Arjun', 'Kumar', '2018-07-10', 'Male', 1, '2024-04-01'),
('ADM004', '1', 'Diya', 'Singh', '2017-08-15', 'Female', 2, '2024-04-01'),
('ADM005', '2', 'Karan', 'Gupta', '2017-09-25', 'Male', 2, '2024-04-01');

-- Create some sample exams
INSERT OR IGNORE INTO exams (name, subject_id, class_id, subject_name, exam_date, total_marks, created_by) VALUES 
('Math Unit Test 1', 1, 'class-1-uuid', 'Mathematics', '2025-07-15', 100, 1),
('English Unit Test 1', 2, 'class-1-uuid', 'English', '2025-07-16', 100, 1),
('Science Mid Term', 3, 'class-2-uuid', 'Science', '2025-07-20', 100, 1);

-- Create some sample exam results
INSERT OR IGNORE INTO exam_results (exam_id, student_id, marks_obtained, percentage, grade) VALUES 
(1, 1, 85, 85.0, 'A'),
(1, 2, 92, 92.0, 'A+'),
(1, 3, 78, 78.0, 'B+'),
(2, 1, 88, 88.0, 'A'),
(2, 2, 95, 95.0, 'A+');

-- Create some sample attendance records
INSERT OR IGNORE INTO attendance_records (student_id, class_id, date, status, marked_by) VALUES 
(1, 'class-1-uuid', '2025-07-10', 'Present', 1),
(2, 'class-1-uuid', '2025-07-10', 'Present', 1),
(3, 'class-1-uuid', '2025-07-10', 'Absent', 1),
(4, 'class-2-uuid', '2025-07-10', 'Present', 1),
(5, 'class-2-uuid', '2025-07-10', 'Late', 1);
