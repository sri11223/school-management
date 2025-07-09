-- EduManage Pro - Complete Database Schema
-- AI-Powered School Management System

-- ============================================================================
-- CORE SCHOOL SETUP
-- ============================================================================

-- Schools Configuration
CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    principal_name TEXT,
    established_date DATE,
    board_type TEXT CHECK(board_type IN ('CBSE', 'ICSE', 'State Board', 'International')),
    logo_path TEXT,
    language_preference TEXT DEFAULT 'english',
    whatsapp_number TEXT,
    ai_enabled BOOLEAN DEFAULT TRUE,
    license_type TEXT CHECK(license_type IN ('Basic', 'Standard', 'Premium')),
    license_expiry DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Academic Years
CREATE TABLE IF NOT EXISTS academic_years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year_name TEXT NOT NULL, -- "2024-25"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- USER MANAGEMENT & AUTHENTICATION
-- ============================================================================

-- Users (Teachers, Admins, Principals)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('Super Admin', 'Principal', 'Vice Principal', 'Class Teacher', 'Subject Teacher', 'Admin Staff')) NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    employee_id TEXT UNIQUE,
    department TEXT,
    subjects_taught TEXT, -- JSON array
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Permissions
CREATE TABLE IF NOT EXISTS user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    permission TEXT NOT NULL, -- 'create_students', 'edit_marks', 'send_whatsapp', etc.
    granted_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id)
);

-- ============================================================================
-- ACADEMIC STRUCTURE
-- ============================================================================

-- Classes (Class 1, Class 2, etc.)
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, -- "Class 1", "Class 2", etc.
    numeric_level INTEGER, -- 1, 2, 3... for sorting
    academic_year_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- Sections (A, B, C within each class)
CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    section_name TEXT NOT NULL, -- "A", "B", "C"
    class_teacher_id INTEGER,
    max_students INTEGER DEFAULT 50,
    room_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (class_teacher_id) REFERENCES users(id)
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_telugu TEXT, -- Telugu translation
    code TEXT UNIQUE NOT NULL, -- "MATH", "SCI", "ENG"
    description TEXT,
    is_core BOOLEAN DEFAULT TRUE, -- Core vs Optional
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Class Subjects (Which subjects are taught in which class)
CREATE TABLE IF NOT EXISTS class_subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    teacher_id INTEGER,
    periods_per_week INTEGER DEFAULT 5,
    max_marks INTEGER DEFAULT 100,
    pass_marks INTEGER DEFAULT 35,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id),
    UNIQUE(class_id, subject_id)
);

-- ============================================================================
-- STUDENT MANAGEMENT
-- ============================================================================

