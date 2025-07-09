# EduManage Pro API Testing Guide

## Quick Setup
1. Import the `EduManage-Pro-API-Collection.postman_collection.json` file into Postman
2. The collection includes environment variables:
   - `baseUrl`: http://localhost:3001
   - `authToken`: (will be set after login)

## Test Sequence

### 1. Basic Health Checks
```bash
# Health check
GET http://localhost:3001/api/health

# General health
GET http://localhost:3001/health
```

### 2. Student Management Testing
```bash
# Get all students (should return empty initially)
GET http://localhost:3001/api/students

# Create a student
POST http://localhost:3001/api/students
Content-Type: application/json
{
  "admission_number": "2024001",
  "first_name": "Ravi",
  "last_name": "Kumar",
  "date_of_birth": "2010-05-15",
  "gender": "Male",
  "address": "Village Road, Rural Area",
  "admission_date": "2024-04-01",
  "academic_year_id": 1,
  "category": "General",
  "phone": "9876543210",
  "email": "ravi.kumar@student.com"
}

# Get student by ID
GET http://localhost:3001/api/students/1

# Update student
PUT http://localhost:3001/api/students/1
Content-Type: application/json
{
  "phone": "9876543211",
  "email": "ravi.updated@student.com"
}

# Add parent
POST http://localhost:3001/api/students/1/parents
Content-Type: application/json
{
  "relationship": "Father",
  "name": "Suresh Kumar",
  "phone": "9876543210",
  "occupation": "Farmer",
  "education": "High School",
  "is_primary_contact": true
}
```

### 3. Authentication Testing
```bash
# Login with default admin
POST http://localhost:3001/api/auth/login
Content-Type: application/json
{
  "username": "admin",
  "password": "admin123"
}

# Get profile (use token from login response)
GET http://localhost:3001/api/auth/profile
Authorization: Bearer YOUR_TOKEN_HERE
```

### 4. Classes and Academic Structure
```bash
# Get all classes
GET http://localhost:3001/api/classes

# Create a new class
POST http://localhost:3001/api/classes
Content-Type: application/json
{
  "name": "Class 11",
  "numeric_level": 11,
  "academic_year_id": 1
}
```

### 5. Attendance Management
```bash
# Mark attendance
POST http://localhost:3001/api/attendance
Content-Type: application/json
{
  "section_id": 1,
  "date": "2024-07-09",
  "attendance_records": [
    {
      "student_id": 1,
      "status": "Present"
    }
  ]
}

# Get attendance records
GET http://localhost:3001/api/attendance?date=2024-07-09&section_id=1
```

### 6. AI Features (if API key is configured)
```bash
# Generate study material
POST http://localhost:3001/api/ai/generate-study-material
Content-Type: application/json
{
  "topic": "Quadratic Equations",
  "subject": "Mathematics",
  "class_level": 10,
  "material_type": "summary",
  "language": "english"
}

# AI tutoring
POST http://localhost:3001/api/ai/tutoring
Content-Type: application/json
{
  "student_id": 1,
  "question": "How do I solve quadratic equations?",
  "subject": "Mathematics",
  "language": "english"
}
```

## PowerShell Testing Commands

### Test Student Creation
```powershell
$studentData = @{
    admission_number = "2024001"
    first_name = "Ravi"
    last_name = "Kumar"
    date_of_birth = "2010-05-15"
    gender = "Male"
    address = "Village Road, Rural Area"
    admission_date = "2024-04-01"
    academic_year_id = 1
    category = "General"
    phone = "9876543210"
    email = "ravi.kumar@student.com"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3001/api/students -Method POST -Body $studentData -ContentType "application/json" | Select-Object -ExpandProperty Content
```

### Test Login
```powershell
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri http://localhost:3001/api/auth/login -Method POST -Body $loginData -ContentType "application/json"
$token = ($response.Content | ConvertFrom-Json).token
Write-Host "Token: $token"
```

## Common Response Codes
- 200: Success
- 201: Created successfully
- 400: Bad request (validation error)
- 401: Unauthorized
- 404: Not found
- 500: Server error

## Environment Variables for Postman
- `baseUrl`: http://localhost:3001
- `authToken`: Set this after successful login

## Notes
- All endpoints requiring authentication need the Authorization header: `Bearer TOKEN`
- The default admin credentials are: username: `admin`, password: `admin123`
- Student creation requires all mandatory fields as per the validator
- Some features (AI, WhatsApp) require API keys to be configured in environment variables
