-- EduManage Pro Database Schema
-- SQLite Database for Offline-first School Management

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Schools Table
CREATE TABLE schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    principal_name TEXT,
    established_date DATE,
    board_type TEXT CHECK(board_type IN ('CBSE', 'ICSE', 'State Board', 'International')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Academic Years
CREATE TABLE academic_years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year_name TEXT NOT NULL, -- "2023-24"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Classes/Standards
CREATE TABLE classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, -- "Class 1", "Class 2", etc.
    section TEXT, -- "A", "B", "C"
    academic_year_id INTEGER,
    class_teacher_id INTEGER,
    max_students INTEGER DEFAULT 50,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (class_teacher_id) REFERENCES teachers(id)
);

-- ============================================================================
-- STUDENTS MANAGEMENT
-- ============================================================================

-- Students Table
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_number TEXT UNIQUE NOT NULL,
    roll_number TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
    blood_group TEXT,
    religion TEXT,
    caste TEXT,
    category TEXT CHECK(category IN ('General', 'OBC', 'SC', 'ST', 'EWS')),
    
    -- Contact Information
    phone TEXT,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT,
    state TEXT,
    pincode TEXT,
    
    -- Academic Information
    class_id INTEGER,
    admission_date DATE NOT NULL,
    academic_year_id INTEGER,
    previous_school TEXT,
    
    -- Medical Information
    medical_conditions TEXT,
    allergies TEXT,
    emergency_contact TEXT,
    
    -- Documents
    photo_path TEXT,
    birth_certificate_path TEXT,
    aadhar_number TEXT,
    
    -- Status
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'Transferred', 'Dropped')),
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- Parents/Guardians
CREATE TABLE parents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    relationship TEXT CHECK(relationship IN ('Father', 'Mother', 'Guardian', 'Other')),
    name TEXT NOT NULL,
    occupation TEXT,
    education TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    annual_income DECIMAL(10,2),
    is_primary_contact BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ============================================================================
-- TEACHERS & STAFF MANAGEMENT
-- ============================================================================

-- Teachers Table
CREATE TABLE teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
    
    -- Contact Information
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    emergency_contact TEXT,
    
    -- Professional Information
    qualification TEXT NOT NULL,
    experience_years INTEGER DEFAULT 0,
    joining_date DATE NOT NULL,
    designation TEXT, -- "Primary Teacher", "Subject Teacher", "Principal"
    department TEXT,
    subjects_taught TEXT, -- JSON array or comma-separated
    
    -- Employment Details
    employment_type TEXT CHECK(employment_type IN ('Permanent', 'Contract', 'Part-time')),
    salary DECIMAL(10,2),
    bank_account TEXT,
    pan_number TEXT,
    aadhar_number TEXT,
    
    -- Documents
    photo_path TEXT,
    resume_path TEXT,
    
    -- Status
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'Resigned', 'Terminated')),
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SUBJECTS & CURRICULUM
-- ============================================================================

-- Subjects
CREATE TABLE subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    class_level INTEGER, -- Which class this subject is for
    is_mandatory BOOLEAN DEFAULT TRUE,
    max_marks INTEGER DEFAULT 100,
    pass_marks INTEGER DEFAULT 35,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Class-Subject Mapping
CREATE TABLE class_subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    teacher_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- ============================================================================
-- EXAMINATIONS & ASSESSMENTS
-- ============================================================================

-- Exam Types
CREATE TABLE exam_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, -- "Unit Test", "Mid-term", "Final Exam"
    description TEXT,
    weightage DECIMAL(5,2), -- Percentage weightage in final grade
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Exams
CREATE TABLE exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    exam_type_id INTEGER,
    academic_year_id INTEGER,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    class_id INTEGER,
    created_by INTEGER, -- Teacher who created the exam
    instructions TEXT,
    status TEXT DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'Ongoing', 'Completed', 'Cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_type_id) REFERENCES exam_types(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (created_by) REFERENCES teachers(id)
);

-- Exam Results
CREATE TABLE exam_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    max_marks DECIMAL(5,2) NOT NULL,
    grade TEXT,
    remarks TEXT,
    is_absent BOOLEAN DEFAULT FALSE,
    entered_by INTEGER, -- Teacher who entered marks
    entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (entered_by) REFERENCES teachers(id)
);

-- ============================================================================
-- ATTENDANCE MANAGEMENT
-- ============================================================================

-- Daily Attendance
CREATE TABLE attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    attendance_date DATE NOT NULL,
    status TEXT CHECK(status IN ('Present', 'Absent', 'Late', 'Half-day')) DEFAULT 'Present',
    remarks TEXT,
    marked_by INTEGER, -- Teacher who marked attendance
    marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (marked_by) REFERENCES teachers(id),
    UNIQUE(student_id, attendance_date)
);

-- Teacher Attendance
CREATE TABLE teacher_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    status TEXT CHECK(status IN ('Present', 'Absent', 'Half-day', 'Leave')) DEFAULT 'Present',
    remarks TEXT,
    marked_by INTEGER,
    marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (marked_by) REFERENCES teachers(id),
    UNIQUE(teacher_id, attendance_date)
);

-- ============================================================================
-- FEES MANAGEMENT
-- ============================================================================

-- Fee Categories
CREATE TABLE fee_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, -- "Tuition Fee", "Transport Fee", "Exam Fee"
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fee Structure
CREATE TABLE fee_structure (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    fee_category_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    academic_year_id INTEGER NOT NULL,
    due_date INTEGER, -- Day of month when due
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- Fee Payments
CREATE TABLE fee_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    fee_category_id INTEGER NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('Cash', 'Cheque', 'Online', 'UPI', 'Card')),
    transaction_id TEXT,
    receipt_number TEXT UNIQUE,
    academic_year_id INTEGER,
    month INTEGER, -- For monthly fees
    year INTEGER,
    collected_by INTEGER, -- Staff who collected payment
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (collected_by) REFERENCES teachers(id)
);