-- Students
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_number TEXT UNIQUE NOT NULL,
    roll_number TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    first_name_telugu TEXT,
    last_name_telugu TEXT,
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
    address_telugu TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    
    -- Academic Information
    section_id INTEGER,
    admission_date DATE NOT NULL,
    academic_year_id INTEGER,
    previous_school TEXT,
    
    -- AI Learning Profile
    learning_style TEXT, -- 'Visual', 'Auditory', 'Kinesthetic'
    ai_performance_score REAL DEFAULT 0.0,
    ai_risk_level TEXT DEFAULT 'Low', -- 'Low', 'Medium', 'High'
    ai_recommendations TEXT, -- JSON
    
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
    
    FOREIGN KEY (section_id) REFERENCES sections(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- Parents/Guardians
CREATE TABLE IF NOT EXISTS parents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    relationship TEXT CHECK(relationship IN ('Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Other')),
    name TEXT NOT NULL,
    name_telugu TEXT,
    occupation TEXT,
    education TEXT,
    phone TEXT NOT NULL,
    whatsapp_number TEXT,
    email TEXT,
    address TEXT,
    annual_income DECIMAL(10,2),
    is_primary_contact BOOLEAN DEFAULT FALSE,
    whatsapp_enabled BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ============================================================================
-- EXAMINATION SYSTEM
-- ============================================================================

-- Exam Types
CREATE TABLE IF NOT EXISTS exam_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, -- "Unit Test", "Mid Term", "Final Exam", "Monthly Test"
    name_telugu TEXT,
    description TEXT,
    weightage REAL DEFAULT 1.0, -- For final grade calculation
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Exams
CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_telugu TEXT,
    exam_type_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    academic_year_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_by INTEGER NOT NULL,
    ai_generated BOOLEAN DEFAULT FALSE,
    instructions TEXT,
    status TEXT DEFAULT 'Planned' CHECK(status IN ('Planned', 'Ongoing', 'Completed', 'Cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_type_id) REFERENCES exam_types(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Exam Subjects (Which subjects are included in each exam)
CREATE TABLE IF NOT EXISTS exam_subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    max_marks INTEGER NOT NULL,
    pass_marks INTEGER NOT NULL,
    question_paper_path TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Student Marks
CREATE TABLE IF NOT EXISTS student_marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    exam_subject_id INTEGER NOT NULL,
    marks_obtained REAL NOT NULL,
    grade TEXT, -- A+, A, B+, B, C, D, F
    remarks TEXT,
    entered_by INTEGER NOT NULL,
    verified_by INTEGER,
    is_absent BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (exam_subject_id) REFERENCES exam_subjects(id),
    FOREIGN KEY (entered_by) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    UNIQUE(student_id, exam_subject_id)
);

-- ============================================================================
-- ATTENDANCE MANAGEMENT
-- ============================================================================

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    attendance_date DATE NOT NULL,
    status TEXT CHECK(status IN ('Present', 'Absent', 'Late', 'Sick Leave', 'Permission')) NOT NULL,
    marked_by INTEGER NOT NULL,
    remarks TEXT,
    marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (section_id) REFERENCES sections(id),
    FOREIGN KEY (marked_by) REFERENCES users(id),
    UNIQUE(student_id, attendance_date)
);

-- Attendance Summary (Monthly aggregation)
CREATE TABLE IF NOT EXISTS attendance_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_days INTEGER NOT NULL,
    present_days INTEGER NOT NULL,
    absent_days INTEGER NOT NULL,
    late_days INTEGER DEFAULT 0,
    percentage REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE(student_id, month, year)
);

-- ============================================================================
-- FINANCIAL MANAGEMENT
-- ============================================================================

-- Fee Categories
CREATE TABLE IF NOT EXISTS fee_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, -- "Tuition", "Transport", "Library", "Lab"
    name_telugu TEXT,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fee Structure
