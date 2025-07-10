-- Create Classes Table
CREATE TABLE classes (
    uuid TEXT PRIMARY KEY,
    numeric_level INTEGER NOT NULL,
    academic_year TEXT NOT NULL,
    number_of_students INTEGER NOT NULL,
    number_of_sections INTEGER NOT NULL
);

-- Create Sections Table
CREATE TABLE sections (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    student_count INTEGER NOT NULL,
    class_uuid TEXT NOT NULL,
    FOREIGN KEY (class_uuid) REFERENCES classes (uuid) ON DELETE CASCADE
);

-- Create Students Table
CREATE TABLE students (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    section_uuid TEXT NOT NULL,
    FOREIGN KEY (section_uuid) REFERENCES sections (uuid) ON DELETE CASCADE
);

-- Create Attendance Table
CREATE TABLE attendance (
    uuid TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    student_uuid TEXT NOT NULL,
    section_uuid TEXT NOT NULL,
    FOREIGN KEY (student_uuid) REFERENCES students (uuid) ON DELETE CASCADE,
    FOREIGN KEY (section_uuid) REFERENCES sections (uuid) ON DELETE CASCADE
);

-- Create Exams Table
CREATE TABLE exams (
    uuid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    section_uuid TEXT NOT NULL,
    FOREIGN KEY (section_uuid) REFERENCES sections (uuid) ON DELETE CASCADE
);

-- Create Exam Results Table
CREATE TABLE exam_results (
    uuid TEXT PRIMARY KEY,
    marks INTEGER NOT NULL,
    student_uuid TEXT NOT NULL,
    exam_uuid TEXT NOT NULL,
    FOREIGN KEY (student_uuid) REFERENCES students (uuid) ON DELETE CASCADE,
    FOREIGN KEY (exam_uuid) REFERENCES exams (uuid) ON DELETE CASCADE
);
