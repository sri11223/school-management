const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'edumanage.db');
const db = new sqlite3.Database(dbPath);

console.log('Migrating database schema...');

// Drop and recreate sections table with correct schema
const migrationQueries = [
  // Drop existing sections table
  'DROP TABLE IF EXISTS sections',
  
  // Recreate sections table with UUID support
  `CREATE TABLE sections (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    section_name TEXT NOT NULL,
    class_teacher_id INTEGER,
    max_students INTEGER DEFAULT 50,
    room_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (class_teacher_id) REFERENCES users(id)
  )`,
  
  // Also update students table to use TEXT for section_id
  'DROP TABLE IF EXISTS students',
  
  `CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admission_number TEXT UNIQUE NOT NULL,
    roll_number TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
    blood_group TEXT,
    religion TEXT,
    section_id TEXT,
    admission_date DATE NOT NULL,
    academic_year TEXT,
    phone TEXT,
    email TEXT,
    address TEXT NOT NULL,
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'Transferred', 'Dropped')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id)
  )`
];

// Execute migration queries sequentially
async function runMigration() {
  for (const query of migrationQueries) {
    await new Promise((resolve, reject) => {
      db.run(query, (err) => {
        if (err) {
          console.error('Migration error:', err);
          reject(err);
        } else {
          console.log('Migration step completed');
          resolve();
        }
      });
    });
  }
}

runMigration()
  .then(() => {
    console.log('Database migration completed successfully!');
    db.close();
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    db.close();
  });