-- ============================================================================
-- TIMETABLE MANAGEMENT
-- ============================================================================

-- Time Slots
CREATE TABLE time_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, -- "Period 1", "Break", "Period 2"
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_type TEXT CHECK(slot_type IN ('Academic', 'Break', 'Lunch', 'Assembly')) DEFAULT 'Academic',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Timetable
CREATE TABLE timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    subject_id INTEGER,
    teacher_id INTEGER,
    time_slot_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL, -- 1=Monday, 2=Tuesday, etc.
    academic_year_id INTEGER,
    room_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (time_slot_id) REFERENCES time_slots(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- ============================================================================
-- COMMUNICATION & NOTIFICATIONS
-- ============================================================================

-- Announcements
CREATE TABLE announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_audience TEXT CHECK(target_audience IN ('All', 'Students', 'Teachers', 'Parents', 'Specific Class')),
    class_id INTEGER, -- If target is specific class
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
    created_by INTEGER NOT NULL,
    publish_date DATE,
    expiry_date DATE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (created_by) REFERENCES teachers(id)
);

-- WhatsApp Messages Log
CREATE TABLE whatsapp_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_phone TEXT NOT NULL,
    recipient_name TEXT,
    message_type TEXT CHECK(message_type IN ('Attendance Alert', 'Fee Reminder', 'Exam Result', 'Announcement', 'Birthday Wish')),
    message_content TEXT NOT NULL,
    status TEXT CHECK(status IN ('Pending', 'Sent', 'Delivered', 'Failed')) DEFAULT 'Pending',
    sent_at DATETIME,
    delivered_at DATETIME,
    error_message TEXT,
    student_id INTEGER,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (created_by) REFERENCES teachers(id)
);

-- ============================================================================
-- SYSTEM TABLES
-- ============================================================================

-- Users & Authentication
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('Super Admin', 'Admin', 'Teacher', 'Staff')) NOT NULL,
    teacher_id INTEGER, -- Link to teacher if user is a teacher
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- App Settings
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    category TEXT,
    updated_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- AI Generated Content Log
CREATE TABLE ai_content_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT CHECK(content_type IN ('Exam Question', 'Student Report', 'Lesson Plan', 'Performance Analysis')),
    prompt_used TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    class_id INTEGER,
    subject_id INTEGER,
    created_by INTEGER NOT NULL,
    ai_model TEXT DEFAULT 'Gemini',
    tokens_used INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Student indexes
CREATE INDEX idx_students_admission_number ON students(admission_number);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_status ON students(status);

-- Attendance indexes
CREATE INDEX idx_attendance_student_date ON attendance(student_id, attendance_date);
CREATE INDEX idx_attendance_class_date ON attendance(class_id, attendance_date);

-- Exam results indexes
CREATE INDEX idx_exam_results_student ON exam_results(student_id);
CREATE INDEX idx_exam_results_exam ON exam_results(exam_id);

-- Fee payments indexes
CREATE INDEX idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX idx_fee_payments_date ON fee_payments(payment_date);

-- WhatsApp messages indexes
CREATE INDEX idx_whatsapp_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_sent_at ON whatsapp_messages(sent_at);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert default school
INSERT INTO schools (name, code, address, phone, principal_name, board_type) 
VALUES ('Demo Rural School', 'DRS001', 'Village Main Road, Rural Area', '9876543210', 'Principal Name', 'State Board');

-- Insert current academic year
INSERT INTO academic_years (year_name, start_date, end_date, is_current) 
VALUES ('2024-25', '2024-04-01', '2025-03-31', TRUE);

-- Insert basic subjects
INSERT INTO subjects (name, code, class_level) VALUES 
('Mathematics', 'MATH', 1),
('English', 'ENG', 1),
('Science', 'SCI', 1),
('Social Studies', 'SST', 1),
('Hindi', 'HIN', 1);

-- Insert fee categories
INSERT INTO fee_categories (name, description) VALUES 
('Tuition Fee', 'Monthly tuition fee'),
('Admission Fee', 'One-time admission fee'),
('Exam Fee', 'Examination fee per semester'),
('Transport Fee', 'Monthly transport fee');

-- Insert time slots
INSERT INTO time_slots (name, start_time, end_time, slot_type) VALUES 
('Morning Assembly', '09:00:00', '09:15:00', 'Assembly'),
('Period 1', '09:15:00', '10:00:00', 'Academic'),
('Period 2', '10:00:00', '10:45:00', 'Academic'),
('Break', '10:45:00', '11:00:00', 'Break'),
('Period 3', '11:00:00', '11:45:00', 'Academic'),
('Period 4', '11:45:00', '12:30:00', 'Academic'),
('Lunch Break', '12:30:00', '01:15:00', 'Lunch'),
('Period 5', '01:15:00', '02:00:00', 'Academic'),
('Period 6', '02:00:00', '02:45:00', 'Academic');

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@school.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Admin');

-- Insert basic settings
INSERT INTO settings (key, value, description, category) VALUES 
('school_name', 'Demo Rural School', 'Name of the school', 'General'),
('academic_year', '2024-25', 'Current academic year', 'Academic'),
('attendance_start_time', '09:00', 'When to start marking attendance', 'Attendance'),
('whatsapp_enabled', 'true', 'Enable WhatsApp integration', 'Communication'),
('ai_enabled', 'true', 'Enable AI features', 'AI'),
('backup_frequency', 'daily', 'How often to backup data', 'System');
