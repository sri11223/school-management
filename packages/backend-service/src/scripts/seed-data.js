const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use the same path as DatabaseManager
const dbPath = path.join(process.cwd(), 'data', 'edumanage.db');
const db = new sqlite3.Database(dbPath);

console.log('Seeding exam types...');

// Insert exam types
const examTypes = [
  { name: 'Unit Test', description: 'Unit test examinations', weightage: 0.2 },
  { name: 'Mid Term', description: 'Mid term examinations', weightage: 0.3 },
  { name: 'Final Exam', description: 'Final examinations', weightage: 0.5 }
];

const insertExamType = db.prepare(`
  INSERT OR IGNORE INTO exam_types (name, description, weightage) 
  VALUES (?, ?, ?)
`);

examTypes.forEach(examType => {
  insertExamType.run(examType.name, examType.description, examType.weightage);
});

insertExamType.finalize();

// Insert some basic subjects
const subjects = [
  { name: 'Mathematics', code: 'MATH', is_core: true },
  { name: 'Science', code: 'SCI', is_core: true },
  { name: 'English', code: 'ENG', is_core: true },
  { name: 'Social Studies', code: 'SST', is_core: true },
  { name: 'Hindi', code: 'HIN', is_core: false },
  { name: 'Physical Education', code: 'PE', is_core: false }
];

const insertSubject = db.prepare(`
  INSERT OR IGNORE INTO subjects (name, code, is_core) 
  VALUES (?, ?, ?)
`);

subjects.forEach(subject => {
  insertSubject.run(subject.name, subject.code, subject.is_core);
});

insertSubject.finalize();

// Insert a test user for marking attendance
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (
    username, email, password_hash, role, first_name, last_name, employee_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertUser.run(
  'teacher1',
  'teacher1@school.com',
  'hashed_password', // In real app, use proper password hashing
  'Class Teacher',
  'John',
  'Doe',
  'T001'
);

insertUser.finalize();

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('Database seeding completed successfully!');
  }
});
