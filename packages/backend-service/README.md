# EduManage Pro - Backend Service

A Node.js/Express API service with SQLite database for offline-first school management.

## Features

- **SQLite Database**: Local storage for offline functionality
- **RESTful API**: Express.js endpoints for all school management operations
- **Student Management**: Complete CRUD operations for students and parents
- **Data Validation**: Input validation using custom validators
- **Error Handling**: Comprehensive error handling and logging
- **Type Safety**: Full TypeScript implementation

## Architecture

```
src/
├── database/           # Database management and connection
│   └── DatabaseManager.ts
├── middleware/         # Express middleware
│   └── errorHandler.ts
├── routes/            # API route handlers
│   ├── students.ts
│   ├── teachers.ts
│   ├── classes.ts
│   ├── attendance.ts
│   ├── exams.ts
│   └── fees.ts
├── services/          # Business logic services
│   └── StudentService.ts
├── validators/        # Input validation
│   └── studentValidator.ts
├── utils/            # Utility functions
│   └── logger.ts
└── index.ts          # Main server file
```

## Database Location

- **Development**: `./data/edumanage.db` (project folder)
- **Production**: `%LOCALAPPDATA%\EduManage Pro\database\edumanage.db`

## API Endpoints

### Students
- `GET /api/students` - List students with pagination and filters
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/admission-number/:admissionNumber` - Get student by admission number
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Soft delete student
- `GET /api/students/:id/parents` - Get student's parents
- `POST /api/students/:id/parents` - Add parent to student

### Database Management
- `GET /api/database/status` - Get database status
- `POST /api/database/init` - Initialize database

### Health Check
- `GET /health` - Service health check

## Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Initialize database
npm run db:init
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=3001
NODE_ENV=development
DB_PATH=./data/edumanage.db
LOG_LEVEL=2
JWT_SECRET=your-secret-key
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. The API will be available at `http://localhost:3001`

## Integration with Electron

This backend service is designed to run within the Electron main process or as a child process, providing API endpoints for the React frontend to consume.

## Future Features

- Teacher management
- Class and subject management
- Attendance tracking
- Examination management
- Fee management
- Reports and analytics
- Cloud synchronization
- AI-powered insights