CREATE TABLE IF NOT EXISTS fee_structure (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    fee_category_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    academic_year_id INTEGER NOT NULL,
    due_date_month INTEGER, -- 1-12
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (fee_category_id) REFERENCES fee_categories(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- Fee Payments
CREATE TABLE IF NOT EXISTS fee_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    fee_structure_id INTEGER NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode TEXT CHECK(payment_mode IN ('Cash', 'Online', 'Cheque', 'DD')),
    transaction_id TEXT,
    received_by INTEGER NOT NULL,
    receipt_number TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (fee_structure_id) REFERENCES fee_structure(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- ============================================================================
-- AI FEATURES & ANALYTICS
-- ============================================================================

-- AI Generated Content
CREATE TABLE IF NOT EXISTS ai_generated_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL, -- 'exam_questions', 'assignments', 'reports'
    class_id INTEGER,
    subject_id INTEGER,
    prompt_used TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    language TEXT DEFAULT 'english',
    generated_by INTEGER NOT NULL,
    ai_model TEXT DEFAULT 'gemini-pro',
    tokens_used INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- AI Predictions
CREATE TABLE IF NOT EXISTS ai_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    prediction_type TEXT NOT NULL, -- 'performance', 'dropout_risk', 'career_suggestion'
    predicted_value TEXT NOT NULL, -- JSON data
    confidence_score REAL NOT NULL, -- 0.0 to 1.0
    factors_considered TEXT, -- JSON
    valid_until DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Performance Analytics
CREATE TABLE IF NOT EXISTS performance_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject_id INTEGER,
    analysis_type TEXT NOT NULL, -- 'subject_strength', 'improvement_area', 'learning_pattern'
    score REAL NOT NULL,
    trend TEXT, -- 'Improving', 'Declining', 'Stable'
    recommendations TEXT, -- JSON
    analysis_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- AI Tutoring Sessions
CREATE TABLE IF NOT EXISTS ai_tutoring_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    subject TEXT,
    language TEXT DEFAULT 'english',
    session_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    response_quality_rating INTEGER, -- 1-5 scale, can be added later
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- AI Learning Paths
CREATE TABLE IF NOT EXISTS ai_learning_paths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject TEXT,
    learning_path_data TEXT NOT NULL, -- JSON containing the full learning path
    progress_percentage REAL DEFAULT 0.0,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    valid_until DATE,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- AI Study Materials
CREATE TABLE IF NOT EXISTS ai_study_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    subject TEXT NOT NULL,
    class_level INTEGER NOT NULL,
    material_type TEXT NOT NULL, -- 'summary', 'notes', 'practice_questions', 'flashcards'
    content_data TEXT NOT NULL, -- JSON containing the material content
    language TEXT DEFAULT 'english',
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0.0 -- Average rating from users
);

-- ============================================================================
-- WHATSAPP INTEGRATION
-- ============================================================================

-- WhatsApp Templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    template_type TEXT NOT NULL, -- 'result_notification', 'congratulations', 'reminder', 'celebration'
    message_template TEXT NOT NULL, -- Template with placeholders
    message_template_telugu TEXT,
    variables TEXT, -- JSON array of variables like [student_name], [marks], etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp Messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_phone TEXT NOT NULL,
    recipient_name TEXT,
    message_content TEXT NOT NULL,
    template_id INTEGER,
    message_type TEXT NOT NULL, -- 'individual', 'bulk', 'automated'
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    scheduled_time DATETIME,
    sent_time DATETIME,
    delivery_time DATETIME,
    read_time DATETIME,
    error_message TEXT,
    sent_by INTEGER,
    student_id INTEGER, -- If message is related to a specific student
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES whatsapp_templates(id),
    FOREIGN KEY (sent_by) REFERENCES users(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- WhatsApp Automation Rules
CREATE TABLE IF NOT EXISTS whatsapp_automation_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name TEXT NOT NULL,
    trigger_event TEXT NOT NULL, -- 'exam_completed', 'marks_entered', 'birthday', 'fee_due'
    template_id INTEGER NOT NULL,
    conditions TEXT, -- JSON conditions
    target_audience TEXT, -- 'parents', 'students', 'teachers'
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES whatsapp_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type TEXT NOT NULL, -- 'string', 'number', 'boolean', 'json'
    category TEXT NOT NULL, -- 'general', 'ai', 'whatsapp', 'academic'
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Can be accessed by frontend
    updated_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
    table_name TEXT NOT NULL,
    record_id INTEGER,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- File Uploads
CREATE TABLE IF NOT EXISTS file_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    upload_type TEXT NOT NULL, -- 'student_photo', 'document', 'bulk_import', 'question_paper'
    related_table TEXT,
    related_id INTEGER,
    uploaded_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Insert Default Academic Year
INSERT OR IGNORE INTO academic_years (year_name, start_date, end_date, is_current) 
VALUES ('2024-25', '2024-04-01', '2025-03-31', TRUE);

-- Insert Default Admin User (Password: admin123)
INSERT OR IGNORE INTO users (username, email, password_hash, role, first_name, last_name, employee_id) 
VALUES ('admin', 'admin@school.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Admin', 'System', 'Administrator', 'EMP001');

-- Insert Default School
INSERT OR IGNORE INTO schools (name, code, address, phone, email, principal_name, board_type, license_type) 
VALUES ('Demo Rural School', 'DRS001', '123 School Street, Rural Area', '9876543210', 'demo@school.com', 'Principal Name', 'State Board', 'Premium');

-- Insert Core Subjects
INSERT OR IGNORE INTO subjects (name, name_telugu, code, is_core) VALUES 
('Mathematics', 'గణితం', 'MATH', TRUE),
('Science', 'సైన్స్', 'SCI', TRUE),
('English', 'ఇంగ్లీష్', 'ENG', TRUE),
('Telugu', 'తెలుగు', 'TEL', TRUE),
('Social Studies', 'సామాజిక అధ్యయనాలు', 'SOC', TRUE),
('Hindi', 'హిందీ', 'HIN', FALSE),
('Physical Education', 'శారీరక విద్య', 'PHY', FALSE);

-- Insert Default Classes
INSERT OR IGNORE INTO classes (name, numeric_level, academic_year_id) VALUES 
('Class 1', 1, 1),
('Class 2', 2, 1),
('Class 3', 3, 1),
('Class 4', 4, 1),
('Class 5', 5, 1),
('Class 6', 6, 1),
('Class 7', 7, 1),
('Class 8', 8, 1),
('Class 9', 9, 1),
('Class 10', 10, 1);

-- Insert Exam Types
INSERT OR IGNORE INTO exam_types (name, name_telugu, weightage) VALUES 
('Unit Test', 'యూనిట్ టెస్ట్', 0.2),
('Mid Term', 'మిడ్ టర్మ్', 0.3),
('Final Exam', 'ఫైనల్ పరీక్ష', 0.5);

-- Insert Fee Categories
INSERT OR IGNORE INTO fee_categories (name, name_telugu, is_mandatory) VALUES 
('Tuition Fee', 'ట్యూషన్ ఫీ', TRUE),
('Development Fee', 'అభివృద్ధి ఫీ', TRUE),
('Transport Fee', 'రవాణా ఫీ', FALSE),
('Library Fee', 'లైబ్రరీ ఫీ', FALSE);

-- Insert WhatsApp Templates
INSERT OR IGNORE INTO whatsapp_templates (name, template_type, message_template, message_template_telugu) VALUES 
('Exam Result', 'result_notification', 
 '🎉 Congratulations! {student_name} scored {marks}/{total_marks} in {subject} exam. Grade: {grade}. Well done! - {school_name}',
 '🎉 అభినందనలు! {student_name} {subject} పరీక్షలో {marks}/{total_marks} మార్కులు సాధించారు. గ్రేడ్: {grade}. చాలా బాగుంది! - {school_name}'),
 
('Birthday Wish', 'celebration',
 '🎂 Happy Birthday {student_name}! Wishing you a wonderful year ahead filled with success and happiness. Best wishes from {school_name} family!',
 '🎂 {student_name} కు పుట్టినరోజు శుభాకాంక్షలు! మీకు విజయాలు మరియు ఆనందంతో కూడిన అద్భుతమైన సంవత్సరం ఉండాలని కోరుకుంటున్నాము. {school_name} కుటుంబం నుండి శుభాకాంక్షలు!'),

('Fee Reminder', 'reminder',
 'Dear Parent, This is a reminder that the fee payment for {student_name} (Class {class_name}) is due on {due_date}. Amount: ₹{amount}. Please make the payment at your earliest convenience. - {school_name}',
 'ప్రియ తల్లిదండ్రులు, {student_name} (క్లాస్ {class_name}) కి ఫీ చెల్లింపు {due_date} నాటికి చేయవలసి ఉంది. మొత్తం: ₹{amount}. దయచేసి వీలైనంత త్వరగా చెల్లించండి. - {school_name}');

-- Insert System Settings
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES 
('school_name', 'Demo Rural School', 'string', 'general', 'School name', TRUE),
('academic_year', '2024-25', 'string', 'academic', 'Current academic year', TRUE),
('default_language', 'english', 'string', 'general', 'Default system language', TRUE),
('ai_enabled', 'true', 'boolean', 'ai', 'Enable AI features', FALSE),
('whatsapp_enabled', 'true', 'boolean', 'whatsapp', 'Enable WhatsApp integration', FALSE),
('gemini_api_key', '', 'string', 'ai', 'Google Gemini API key', FALSE),
('whatsapp_api_token', '', 'string', 'whatsapp', 'WhatsApp API token', FALSE),
('attendance_start_time', '09:00', 'string', 'academic', 'When to start marking attendance', TRUE),
('grade_scale', '{"A+": 95, "A": 85, "B+": 75, "B": 65, "C": 50, "D": 35, "F": 0}', 'json', 'academic', 'Grading scale', TRUE);
